import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect } from 'react';
import Draw from './Draw';
import RandomPattern from './RandomPattern';
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client';

enum ActiveComponent {
  DrawMode,
  PatternMode
}

const VisualArt: React.FC = () => {
  const { DrawMode, PatternMode } = ActiveComponent
  const [mode, setMode] = useState<ActiveComponent>(DrawMode);
  const { user, isAuthenticated, isLoading } = useAuth0();
  const { roomId } = useParams();
  const socket = io('http://localhost:8000');


  useEffect(() => {
    socket.on('roomCreated', (userId, roomId) => {
      console.log(`${userId} created room: ${roomId}`);
    });

    socket.on('userJoined', (userId) => {
      socket.emit('logJoinUser', userId);
      console.log(`User ${userId} joined the room`);
    });

    socket.on('userLeft', (userId) => {
      console.log(`User ${userId} left the room`);
    });

    // Clean up the socket.io connection when the component unmounts
    return () => {
      socket.emit('disconnectUser', user?.sub);
      socket.disconnect();
    };
  }, [roomId]);

  const renderComponent = () => {
    switch (mode) {
      case PatternMode:
        return <RandomPattern />;
      case DrawMode:
        return <Draw />;
    }
  }

  return (
    <div>
      <button onClick={() => setMode(DrawMode)}>Drawing</button>
      <button onClick={() => setMode(PatternMode)}>Pattern</button>
      {renderComponent()}
    </div>
  )
}

export default VisualArt;
