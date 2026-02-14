import io, { Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

  /**
   * Connect to Socket.io server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';

        console.log(`🔵 [SOCKET] Attempting to connect to: ${this.url}/red-agent`);

        // Set a timeout for connection attempt (10 seconds)
        const connectionTimeout = window.setTimeout(() => {
          console.error('❌ [SOCKET] Connection timeout - server not responding');
          if (this.socket) {
            this.socket.disconnect();
          }
          reject(new Error('Socket.io connection timeout'));
        }, 10000);

        this.socket = io(`${this.url}/red-agent`, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
          auth: {
            token: token || ''
          },
          query: {
            token: token || ''
          }
        });

        this.socket.on('connect', () => {
          window.clearTimeout(connectionTimeout);
          console.log('✅ [SOCKET] Connected to red agent server');
          resolve();
        });

        this.socket.on('connect_error', (error: any) => {
          window.clearTimeout(connectionTimeout);
          console.error('❌ [SOCKET] Connection error:', {
            message: error?.message,
            code: error?.code,
            type: error?.type,
            fullError: error
          });
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 [SOCKET] Disconnected:', reason);
        });

        this.socket.on('error', (error: any) => {
          console.error('❌ [SOCKET] Socket error:', error);
        });
      } catch (error) {
        console.error('❌ [SOCKET] Failed to connect:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 [SOCKET] Disconnected');
    }
  }

  /**
   * Subscribe to exploitation logs
   */
  subscribeToExploitation(exploitationId: string, userId: string): void {
    if (!this.socket) {
      console.error('❌ [SOCKET] Not connected');
      return;
    }

    if (!exploitationId) {
      console.error('❌ [SOCKET] Cannot subscribe - exploitation ID is empty!');
      return;
    }

    console.log(`📡 [SOCKET] Subscribing to ${exploitationId}`);
    console.log(`   Socket connected: ${this.socket.connected}`);
    console.log(`   Socket ID: ${this.socket.id}`);

    this.socket.emit('subscribe_exploitation', {
      exploitation_id: exploitationId,
      user_id: userId
    });
    console.log(`✅ [SOCKET] Emit sent`);
  }

  /**
   * Listen for exploitation logs
   */
  onExploitationLog(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('exploitation_log', callback);
    }
  }

  /**
   * Listen for exploitation status updates
   */
  onExploitationStatus(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('exploitation_status', callback);
    }
  }

  /**
   * Listen for meterpreter output
   */
  onMeterpreterOutput(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('meterpreter_output', callback);
    }
  }

  /**
   * Execute command on meterpreter session
   */
  executeCommand(exploitationId: string, command: string): void {
    if (!this.socket) {
      console.error('❌ [SOCKET] Not connected');
      return;
    }

    console.log(`⚡ [SOCKET] Executing command: ${command}`);
    this.socket.emit('execute_command', {
      exploitation_id: exploitationId,
      command: command
    });
  }

  /**
   * Listen for errors
   */
  onError(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();
