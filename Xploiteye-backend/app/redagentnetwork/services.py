"""
Red Agent Service
Handles exploitation workflow orchestration
"""

import logging
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
import json

# Disable urllib3 debug logging
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)

# Import red agent workflow (local copies)
try:
    from .graph import run_workflow
    from .state import RedAgentState
    logging.info("✅ Red agent workflow imported successfully")
except ImportError as e:
    logging.error(f"❌ Could not import red agent workflow: {e}")
    run_workflow = None
    RedAgentState = None

# Import logging utilities
from .log_broadcaster import setup_socket_logging, remove_socket_logging

from app.models.user import UserInDB
from app.database.mongodb import get_database

# Use same logger name as nodes for consistent logging
logger = logging.getLogger("red_agent")


class RedAgentService:
    """Service for managing red agent exploitation workflows"""

    def __init__(self):
        self.active_exploitations: Dict[str, Dict] = {}
        self.db = None

    async def get_database(self):
        """Get database connection"""
        if self.db is None:
            self.db = await get_database()
        return self.db

    async def start_exploitation(
        self,
        target: str,
        port: int,
        service: str,
        version: str,
        cve_ids: List[str],
        user: UserInDB
    ) -> Dict:
        """
        Start a new exploitation workflow

        Args:
            target: Target IP address
            port: Target port
            service: Service name (ssh, ftp, http, etc.)
            version: Service version
            cve_ids: List of CVE identifiers
            user: User object for authentication

        Returns:
            Exploitation status response
        """
        exploitation_id = f"{user.id}_{target}_{port}_{datetime.utcnow().isoformat()}"

        # Validate target (no external IPs)
        if not self._is_local_network(target):
            return {
                "status": "error",
                "message": "Only local network targets are allowed (10.x, 172.16-31.x, 192.168.x, 127.x)",
                "exploitation_id": exploitation_id
            }

        # Create exploitation record
        exploitation_data = {
            "exploitation_id": exploitation_id,
            "user_id": user.id,
            "target": target,
            "port": port,
            "service": service,
            "version": version,
            "cve_ids": cve_ids,
            "started_at": datetime.utcnow(),
            "completed_at": None,
            "status": "in_progress",
            "result": None,
            "error": None,
            "logs_path": None
        }

        # Store in memory
        self.active_exploitations[exploitation_id] = exploitation_data

        # Store in database
        try:
            db = await self.get_database()
            await db.red_agent_exploitations.insert_one(exploitation_data)
        except Exception as e:
            logger.error(f"Failed to save exploitation to database: {e}")

        # Start workflow in background
        asyncio.create_task(
            self._execute_workflow(
                exploitation_id,
                target,
                port,
                service,
                version,
                cve_ids,
                user
            )
        )

        return {
            "status": "started",
            "exploitation_id": exploitation_id,
            "message": f"Exploitation workflow started for {target}:{port} ({service})",
            "target": target,
            "port": port,
            "service": service
        }

    async def _execute_workflow(
        self,
        exploitation_id: str,
        target: str,
        port: int,
        service: str,
        version: str,
        cve_ids: List[str],
        user: UserInDB
    ):
        """Execute the red agent workflow"""
        socket_handler = None
        print(f"\n\n=== WORKFLOW STARTED FOR {exploitation_id} ===")
        try:
            logger.info(f"Starting exploitation workflow: {exploitation_id}")

            # Setup Socket.io logging (sends logs to Socket.io server via HTTP)
            socket_handler = setup_socket_logging(
                logger,
                exploitation_id,
                socket_server_url="http://localhost:5001"
            )
            logger.info(f"✅ Socket.io logging initialized for {exploitation_id}")

            # Log exploitation start
            logger.info(f"🚀 Starting exploitation on {target}:{port}")
            logger.info(f"📝 Service: {service} v{version}")
            if cve_ids:
                logger.info(f"🎯 CVEs: {', '.join(cve_ids)}")

            # Broadcast status to frontend via HTTP
            try:
                import requests
                await asyncio.sleep(0.1)  # Small delay to ensure subscription
                requests.post(
                    "http://localhost:5001/api/broadcast-status",
                    json={
                        "exploitation_id": exploitation_id,
                        "status": "running",
                        "completed": 0,
                        "running": 1,
                        "pending": 0,
                        "root_access": 0,
                        "sessions_opened": 0,
                        "progress": 0
                    },
                    timeout=2
                )
            except Exception as e:
                logger.debug(f"Could not broadcast status: {e}")

            # Prepare initial state
            initial_state = {
                "target": target,
                "port": port,
                "service": service,
                "version": version,
                "cve_ids": cve_ids,
                "user_id": user.id,
                "exploitation_id": exploitation_id
            }

            # Run workflow
            if run_workflow is None:
                raise Exception("Red agent workflow not available")

            logger.info(f"🔄 Initializing workflow...")

            # Run workflow in a thread pool to prevent blocking async event loop
            import concurrent.futures
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as pool:
                result = await loop.run_in_executor(
                    pool,
                    run_workflow,
                    initial_state
                )

            logger.info(f"✅ Workflow execution completed")

            # Process results with better error handling
            try:
                exploitation_result = {
                    "validated": result.get("validated", False),
                    "target_reachable": result.get("target_reachable", False),
                    "port_open": result.get("port_open", False),
                    "msf_rpc_connected": result.get("msf_rpc_connected", False),
                    "os_type": result.get("os_type"),
                    "exploits_found": len(result.get("filtered_exploits", [])),
                    "exploits_selected": len(result.get("selected_exploits", [])),
                    "sessions_opened": len(result.get("successful_payloads", [])),
                    "is_root": result.get("is_root", False),
                    "primary_session_id": result.get("primary_session_id"),
                    "primary_session_type": result.get("primary_session_type"),
                    "pwn_rc_generated": result.get("pwn_rc_generated", False),
                    "log_file": result.get("log_file"),
                    "session_dir": result.get("session_dir"),
                    "full_result": result  # Store complete result for analysis
                }
            except Exception as e:
                logger.warning(f"⚠️ Error processing workflow results: {e}")
                exploitation_result = {
                    "validated": False,
                    "target_reachable": False,
                    "port_open": False,
                    "msf_rpc_connected": False,
                    "os_type": None,
                    "exploits_found": 0,
                    "exploits_selected": 0,
                    "sessions_opened": 0,
                    "is_root": False,
                    "primary_session_id": None,
                    "primary_session_type": None,
                    "pwn_rc_generated": False,
                    "log_file": None,
                    "session_dir": None,
                    "full_result": result if isinstance(result, dict) else str(result)
                }

            # Update exploitation status
            await self._update_exploitation_status(
                exploitation_id,
                "completed",
                exploitation_result
            )

            logger.info(f"Exploitation {exploitation_id} completed successfully")

        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ Exploitation {exploitation_id} failed: {error_msg}")
            logger.error(f"Error details: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            await self._update_exploitation_status(
                exploitation_id,
                "failed",
                None,
                error=error_msg
            )
        finally:
            # Cleanup socket logging
            if socket_handler:
                remove_socket_logging(logger, socket_handler)
                logger.debug(f"Socket.io logging handler removed for {exploitation_id}")

    async def _update_exploitation_status(
        self,
        exploitation_id: str,
        status: str,
        result: Optional[Dict] = None,
        error: Optional[str] = None
    ):
        """Update exploitation status in database"""
        update_data = {
            "status": status,
            "completed_at": datetime.utcnow()
        }

        if result:
            update_data["result"] = result

        if error:
            update_data["error"] = error

        # Update in memory
        if exploitation_id in self.active_exploitations:
            self.active_exploitations[exploitation_id].update(update_data)

        # Update in database
        try:
            db = await self.get_database()
            await db.red_agent_exploitations.update_one(
                {"exploitation_id": exploitation_id},
                {"$set": update_data}
            )
        except Exception as e:
            logger.error(f"Failed to update exploitation in database: {e}")

    async def get_exploitation_status(
        self,
        exploitation_id: str,
        user: UserInDB
    ) -> Optional[Dict]:
        """Get exploitation status and results"""
        # Check memory first
        if exploitation_id in self.active_exploitations:
            exploitation_data = self.active_exploitations[exploitation_id]
        else:
            # Check database
            try:
                db = await self.get_database()
                exploitation_data = await db.red_agent_exploitations.find_one(
                    {"exploitation_id": exploitation_id}
                )
                if not exploitation_data:
                    return None
            except Exception as e:
                logger.error(f"Failed to retrieve exploitation: {e}")
                return None

        # Verify user ownership
        if exploitation_data["user_id"] != user.id:
            return None

        return exploitation_data

    async def get_user_exploitations(
        self,
        user: UserInDB,
        limit: int = 50,
        skip: int = 0
    ) -> List[Dict]:
        """Get all exploitations for a user"""
        try:
            db = await self.get_database()
            cursor = db.red_agent_exploitations.find(
                {"user_id": user.id}
            ).sort("started_at", -1).skip(skip).limit(limit)

            exploitations = []
            async for exploitation in cursor:
                # Remove full_result for list view (too verbose)
                exploitation.pop("full_result", None)
                exploitations.append(exploitation)

            return exploitations

        except Exception as e:
            logger.error(f"Failed to retrieve user exploitations: {e}")
            return []

    def _is_local_network(self, ip: str) -> bool:
        """Check if IP is on local network"""
        parts = ip.split(".")
        if len(parts) != 4:
            return False

        try:
            a = int(parts[0])
            b = int(parts[1])

            # Class A: 10.0.0.0/8
            if a == 10:
                return True

            # Class B: 172.16.0.0/12
            if a == 172 and 16 <= b <= 31:
                return True

            # Class C: 192.168.0.0/16
            if a == 192 and b == 168:
                return True

            # Loopback: 127.0.0.0/8
            if a == 127:
                return True

            return False

        except (ValueError, IndexError):
            return False


# Global service instance
_red_agent_service = None


def get_red_agent_service() -> RedAgentService:
    """Get or create the red agent service instance"""
    global _red_agent_service
    if _red_agent_service is None:
        _red_agent_service = RedAgentService()
    return _red_agent_service
