import { useState, useEffect, useCallback } from 'react';
import webSocketService from '../services/websocket';

const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    const handleMessage = (data) => setLastMessage(data);

    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('*', handleMessage);

    // Initial state
    setIsConnected(webSocketService.isConnected());

    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('*', handleMessage);
    };
  }, []);

  const subscribeToPatient = useCallback((patientId) => {
    webSocketService.subscribeToPatient(patientId);
  }, []);

  const unsubscribeFromPatient = useCallback((patientId) => {
    webSocketService.unsubscribeFromPatient(patientId);
  }, []);

  const sendMessage = useCallback((type, data) => {
    webSocketService.send({ type, ...data });
  }, []);

  return {
    isConnected,
    lastMessage,
    subscribeToPatient,
    unsubscribeFromPatient,
    sendMessage,
    connect: webSocketService.connect,
    disconnect: webSocketService.disconnect
  };
};

export default useWebSocket;