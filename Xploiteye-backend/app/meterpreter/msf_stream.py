import pexpect
import threading
import time
import logging

logger = logging.getLogger("red_agent.meterpreter")

class MsfStream:
    """Manage msfconsole process for interactive meterpreter exploitation"""

    def __init__(self, exploitation_id: str):
        self.exploitation_id = exploitation_id
        self.proc = None
        self.buffer = ""
        self.lock = threading.Lock()
        self.has_new_data = False
        self.is_running = False

        logger.info(f"[{exploitation_id}] Starting Metasploit console...")
        try:
            self.proc = pexpect.spawn("msfconsole -q", encoding="utf-8", timeout=None)
            self.proc.timeout = None
            self.proc.maxread = 4096
            self.is_running = True
            logger.info(f"[{exploitation_id}] ✅ msfconsole started")
        except Exception as e:
            logger.error(f"[{exploitation_id}] ❌ Failed to start msfconsole: {e}")
            self.is_running = False
            raise

        # Start background output reader thread
        threading.Thread(target=self._read_output, daemon=True).start()

    def _read_output(self):
        """Background thread to continuously read msfconsole output"""
        while self.is_running:
            try:
                # Read any available data
                data = self.proc.read_nonblocking(size=4096, timeout=0.05)
                if data:
                    with self.lock:
                        self.buffer += data
                        self.has_new_data = True
                        logger.debug(f"[{self.exploitation_id}] Captured {len(data)} bytes")
            except pexpect.exceptions.TIMEOUT:
                time.sleep(0.005)
            except Exception as e:
                if self.is_running:
                    logger.debug(f"[{self.exploitation_id}] Read error: {type(e).__name__}")
                time.sleep(0.005)

    def run(self, cmd: str):
        """Send command to msfconsole"""
        if not self.is_running:
            logger.error(f"[{self.exploitation_id}] Cannot run command - msfconsole not running")
            return

        logger.info(f"[{self.exploitation_id}] Running: {cmd}")
        try:
            with self.lock:
                self.buffer = ""
                self.has_new_data = False
            self.proc.sendline(cmd)
            # Give command time to execute
            time.sleep(0.1)
        except Exception as e:
            logger.error(f"[{self.exploitation_id}] Error sending command: {e}")

    def get_output(self) -> str:
        """Get buffered output"""
        with self.lock:
            data = self.buffer
            self.buffer = ""
            self.has_new_data = False
            return data

    def has_data(self) -> bool:
        """Check if new data is available"""
        with self.lock:
            return self.has_new_data

    def cleanup(self):
        """Clean shutdown of msfconsole"""
        if not self.is_running:
            return

        logger.info(f"[{self.exploitation_id}] Cleaning up msfconsole...")
        self.is_running = False

        try:
            # Try graceful exit
            self.proc.sendline("exit")
            time.sleep(1)
        except:
            pass

        try:
            # Force terminate if still running
            if self.proc.isalive():
                self.proc.terminate()
                time.sleep(0.5)
        except:
            pass

        try:
            # Last resort: kill
            if self.proc and self.proc.isalive():
                self.proc.kill()
        except:
            pass

        logger.info(f"[{self.exploitation_id}] ✅ Cleanup complete")

# Global reference to current exploitation
current_exploitation: dict = {
    "id": None,
    "msf": None
}
