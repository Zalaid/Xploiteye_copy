"""
Enhanced logging configuration for XploitEye Backend
Provides meaningful, contextual log messages for better debugging
"""

import logging
import sys
from datetime import datetime
import os

class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors and meaningful context"""

    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
        'RESET': '\033[0m'       # Reset
    }

    def format(self, record):
        # Add color based on log level
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        reset = self.COLORS['RESET']

        # Create the timestamp
        import time
        record.asctime = time.strftime('%H:%M:%S', time.localtime(record.created))

        # Create custom format with colors
        log_format = f"{color}[{record.levelname}]{reset} {record.asctime} - {record.getMessage()}"

        return log_format

class ScanningLogger:
    """Custom logger for scanning operations with contextual messages"""

    def __init__(self, name="xploiteye_scanning"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)

        # Remove existing handlers to avoid duplicates
        if self.logger.handlers:
            self.logger.handlers.clear()

        # Create console handler with custom formatter
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(ColoredFormatter())

        self.logger.addHandler(console_handler)
        self.logger.propagate = False

    def scan_started(self, scan_id: str, target: str, scan_type: str, user_id: str):
        """Log when a scan starts"""
        scan_id_short = scan_id[:8] if len(scan_id) > 8 else scan_id
        user_id_short = user_id[:8] if len(user_id) > 8 else user_id
        self.logger.info("🚀 SCAN STARTED → %s scan of %s (ID: %s...) for user %s...", scan_type.upper(), target, scan_id_short, user_id_short)

    def scan_status_check(self, scan_id: str, status: str, target: str):
        """Log status checks with context"""
        status_icons = {
            'pending': '⏳',
            'running': '🔄',
            'completed': '✅',
            'failed': '❌',
            'cancelled': '🛑'
        }
        icon = status_icons.get(status, '📊')
        scan_id_short = scan_id[:8] if len(scan_id) > 8 else scan_id
        self.logger.info("%s STATUS CHECK → %s scan (%s...) is %s", icon, target, scan_id_short, status.upper())

    def scan_completed(self, scan_id: str, target: str, duration: float):
        """Log when a scan completes"""
        scan_id_short = scan_id[:8] if len(scan_id) > 8 else scan_id
        self.logger.info("✅ SCAN COMPLETED → %s scan (%s...) finished in %.1fs", target, scan_id_short, duration)

    def scan_failed(self, scan_id: str, target: str, error: str):
        """Log when a scan fails"""
        scan_id_short = scan_id[:8] if len(scan_id) > 8 else scan_id
        self.logger.error("❌ SCAN FAILED → %s scan (%s...) failed: %s", target, scan_id_short, error)

    def vpn_switch(self, reason: str = "rate limit"):
        """Log VPN switching with reason"""
        self.logger.warning("🔄 VPN SWITCH → Switching VPN due to %s", reason)

    def cve_processing(self, scan_id: str, cve_count: int, target: str):
        """Log CVE processing"""
        scan_id_short = scan_id[:8] if len(scan_id) > 8 else scan_id
        self.logger.info("🔍 CVE PROCESSING → Found %d vulnerabilities for %s (scan %s...)", cve_count, target, scan_id_short)

    def file_generated(self, file_type: str, filename: str, target: str):
        """Log file generation"""
        import os
        clean_filename = os.path.basename(filename)
        self.logger.info("📄 FILE GENERATED → %s report created: %s for %s", file_type.upper(), clean_filename, target)

    def polling_stopped(self, scan_id: str, reason: str):
        """Log when polling stops"""
        scan_id_short = scan_id[:8] if len(scan_id) > 8 else scan_id
        self.logger.info("⏹️  POLLING STOPPED → Stopped checking scan %s... (%s)", scan_id_short, reason)

    def auth_event(self, event: str, user_id: str):
        """Log authentication events"""
        user_id_short = user_id[:8] if len(user_id) > 8 else user_id
        self.logger.info("🔐 AUTH → %s for user %s...", event, user_id_short)

    def database_event(self, action: str, collection: str, count: int = None):
        """Log database operations"""
        if count:
            self.logger.info("💾 DATABASE → %s in %s (%d records)", action, collection, count)
        else:
            self.logger.info("💾 DATABASE → %s in %s", action, collection)

# Global scanning logger instance
scanning_logger = ScanningLogger()

def setup_uvicorn_logging():
    """Configure uvicorn to use our custom logging"""
    # Disable uvicorn access logs to reduce noise
    uvicorn_logger = logging.getLogger("uvicorn.access")
    uvicorn_logger.disabled = True

    # Keep uvicorn error logs but make them cleaner
    uvicorn_error_logger = logging.getLogger("uvicorn.error")
    uvicorn_error_logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(ColoredFormatter())
    uvicorn_error_logger.addHandler(handler)
    uvicorn_error_logger.propagate = False

def log_meaningful_startup():
    """Log meaningful startup information"""
    scanning_logger.logger.info("🌟 XploitEye Backend Starting...")
    scanning_logger.logger.info(f"📅 Started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    scanning_logger.logger.info("🔧 Initializing scanning engine...")
    scanning_logger.logger.info("🌐 Setting up network scanning capabilities...")

def log_meaningful_shutdown():
    """Log meaningful shutdown information"""
    scanning_logger.logger.info("🛑 XploitEye Backend Shutting Down...")
    scanning_logger.logger.info("💾 Closing database connections...")
    scanning_logger.logger.info("✨ Shutdown complete!")