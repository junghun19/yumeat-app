import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Fridge from './pages/Fridge';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { storage } from './utils/storage';
import { WS_BASE_URL } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [socket, setSocket] = useState(null);
  const [chatHistory, setChatHistory] = useState({});
  const [activeChatOpponent, setActiveChatOpponent] = useState(null);
  const [profile, setProfile] = useState(() => storage.getUserProfile());

  const isLoggedIn = !!(profile && profile.isLoggedIn);
  const myNickname = profile ? profile.nickname : '자취인';

  useEffect(() => {
    if (!isLoggedIn) return;

    const ws = new WebSocket(`${WS_BASE_URL}/ws?nickname=${encodeURIComponent(myNickname)}`);

    ws.onopen = () => {
      console.log('Connected to Chat WebSocket as:', myNickname);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'init') {
          setChatHistory(data.chat_history || {});
        } else if (data.type === 'message') {
          setChatHistory((prev) => {
            const opp = data.opponent;
            const msg = data.message;
            const currentMsgs = prev[opp] || [];
            const msgKey = msg.id || `${msg.author}|${msg.text}|${msg.timestamp}`;
            const hasSameMessage = currentMsgs.some((item) => {
              const itemKey = item.id || `${item.author}|${item.text}|${item.timestamp}`;
              return itemKey === msgKey;
            });
            if (hasSameMessage) return prev;
            return {
              ...prev,
              [opp]: [...currentMsgs, msg]
            };
          });
        } else if (data.type === 'room_created') {
          setChatHistory((prev) => {
            const opp = data.opponent;
            if (prev[opp]) return prev;
            return {
              ...prev,
              [opp]: []
            };
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from Chat WebSocket');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [myNickname, isLoggedIn]);

  const sendMessage = (opponent, text) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'message',
          opponent,
          text,
          client_message_id: `${Date.now()}-${Math.random().toString(36).slice(2)}`
        })
      );
    }
  };

  const deleteChatRoom = (opponent) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'delete_room',
          opponent,
          sender: myNickname
        })
      );
    }
    // Locally clear active chat if it was the deleted one
    if (activeChatOpponent === opponent) {
      setActiveChatOpponent(null);
    }
  };

  const startChat = (opponentName) => {
    if (!opponentName) return;

    // Request server to make/sync room
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'create_room',
          opponent: opponentName
        })
      );
    } else {
      setChatHistory((prev) => {
        if (prev[opponentName]) return prev;
        return { ...prev, [opponentName]: [] };
      });
    }

    setActiveChatOpponent(opponentName);
    setActiveTab('chat');
  };

  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    setProfile({ nickname: '자취인', hearts: 0 });
    setActiveTab('home');
  };

  if (!isLoggedIn) {
    return (
      <div className="app-container">
        <div className="app-wrapper">
          <Login onLoginSuccess={(newProfile) => setProfile(newProfile)} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-wrapper">
        <div style={{ display: activeTab === 'home' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
          <Home profile={profile} onStartChat={startChat} />
        </div>
        <div style={{ display: activeTab === 'calendar' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
          <Calendar activeTab={activeTab} profile={profile} />
        </div>
        <div style={{ display: activeTab === 'fridge' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
          <Fridge profile={profile} />
        </div>
        <div style={{ display: activeTab === 'chat' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
          <Chat 
            chatHistory={chatHistory} 
            activeChatOpponent={activeChatOpponent} 
            setActiveChatOpponent={setActiveChatOpponent} 
            sendMessage={sendMessage} 
            deleteChatRoom={deleteChatRoom}
          />
        </div>
        <div style={{ display: activeTab === 'profile' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
          <Profile profile={profile} setProfile={setProfile} onLogout={handleLogout} />
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}



