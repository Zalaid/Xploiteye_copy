"""
Session Manager
Creates unique session directories for each exploitation attempt
"""

import os
from pathlib import Path
from datetime import datetime
from typing import Dict


def create_session_directory(state: Dict) -> Dict:
    """
    Create unique session directory structure for this exploitation.

    Args:
        state: Current Red Agent state containing target, port, service

    Returns:
        Updated state with session directory paths

    Directory structure created:
        exploitations/
        └── exploit_{target}_{port}_{service}_{timestamp}/
            ├── logs/
            ├── reports/
            ├── loot/
            ├── temp/
            └── evidence/
    """

    # Generate timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Clean target IP (replace dots with underscores)
    target_clean = state["target"].replace(".", "_")

    # Get service name (or "unknown" if not provided)
    service = state.get("service", "unknown")

    # Get port
    port = state["port"]

    # Create session folder name
    # Format: exploit_{target}_{port}_{service}_{timestamp}
    session_name = f"exploit_{target_clean}_{port}_{service}_{timestamp}"

    # Get base directory (where Red Agent is located)
    base_dir = Path(__file__).parent.parent

    # Create full session directory path
    session_dir = base_dir / "exploitations" / session_name

    # Create all subdirectories
    subdirs = ["logs", "reports", "loot", "temp", "evidence"]

    for subdir in subdirs:
        subdir_path = session_dir / subdir
        subdir_path.mkdir(parents=True, exist_ok=True)

    # Update state with all directory paths
    state["session_dir"] = str(session_dir)
    state["session_name"] = session_name
    state["log_file"] = str(session_dir / "logs" / "red_agent.log")
    state["report_dir"] = str(session_dir / "reports")
    state["loot_dir"] = str(session_dir / "loot")
    state["temp_dir"] = str(session_dir / "temp")
    state["evidence_dir"] = str(session_dir / "evidence")

    return state


def get_latest_session(base_dir: Path = None) -> Path:
    """
    Get the most recent session directory.

    Args:
        base_dir: Base directory to search (default: Red agent/exploitations/)

    Returns:
        Path to the latest session directory
    """
    if base_dir is None:
        base_dir = Path(__file__).parent.parent / "exploitations"

    if not base_dir.exists():
        raise FileNotFoundError(f"Exploitations directory not found: {base_dir}")

    # Get all session directories
    sessions = [d for d in base_dir.iterdir() if d.is_dir() and d.name.startswith("exploit_")]

    if not sessions:
        raise FileNotFoundError("No session directories found")

    # Sort by modification time (most recent first)
    sessions.sort(key=lambda x: x.stat().st_mtime, reverse=True)

    return sessions[0]
