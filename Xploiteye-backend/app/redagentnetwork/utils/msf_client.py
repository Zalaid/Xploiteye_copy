"""
Metasploit RPC Client
Handles connection to Metasploit RPC server
"""

import os
from typing import Optional, Tuple
from pymetasploit3.msfrpc import MsfRpcClient


def connect_to_msf_rpc(
    host: str = None,
    port: int = None,
    password: str = None,
    ssl: bool = None
) -> Tuple[Optional[MsfRpcClient], Optional[str]]:
    """
    Connect to Metasploit RPC server.

    Args:
        host: RPC host (default: from env MSF_RPC_HOST)
        port: RPC port (default: from env MSF_RPC_PORT)
        password: RPC password (default: from env MSF_RPC_PASSWORD)
        ssl: Use SSL (default: from env MSF_RPC_SSL)

    Returns:
        Tuple of (MsfRpcClient instance or None, error message or None)

    Example:
        client, error = connect_to_msf_rpc()
        if error:
            print(f"Connection failed: {error}")
        else:
            print(f"Connected to Metasploit {client.core.version['version']}")
    """

    # Load from environment if not provided
    if host is None:
        host = os.getenv("MSF_RPC_HOST", "127.0.0.1")

    if port is None:
        port = int(os.getenv("MSF_RPC_PORT", "55553"))

    if password is None:
        password = os.getenv("MSF_RPC_PASSWORD")
        if not password:
            return None, "MSF_RPC_PASSWORD not set in .env file"

    if ssl is None:
        ssl = os.getenv("MSF_RPC_SSL", "true").lower() == "true"

    # Attempt connection
    try:
        client = MsfRpcClient(
            password=password,
            server=host,
            port=port,
            ssl=ssl
        )

        # Test connection by getting version
        version = client.core.version

        return client, None

    except ConnectionRefusedError:
        error_msg = (
            "Metasploit RPC connection refused!\n\n"
            "Is msfrpcd running?\n"
            "  Check status: sudo systemctl status msfrpcd\n"
            "  Start it:     sudo systemctl start msfrpcd\n"
        )
        return None, error_msg

    except Exception as e:
        error_msg = (
            f"Failed to connect to Metasploit RPC: {str(e)}\n\n"
            f"Connection details:\n"
            f"  Host: {host}\n"
            f"  Port: {port}\n"
            f"  SSL: {ssl}\n\n"
            f"Troubleshooting:\n"
            f"  1. Check if msfrpcd is running: sudo systemctl status msfrpcd\n"
            f"  2. Verify password in .env matches systemd service\n"
            f"  3. Check firewall settings\n"
        )
        return None, error_msg


def test_msf_connection() -> bool:
    """
    Quick test to see if Metasploit RPC is accessible.

    Returns:
        True if connection successful, False otherwise
    """
    client, error = connect_to_msf_rpc()

    if error:
        return False

    return True


def get_msf_version() -> Optional[str]:
    """
    Get Metasploit Framework version.

    Returns:
        Version string or None if connection failed
    """
    client, error = connect_to_msf_rpc()

    if error:
        return None

    try:
        version_info = client.core.version
        return version_info.get('version', 'Unknown')
    except:
        return None
