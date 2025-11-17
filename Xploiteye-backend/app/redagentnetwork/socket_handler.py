"""
Socket.io Handler for Real-time Exploitation Logs and Meterpreter Shell
Handles real-time communication between backend exploitation and frontend UI
"""

import logging
import asyncio
from typing import Dict, Set
from datetime import datetime
import json
from socketio import AsyncServer, AsyncNamespace

logger = logging.getLogger("red_agent")  # Use same logger as nodes and services

# Store active socket connections
active_connections: Dict[str, Set[str]] = {}  # exploitation_id -> set of socket_ids
exploitation_sockets: Dict[str, str] = {}  # socket_id -> exploitation_id

class RedAgentNamespace(AsyncNamespace):
    """Socket.io namespace for red agent real-time communication"""

    async def on_any(self, event, *args):
        """Catch all events for debugging"""
        print(f"\n📡 [SOCKET DEBUG] Event: {event}, Args: {args}")

    async def on_connect(self, sid, environ):
        """Handle client connection"""
        try:
            print(f"\n✅ [SOCKET] Client connected: {sid}")
            logger.info(f"[SOCKET] 🔵 New connection: {sid}")

            # Always accept connections
            return True
        except Exception as e:
            print(f"❌ [SOCKET] Connection error: {e}")
            logger.error(f"[SOCKET] ❌ Connection error: {e}")
            return True

    async def on_disconnect(self, sid):
        """Handle client disconnection"""
        logger.info(f"[SOCKET] Client disconnected: {sid}")
        # Clean up exploitation tracking
        if sid in exploitation_sockets:
            exploitation_id = exploitation_sockets[sid]
            if exploitation_id in active_connections:
                active_connections[exploitation_id].discard(sid)
                if not active_connections[exploitation_id]:
                    del active_connections[exploitation_id]
            del exploitation_sockets[sid]

    async def on_subscribe_exploitation(self, sid, data):
        """
        Subscribe to exploitation logs
        data: {
            "exploitation_id": "user_id_target_port_timestamp",
            "user_id": "user_id"
        }
        """
        print(f"\n🔔 [SOCKET] on_subscribe_exploitation called - SID: {sid}, Data: {data}")
        logger.info(f"🔔 [SOCKET] Subscription request from {sid}")

        exploitation_id = data.get("exploitation_id")
        user_id = data.get("user_id")

        if not exploitation_id:
            logger.warning(f"[SOCKET] ❌ Invalid subscription - no exploitation_id")
            return

        # Track connection
        if exploitation_id not in active_connections:
            active_connections[exploitation_id] = set()
        active_connections[exploitation_id].add(sid)
        exploitation_sockets[sid] = exploitation_id

        print(f"✅ [SOCKET] {sid} subscribed to {exploitation_id}")
        logger.info(f"✅ [SOCKET] {sid} subscribed to {exploitation_id} | Total for this ID: {len(active_connections[exploitation_id])}")
        await self.emit("subscription_confirmed", {"exploitation_id": exploitation_id}, to=sid)

    async def on_execute_command(self, sid, data):
        """
        Execute command on meterpreter session
        data: {
            "exploitation_id": "user_id_target_port_timestamp",
            "command": "ls"
        }
        """
        exploitation_id = data.get("exploitation_id")
        command = data.get("command")

        if not exploitation_id or not command:
            logger.warning(f"[SOCKET] Invalid command from {sid}")
            await self.emit("error", {"message": "Invalid command format"}, to=sid)
            return

        logger.info(f"[SOCKET] 🔨 Command from {sid}: {command}")

        # Send command received acknowledgment
        await self.emit(
            "command_received",
            {
                "exploitation_id": exploitation_id,
                "command": command,
                "timestamp": datetime.utcnow().isoformat()
            },
            to=sid
        )

        # Queue command for async processing
        asyncio.create_task(
            self._execute_command_async(exploitation_id, command, sid)
        )

    async def _execute_command_async(self, exploitation_id: str, command: str, sid: str):
        """
        Execute command asynchronously and send output back to client
        """
        try:
            # Try to execute the command via Metasploit
            from .utils.msf_client import connect_to_msf_rpc

            # Get Metasploit RPC connection
            client, error = connect_to_msf_rpc()

            if error:
                logger.error(f"[SOCKET] ❌ MSF connection failed: {error}")
                await self.broadcast_exploitation_log(exploitation_id, {
                    "type": "error",
                    "content": f"Failed to connect to Metasploit RPC: {error}",
                    "timestamp": datetime.utcnow().isoformat()
                })
                return

            # Get active sessions
            sessions = client.sessions.list

            if not sessions:
                logger.warning(f"[SOCKET] ⚠️ No active Metasploit sessions")
                await self.broadcast_exploitation_log(exploitation_id, {
                    "type": "warning",
                    "content": "No active Metasploit sessions. Run exploitation first.",
                    "timestamp": datetime.utcnow().isoformat()
                })
                return

            # Get the first available session (usually the primary one)
            session_id = list(sessions.keys())[0]
            session = client.sessions.session(session_id)

            logger.info(f"[SOCKET] 📨 Executing command on session {session_id}: {command}")

            # Execute command and get output
            output = session.run_shell_cmd(command)

            if output:
                logger.info(f"[SOCKET] ✅ Command output received ({len(output)} bytes)")
                await self.broadcast_exploitation_log(exploitation_id, {
                    "type": "success",
                    "content": output,
                    "timestamp": datetime.utcnow().isoformat()
                })
            else:
                logger.warning(f"[SOCKET] ⚠️ Command executed but no output")
                await self.broadcast_exploitation_log(exploitation_id, {
                    "type": "info",
                    "content": "(Command executed - no output)",
                    "timestamp": datetime.utcnow().isoformat()
                })

        except Exception as e:
            error_msg = str(e)
            logger.error(f"[SOCKET] ❌ Command execution failed: {error_msg}")
            await self.broadcast_exploitation_log(exploitation_id, {
                "type": "error",
                "content": f"Command failed: {error_msg}",
                "timestamp": datetime.utcnow().isoformat()
            })

    async def broadcast_exploitation_log(self, exploitation_id: str, log_data: dict):
        """
        Broadcast log message to all clients subscribed to this exploitation
        log_data: {
            "timestamp": "2025-11-17T12:00:00",
            "type": "info|success|error|exploit|warning",
            "content": "Log message content"
        }
        """
        if exploitation_id in active_connections:
            num_clients = len(active_connections[exploitation_id])
            logger.info(f"[SOCKET] 📤 Broadcasting log to {num_clients} client(s): {log_data.get('content', '')[:60]}")
            await self.emit(
                "exploitation_log",
                {
                    "exploitation_id": exploitation_id,
                    **log_data
                },
                to=list(active_connections[exploitation_id])
            )
        else:
            logger.warning(f"[SOCKET] ⚠️ No clients subscribed to {exploitation_id} - log dropped: {log_data.get('content', '')[:60]}")

    async def broadcast_exploitation_status(self, exploitation_id: str, status_data: dict):
        """
        Broadcast status update to all clients subscribed to this exploitation
        status_data: {
            "status": "running|completed|failed",
            "completed": 0,
            "running": 0,
            "pending": 0,
            "root_access": 0,
            "sessions_opened": 0,
            "progress": 0
        }
        """
        if exploitation_id in active_connections:
            await self.emit(
                "exploitation_status",
                {
                    "exploitation_id": exploitation_id,
                    **status_data
                },
                to=list(active_connections[exploitation_id])
            )

    async def broadcast_meterpreter_output(self, exploitation_id: str, output: str):
        """Broadcast meterpreter command output"""
        if exploitation_id in active_connections:
            await self.emit(
                "meterpreter_output",
                {
                    "exploitation_id": exploitation_id,
                    "output": output,
                    "timestamp": datetime.utcnow().isoformat()
                },
                to=list(active_connections[exploitation_id])
            )


