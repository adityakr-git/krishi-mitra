import { io, Socket } from 'socket.io-client';

export interface QueueUpdatePayload {
  mandiId: string;
  calledTokenId?: string;
  currentQueueLength: number;
  estimatedWaitMinutes: number;
  updatedTokens?: any[];
  timestamp?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private currentMandiRoom: string | null = null;

  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Connect to backend server on port 5000 or configured Render production URL
    const rawBackendUrl = import.meta.env.VITE_BACKEND_URL;
    const socketUrl = rawBackendUrl ? rawBackendUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '') : 'http://localhost:5000';
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log(`[SocketService] Connected to Real-Time Queue Hub (${this.socket?.id})`);
      if (this.currentMandiRoom) {
        this.socket?.emit('join_mandi', this.currentMandiRoom);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketService] Disconnected from Real-Time Queue Hub');
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  joinMandiRoom(mandiId: string) {
    this.currentMandiRoom = mandiId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_mandi', mandiId);
      console.log(`[SocketService] Joined Mandi room: mandi:${mandiId}`);
    } else {
      this.connect();
    }
  }

  leaveMandiRoom(mandiId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_mandi', mandiId);
    }
    this.currentMandiRoom = null;
  }

  onQueueUpdated(callback: (data: QueueUpdatePayload) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('queue_updated', callback);
  }

  onTokenStatusChanged(callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('token_status_changed', callback);
  }

  onRateUpdated(callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on('rate_updated', callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
