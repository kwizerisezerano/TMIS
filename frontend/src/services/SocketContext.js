import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      // Initialize socket connection
      const newSocket = io('http://localhost:8000');
      setSocket(newSocket);

      // Listen for real-time events
      newSocket.on('contribution-received', (data) => {
        toast.success(`New contribution received: $${data.amount}`);
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'contribution',
          message: `New contribution of $${data.amount} received`,
          timestamp: data.timestamp
        }]);
      });

      newSocket.on('loan-request-submitted', (data) => {
        toast.info(`New loan request: $${data.amount}`);
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'loan',
          message: `New loan request for $${data.amount}`,
          timestamp: data.timestamp
        }]);
      });

      newSocket.on('member-joined', (data) => {
        toast.info('New member joined the tontine');
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'member',
          message: 'New member joined the tontine',
          timestamp: data.timestamp
        }]);
      });

      newSocket.on('payment-processed', (data) => {
        toast.success(`Payment processed: $${data.amount}`);
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'payment',
          message: `Payment of $${data.amount} processed successfully`,
          timestamp: data.timestamp
        }]);
      });

      newSocket.on(`notification-${currentUser.id}`, (data) => {
        toast.info(data.message);
        setNotifications(prev => [...prev, {
          id: data.id,
          type: data.type,
          message: data.message,
          timestamp: data.timestamp
        }]);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [currentUser]);

  const joinTontine = (tontineId) => {
    if (socket) {
      socket.emit('join-tontine', tontineId);
    }
  };

  const emitPaymentUpdate = (paymentData) => {
    if (socket) {
      socket.emit('payment-update', paymentData);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    socket,
    notifications,
    joinTontine,
    emitPaymentUpdate,
    clearNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};