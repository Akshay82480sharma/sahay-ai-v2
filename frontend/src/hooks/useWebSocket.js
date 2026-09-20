import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../api/client';

export function useWebSocket() {
  const [status, setStatus] = useState('connecting');
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectDelayRef = useRef(1000);

  const connect = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    setStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    // Clear any pending reconnects
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    ws.onopen = () => {
      setStatus('open');
      reconnectDelayRef.current = 1000;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.warn('Received malformed WebSocket message:', event.data);
      }
    };

    ws.onclose = () => {
      setStatus('reconnecting');
      wsRef.current = null;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      const delay = reconnectDelayRef.current;
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
      
      // Update for next backoff step, max 30s
      reconnectDelayRef.current = Math.min(delay * 1.5, 30000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      // Let onclose handle reconnect
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect loop on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { status, lastMessage };
}
