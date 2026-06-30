import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  
  // Store pending invites globally so they persist across routes if needed
  const [pendingInvites, setPendingInvites] = useState([]);
  
  // Store the unified party state globally so it persists when navigating away and back
  const [party, setParty] = useState({ leaderId: null, members: [], matchMode: 'competitive' });

  useEffect(() => {
    // Only connect if user is logged in
    if (user && token) {
      const newSocket = io('http://localhost:5000', {
        auth: { token } // Optional: can be used for auth on connection
      });

      setSocket(newSocket);

      // Register the player on the server
      newSocket.on('connect', () => {
        const playerProfile = {
          playerId: user.playerId,
          username: user.username || 'CodeWizard',
          level: user.level || 42,
          rank: user.rank || 'Gold III',
          xp: user.xp || 8500,
          nextLevelXp: 10000,
          avatar: user.avatar || '0',
        };
        newSocket.emit('register_player', { playerId: user.playerId, playerProfile });
      });

      // Handle receiving an invite
      newSocket.on('receive_invite', (inviteData) => {
        setPendingInvites(prev => {
          // Prevent duplicates
          if (prev.find(inv => inv.from.playerId === inviteData.from.playerId)) {
            return prev;
          }
          return [...prev, inviteData];
        });
      });

      // Handle party updates
      newSocket.on('party_updated', (partyData) => {
        setParty(partyData);
      });

      return () => {
        newSocket.disconnect();
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [user?.playerId, token]);

  // When user profile updates (like changing avatar), emit an update to the server
  useEffect(() => {
    if (socket && user) {
      const playerProfile = {
        playerId: user.playerId,
        username: user.username || 'CodeWizard',
        level: user.level || 42,
        rank: user.rank || 'Gold III',
        xp: user.xp || 8500,
        nextLevelXp: 10000,
        avatar: user.avatar || '0',
      };
      socket.emit('update_profile', playerProfile);
    }
  }, [user, socket]);

  const removePendingInvite = (playerId) => {
    setPendingInvites(prev => prev.filter(inv => inv.from.playerId !== playerId));
  };

  return (
    <SocketContext.Provider value={{ socket, pendingInvites, setPendingInvites, removePendingInvite, party }}>
      {children}
    </SocketContext.Provider>
  );
};
