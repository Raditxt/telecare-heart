import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import webSocketService from '../../services/websocket';

const WebSocketStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState(null);

  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setLastPing(new Date());
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    const handlePong = () => {
      setLastPing(new Date());
    };

    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('pong', handlePong);

    // Initial check
    setIsConnected(webSocketService.isConnected());

    // Auto-ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (webSocketService.isConnected()) {
        webSocketService.send({ type: 'ping' });
      }
    }, 30000);

    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('pong', handlePong);
      clearInterval(pingInterval);
    };
  }, []);

  const reconnect = () => {
    // Trigger reconnection
    webSocketService.attemptReconnect();
  };

  const getTimeSince = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return `${Math.floor(diffSecs / 3600)}h ago`;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-600" />
            <span className="text-green-700">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-600" />
            <span className="text-red-700">Offline</span>
          </>
        )}
      </div>
      
      {lastPing && (
        <span className="text-gray-500 text-xs">
          Ping: {getTimeSince(lastPing)}
        </span>
      )}
      
      {!isConnected && (
        <button
          onClick={reconnect}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
        >
          <RefreshCw className="h-3 w-3" />
          Reconnect
        </button>
      )}
    </div>
  );
};

export default WebSocketStatus;