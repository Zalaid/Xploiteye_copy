"""
Socket.io Server for Real-time Exploitation Logs
Runs on port 5001 separately from FastAPI main server
"""

import uvicorn
from socketio import AsyncServer, ASGIApp
from app.redagentnetwork.socket_handler import RedAgentNamespace
import logging
import sys

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# Create Socket.io server with minimal restrictions
sio = AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['*'],
    ping_timeout=60,
    ping_interval=25,
    engineio_logger=True,
    socketio_logger=True,
    logger=logger
)

logger.info("🔌 Socket.io server created")

# Register the red agent namespace

sio.register_namespace(RedAgentNamespace('/red-agent'))
logger.info("🔌 Red Agent namespace registered at /red-agent")

# Wrap with ASGI app
socket_app = ASGIApp(sio)

# Create a middleware wrapper to handle 403 rejection
async def app(scope, receive, send):
    """
    ASGI app that allows all Socket.io connections
    """
    if scope['type'] == 'websocket':
        path = scope.get('path', '')
        logger.info(f"🔵 WebSocket connection to {path}")

    # Pass through to Socket.io app
    await socket_app(scope, receive, send)

if __name__ == "__main__":
    logger.info("🔌 Starting Socket.io server on port 5001...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5001,
        log_level="info"
    )
