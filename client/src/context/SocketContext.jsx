import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('bf_token');
    if (!token || !user) return;

    socketRef.current = io('/', {
      auth: { token },
      transports: ['websocket','polling'],
    });

    socketRef.current.on('connect',    () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  const joinBot          = (botId)  => socketRef.current?.emit('join:bot', botId);
  const joinConversation = (convId) => socketRef.current?.emit('join:conversation', convId);
  const on  = (event, cb) => { socketRef.current?.on(event, cb); return () => socketRef.current?.off(event, cb); };
  const off = (event, cb) => socketRef.current?.off(event, cb);

  return (
    <SocketContext.Provider value={{ connected, joinBot, joinConversation, on, off, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
