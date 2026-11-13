// src/services/websocket.js

class EmergencyWebSocket {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.reconnectTimer = null;
    this.pingInterval = null;
    this.isConnected = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use window.location.host so Vite dev proxy handles /ws
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);
        // Ping every 25 seconds to keep connection alive
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((callback) => {
            try {
              callback(data);
            } catch (err) {
              console.error('Error in WS subscriber:', err);
            }
          });
        } catch (e) {
          console.warn('WS received non-json message:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.cleanup();
        this.notifyStatus(false);
        // Reconnect after 3 seconds
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = (err) => {
        console.warn('Emergency WS error:', err);
        this.ws?.close();
      };
    } catch (e) {
      console.error('Failed to establish WS connection:', e);
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    }
  }

  cleanup() {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  notifyStatus(connected) {
    this.listeners.forEach((callback) => {
      try {
        callback({ type: 'connection_status', connected });
      } catch (err) {
        // ignore
      }
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    if (!this.isConnected) {
      this.connect();
    }
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const emergencyWS = new EmergencyWebSocket();
export default emergencyWS;

