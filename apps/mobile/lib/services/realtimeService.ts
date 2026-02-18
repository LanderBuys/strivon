export interface RealtimeEvent {
  type: 'connected' | 'disconnected' | 'post_update' | 'engagement_update' | 'new_message' | 'typing' | 'presence' | 'notification';
  data: any;
  timestamp: string;
}

type EventListener = (event: RealtimeEvent) => void;

class RealtimeService {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  /**
   * Initialize real-time connection
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // In a real app, this would establish WebSocket connection
      // For now, simulate connection
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connected', { type: 'connected', data: {}, timestamp: new Date().toISOString() });
      console.log('Realtime service connected');
    } catch (error) {
      console.error('Error connecting to realtime service:', error);
      this.handleReconnect();
    }
  }

  /**
   * Disconnect from real-time service
   */
  disconnect(): void {
    this.connected = false;
    this.emit('disconnected', { type: 'disconnected', data: {}, timestamp: new Date().toISOString() });
  }

  /**
   * Emit an event
   */
  private emit(event: string, data?: RealtimeEvent): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        if (data) {
          listener(data);
        }
      });
    }
  }

  /**
   * Add event listener
   */
  on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * Subscribe to post updates
   */
  subscribeToPost(postId: string, callback: (data: any) => void): () => void {
    const handler = (event: RealtimeEvent) => {
      if (event.type === 'post_update' && event.data.postId === postId) {
        callback(event.data);
      }
    };
    this.on('event', handler);
    return () => this.off('event', handler);
  }

  /**
   * Subscribe to engagement updates (likes, comments, etc.)
   */
  subscribeToEngagement(postId: string, callback: (data: any) => void): () => void {
    const handler = (event: RealtimeEvent) => {
      if (event.type === 'engagement_update' && event.data.postId === postId) {
        callback(event.data);
      }
    };
    this.on('event', handler);
    return () => this.off('event', handler);
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(conversationId: string, callback: (data: { userId: string; isTyping: boolean }) => void): () => void {
    const handler = (event: RealtimeEvent) => {
      if (event.type === 'typing' && event.data.conversationId === conversationId) {
        callback(event.data);
      }
    };
    this.on('event', handler);
    return () => this.off('event', handler);
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    if (!this.connected) return;
    // In real app, send via WebSocket
    this.emit('event', {
      type: 'typing',
      data: { conversationId, isTyping },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to presence updates
   */
  subscribeToPresence(userId: string, callback: (data: { isOnline: boolean; lastSeen?: string }) => void): () => void {
    const handler = (event: RealtimeEvent) => {
      if (event.type === 'presence' && event.data.userId === userId) {
        callback(event.data);
      }
    };
    this.on('event', handler);
    return () => this.off('event', handler);
  }

  /**
   * Update user presence
   */
  updatePresence(isOnline: boolean): void {
    if (!this.connected) return;
    // In real app, send via WebSocket
    this.emit('event', {
      type: 'presence',
      data: { isOnline, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Simulate receiving a real-time event (for testing)
   */
  simulateEvent(event: RealtimeEvent): void {
    this.emit('event', event);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const realtimeService = new RealtimeService();

