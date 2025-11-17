"""
Socket.io Server for Real-time Exploitation Logs
Runs on port 5001 separately from FastAPI main server
Provides both WebSocket (Socket.io) and HTTP endpoints for log broadcasting
"""

import uvicorn
from socketio import AsyncServer, ASGIApp
from app.redagentnetwork.socket_handler import RedAgentNamespace
import logging
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import Dict

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

print("\n" + "="*70)
print("🔌 Socket.io Server Starting...")
print("="*70)

# Create Socket.io server with CORS enabled for all origins
# Important: Use '*' as string to allow all origins
sio = AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # Allow all origins as a string
    ping_timeout=60,
    ping_interval=25,
    engineio_logger=False,
    socketio_logger=False,
    logger=logger,
    async_handlers=True,
)

print("✅ Socket.io server created with CORS enabled for all origins")

# Register the red agent namespace
red_agent_ns = RedAgentNamespace('/red-agent')
sio.register_namespace(red_agent_ns)
print("✅ Red Agent namespace registered at /red-agent")

# Create FastAPI app for HTTP endpoints
fastapi_app = FastAPI(title="Socket.io Server with HTTP API")

# Add CORS middleware
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP endpoint to broadcast logs from backend
@fastapi_app.post("/api/broadcast-log")
async def broadcast_log(request: Request):
    """
    HTTP endpoint to receive logs from main FastAPI server and broadcast via Socket.io

    POST body:
    {
        "exploitation_id": "...",
        "type": "info|error|warning|success|exploit",
        "content": "log message",
        "timestamp": "ISO timestamp"
    }
    """
    try:
        data = await request.json()
        exploitation_id = data.get("exploitation_id")

        if not exploitation_id:
            return {"status": "error", "message": "Missing exploitation_id"}

        # Broadcast the log via Socket.io
        await red_agent_ns.broadcast_exploitation_log(
            exploitation_id,
            {
                "type": data.get("type", "info"),
                "content": data.get("content", ""),
                "timestamp": data.get("timestamp", ""),
                "level": data.get("level", "INFO")
            }
        )

        logger.info(f"✅ Log broadcasted: {data.get('content', '')[:60]}")
        return {"status": "success", "message": "Log broadcasted"}
    except Exception as e:
        logger.error(f"❌ Error broadcasting log: {e}")
        return {"status": "error", "message": str(e)}

# HTTP endpoint to broadcast status updates
@fastapi_app.post("/api/broadcast-status")
async def broadcast_status(request: Request):
    """
    HTTP endpoint to receive status updates from main FastAPI server

    POST body:
    {
        "exploitation_id": "...",
        "status": "running|completed|failed",
        "completed": 0,
        "running": 1,
        "pending": 0,
        "root_access": 0,
        "sessions_opened": 0,
        "progress": 0
    }
    """
    try:
        data = await request.json()
        exploitation_id = data.get("exploitation_id")

        if not exploitation_id:
            return {"status": "error", "message": "Missing exploitation_id"}

        # Broadcast the status via Socket.io
        await red_agent_ns.broadcast_exploitation_status(
            exploitation_id,
            data
        )

        logger.info(f"✅ Status broadcasted for {exploitation_id}: {data.get('status')}")
        return {"status": "success", "message": "Status broadcasted"}
    except Exception as e:
        logger.error(f"❌ Error broadcasting status: {e}")
        return {"status": "error", "message": str(e)}

# Health check endpoint
@fastapi_app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Socket.io Server"}

# Store logs in memory for polling
logs_store: Dict[str, list] = {}

@fastapi_app.get("/api/get-logs/{exploitation_id}")
async def get_logs(exploitation_id: str):
    """Poll endpoint to get logs for an exploitation"""
    logs = logs_store.get(exploitation_id, [])
    return {"logs": logs, "exploitation_id": exploitation_id}

@fastapi_app.post("/api/store-log")
async def store_log(request: Request):
    """Store a log for polling"""
    try:
        data = await request.json()
        exploitation_id = data.get("exploitation_id")

        if not exploitation_id:
            return {"status": "error", "message": "Missing exploitation_id"}

        # Store the log
        if exploitation_id not in logs_store:
            logs_store[exploitation_id] = []

        logs_store[exploitation_id].append({
            "type": data.get("type", "info"),
            "content": data.get("content", ""),
            "timestamp": data.get("timestamp", ""),
            "level": data.get("level", "INFO")
        })

        # Keep only last 1000 logs per exploitation
        if len(logs_store[exploitation_id]) > 1000:
            logs_store[exploitation_id] = logs_store[exploitation_id][-1000:]

        logger.info(f"✅ Log stored for {exploitation_id}: {data.get('content', '')[:60]}")
        return {"status": "success", "message": "Log stored"}
    except Exception as e:
        logger.error(f"❌ Error storing log: {e}")
        return {"status": "error", "message": str(e)}

# Wrap Socket.io with FastAPI
app = ASGIApp(sio, fastapi_app)

if __name__ == "__main__":
    print("\n📡 Configuration:")
    print("   - Host: 0.0.0.0")
    print("   - Port: 5001")
    print("   - CORS: Enabled for all origins")
    print("   - WebSocket endpoint: ws://localhost:5001/socket.io/")
    print("   - Red Agent namespace: /red-agent")
    print("   - HTTP API endpoints:")
    print("     • POST /api/broadcast-log (receive logs from main server)")
    print("     • POST /api/broadcast-status (receive status updates)")
    print("     • GET /health (health check)")
    print("\n" + "="*70)
    print("🚀 Server starting...\n")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5001,
        log_level="info"
    )
