"""
Log Broadcaster - Sends logs to Socket.io clients in real-time via HTTP API
"""

import logging
import asyncio
from datetime import datetime
from typing import Optional
import requests
import threading
from queue import Queue
import time

# Disable verbose debug logging from third-party libraries
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)
logging.getLogger("openai").setLevel(logging.WARNING)
logging.getLogger("openai._base_client").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("httpcore.connection").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

# Global queue for log dispatch
_log_queue = Queue(maxsize=10000)
_dispatch_thread = None

def _start_log_dispatcher():
    """Start background thread that sends logs from queue"""
    global _dispatch_thread
    if _dispatch_thread is None or not _dispatch_thread.is_alive():
        _dispatch_thread = threading.Thread(target=_dispatch_logs_worker, daemon=True)
        _dispatch_thread.start()

def _dispatch_logs_worker():
    """Worker thread that processes log queue"""
    session = requests.Session()
    session.timeout = 2

    while True:
        try:
            # Get log from queue with timeout to allow graceful shutdown
            try:
                log_data = _log_queue.get(timeout=5)
            except:
                continue

            # Send the log
            try:
                response = session.post(
                    f"{log_data['socket_server_url']}/api/store-log",
                    json={
                        'exploitation_id': log_data['exploitation_id'],
                        'type': log_data['type'],
                        'content': log_data['content'],
                        'timestamp': log_data['timestamp'],
                        'level': log_data['level']
                    },
                    timeout=2
                )
                if response.status_code != 200:
                    print(f"⚠️ [LOG_DISPATCH] Failed: {response.status_code}")
            except Exception as e:
                print(f"⚠️ [LOG_DISPATCH] Error: {str(e)[:50]}")

        except Exception as e:
            print(f"❌ [LOG_DISPATCH] Unhandled error: {e}")
            time.sleep(1)

class SocketIOLogHandler(logging.Handler):
    """Custom logging handler that broadcasts logs via Socket.io HTTP API"""

    def __init__(self, exploitation_id: str, socket_server_url: str = "http://localhost:5001"):
        super().__init__()
        self.exploitation_id = exploitation_id
        self.socket_server_url = socket_server_url

        # Start the dispatcher if not already running
        _start_log_dispatcher()

    def emit(self, record: logging.LogRecord):
        """Emit a log record to Socket.io clients via HTTP API"""
        try:
            log_message = self.format(record)

            # Determine log type based on level
            level_name = record.levelname.lower()
            if level_name == 'error':
                log_type = 'error'
            elif level_name == 'warning':
                log_type = 'warning'
            elif level_name == 'debug':
                log_type = 'info'
            else:
                log_type = 'info'

            # Create log data
            log_data = {
                'exploitation_id': self.exploitation_id,
                'type': log_type,
                'content': log_message,
                'timestamp': datetime.utcnow().isoformat(),
                'level': record.levelname,
                'socket_server_url': self.socket_server_url
            }

            # Add to queue (non-blocking)
            try:
                _log_queue.put_nowait(log_data)
            except:
                # Queue full, skip this log
                pass

        except Exception:
            self.handleError(record)

def setup_socket_logging(logger: logging.Logger, exploitation_id: str, socket_server_url: str = "http://localhost:5001"):
    """
    Setup Socket.io logging for a specific exploitation

    Args:
        logger: Logger instance to attach handler to
        exploitation_id: ID of the exploitation for routing logs
        socket_server_url: URL of the Socket.io server (default: http://localhost:5001)
    """
    # Create and add the Socket.io handler
    socket_handler = SocketIOLogHandler(exploitation_id, socket_server_url)
    socket_handler.setLevel(logging.DEBUG)  # Capture all log levels

    # Format: [timestamp] message
    formatter = logging.Formatter('[%(asctime)s] %(message)s', datefmt='%H:%M:%S')
    socket_handler.setFormatter(formatter)

    # Add to provided logger
    logger.addHandler(socket_handler)
    logger.setLevel(logging.DEBUG)

    # ALSO add to root logger so ALL loggers inherit it (workflow nodes create their own loggers)
    root_logger = logging.getLogger()
    root_logger.addHandler(socket_handler)
    root_logger.setLevel(logging.DEBUG)

    print(f"✅ [LOG_SETUP] Socket.io handler for {exploitation_id} added to ROOT logger")
    print(f"📤 [LOG_SETUP] Log dispatcher running in background thread")
    print(f"🔗 [LOG_SETUP] Socket server URL: {socket_server_url}")

    return socket_handler

def remove_socket_logging(logger: logging.Logger, handler: SocketIOLogHandler):
    """Remove Socket.io logging handler"""
    if handler:
        try:
            logger.removeHandler(handler)
            handler.close()
            print(f"✅ [LOG_CLEANUP] Socket.io handler removed")
        except Exception as e:
            print(f"⚠️ [LOG_CLEANUP] Error removing handler: {e}")
