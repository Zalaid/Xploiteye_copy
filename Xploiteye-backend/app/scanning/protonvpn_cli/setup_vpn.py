import subprocess
import time
import sys
import os
import glob
import logging
import random
import re

# --- Configuration (No more TRUE_IP_FILE) ---
VPN_CONFIG_BASE_PATH = "/home/kali/Desktop/xploiteye/Xploiteye-backend/app/scanning/protonvpn_cli/Regions"
OPENVPN_USERNAME = "QWcPAQ3LlSiV5dDk"
OPENVPN_PASSWORD = "Sb3dUAvLggK3kN9eFJj1cmb1ulW7YDK1"
# Credentials file removed - using direct credential passing
OPENVPN_LOG_FILE = "/tmp/openvpn.log"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - VPN_CTRL - %(levelname)s - %(message)s")
logger = logging.getLogger()

def get_current_ip():
    try:
        result = subprocess.run(["curl", "-s", "--max-time", "8", "api.ipify.org"], capture_output=True, text=True, timeout=10)
        return result.stdout.strip() if result.returncode == 0 and result.stdout.strip() else "Unknown"
    except Exception: return "Unknown"

def wait_for_ip_revert(target_ip, max_wait=20):
    logger.info(f"Forcefully disconnecting... Waiting for IP to revert to {target_ip}")
    subprocess.run(["sudo", "pkill", "-9", "-f", "openvpn"], capture_output=True)
    time.sleep(0.5)
    subprocess.run(["sudo", "ip", "link", "delete", "tun0"], stderr=subprocess.DEVNULL)
    time.sleep(1)
    start_time = time.time()
    while time.time() - start_time < max_wait:
        if get_current_ip() == target_ip:
            logger.info(f"✅ Disconnect successful. IP is now {target_ip}.")
            return True
        time.sleep(2)
    logger.error("❌ Disconnect failed. IP did not revert.")
    return False

def wait_for_ip_change(initial_ip, server_name, max_wait=25):
    logger.info(f"Waiting for connection via {server_name} (max {max_wait}s)...")
    start_time = time.time()
    while time.time() - start_time < max_wait:
        current_ip = get_current_ip()
        if current_ip != "Unknown" and current_ip != initial_ip:
            logger.info(f"✅ Connection successful! New IP: {current_ip}")
            return True
        time.sleep(2)
    logger.error(f"❌ Connection attempt via {server_name} timed out.")
    return False

def connect(region_code, true_public_ip):
    if not wait_for_ip_revert(true_public_ip): return False
    region_map = {"J": "Japan", "U": "USA", "N": "Netherlands", "I": "India"}
    region_path = os.path.join(VPN_CONFIG_BASE_PATH, region_map[region_code], "*.ovpn")
    files = glob.glob(region_path)
    if not files:
        logger.error(f"No .ovpn files found for {region_map[region_code]}")
        return False
    random.shuffle(files)
    for config_file in files[:3]:
        server_name = os.path.basename(config_file)
        logger.info(f"Attempting connection via random server: {server_name}...")
        # Create temporary credential file for this connection only
        temp_creds = f"/tmp/vpn_creds_{os.getpid()}.txt"
        with open(temp_creds, "w") as f: 
            f.write(f"{OPENVPN_USERNAME}\n{OPENVPN_PASSWORD}")
        os.chmod(temp_creds, 0o600)
        
        cmd = ["sudo", "openvpn", "--config", config_file, "--auth-user-pass", temp_creds, "--proto", "udp", "--daemon", "--log", OPENVPN_LOG_FILE]
        subprocess.run(["sudo", "pkill", "-9", "-f", "openvpn"], capture_output=True)
        subprocess.Popen(cmd)
        if wait_for_ip_change(true_public_ip, server_name):
            # Clean up temporary credential file
            try:
                os.remove(temp_creds)
            except:
                pass
            return True
        else:
            # Clean up temporary credential file on failure
            try:
                os.remove(temp_creds)
            except:
                pass
            logger.warning(f"Failed via {server_name}. Trying next random server...")
    logger.error(f"❌ Failed to connect to any server in region {region_code} after 3 random attempts.")
    return False

# create_credentials_file function removed - using temporary files instead

def main():
    # The script now expects the true IP as a command-line argument
    if len(sys.argv) < 3:
        print(f"Usage: python3 {sys.argv[0]} [connect REGION | disconnect] <TRUE_PUBLIC_IP>")
        sys.exit(1)

    if OPENVPN_USERNAME == "YOUR_USERNAME_HERE":
        logger.error("Please edit and set OPENVPN_USERNAME and OPENVPN_PASSWORD.")
        sys.exit(1)
        
# Credential file creation removed
    
    action = sys.argv[1].lower()
    success = False

    if action == "connect":
        if len(sys.argv) < 4:
            print(f"Usage: python3 {sys.argv[0]} connect <REGION> <TRUE_PUBLIC_IP>")
            sys.exit(1)
        region = sys.argv[2].upper()
        true_public_ip = sys.argv[3]
        success = connect(region, true_public_ip)
    elif action == "disconnect":
        true_public_ip = sys.argv[2]
        success = wait_for_ip_revert(true_public_ip)
    else:
        print(f"Invalid action: {action}")
        
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()