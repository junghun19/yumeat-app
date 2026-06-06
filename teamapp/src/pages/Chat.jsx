import React, { useState, useEffect, useRef } from 'react';

export default function Chat({ chatHistory, activeChatOpponent, setActiveChatOpponent, sendMessage, deleteChatRoom }) {
  const [screen, setScreen] = useState('list');
  const [inputText, setInputText] = useState('');
  const [showExitModal, setShowExitModal] = useState(false);
  const [opponentToExit, setOpponentToExit] = useState(null);
  const messagesEndRef = useRef(null);

  // Helper to hash real nickname to "익명 X"
  const getAnonName = (name) => {
    if (!name) return '익명';
    if (name === '시스템') return '시스템';
    if (name.startsWith('익명')) return name; // Already formatted
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const num = (Math.abs(hash) % 10) + 1;
    return `익명 ${num}`;
  };

  // Sync screen state based on the active opponent
  useEffect(() => {
    if (activeChatOpponent) {
      setScreen('chatroom');
    } else {
      setScreen('list');
    }
  }, [activeChatOpponent]);

  // Scroll to bottom when messages update or room opens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (screen === 'chatroom') {
      scrollToBottom();
    }
  }, [chatHistory, screen, activeChatOpponent]);

  const handleSend = () => {
    if (inputText.trim() && activeChatOpponent) {
      sendMessage(activeChatOpponent, inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteClick = (e, opp) => {
    e.stopPropagation(); // Avoid entering the room
    setOpponentToExit(opp);
    setShowExitModal(true);
  };

  const handleLeaveClick = () => {
    setOpponentToExit(activeChatOpponent);
    setShowExitModal(true);
  };

  const confirmExit = () => {
    if (opponentToExit) {
      deleteChatRoom(opponentToExit);
      setShowExitModal(false);
      setOpponentToExit(null);
    }
  };

  const cancelExit = () => {
    setShowExitModal(false);
    setOpponentToExit(null);
  };

  if (screen === 'list') {
    const opponents = Object.keys(chatHistory);

    return (
      <div className="page chat-page" style={{ padding: '20px 16px', overflowY: 'auto', position: 'relative' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#2c3a5c', margin: '0 0 20px 0', borderLeft: '4px solid #ff6b6b', paddingLeft: '8px' }}>
          쪽지함 💬
        </h2>

        {opponents.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '350px',
            color: '#a0aec0',
            textAlign: 'center',
            padding: '20px'
          }}>
            <span style={{ fontSize: '48px', marginBottom: '15px' }}>💬</span>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3a5c' }}>개설된 대화방이 없습니다</div>
            <div style={{ fontSize: '11px', marginTop: '6px', color: '#718096' }}>자유게시판 등에서 상대방에게 쪽지를 보내보세요.</div>
          </div>
        ) : (
          <div className="chat-rooms-list" style={{ display: 'flex', flexDirection: 'column' }}>
            {opponents.map((opp) => {
              const msgs = chatHistory[opp] || [];
              const lastMsg = msgs[msgs.length - 1];
              const lastText = lastMsg ? lastMsg.text : '대화 내용이 없습니다.';
              const lastTime = lastMsg ? lastMsg.timestamp : '';

              return (
                <div
                  key={opp}
                  onClick={() => setActiveChatOpponent(opp)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ff6b6b';
                    e.currentTarget.style.backgroundColor = '#fff8f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#2c3a5c' }}>
                        👤 {getAnonName(opp)}
                      </span>
                      <span style={{ fontSize: '10px', color: '#a0aec0' }}>{lastTime}</span>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#718096',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {lastText}
                    </div>
                  </div>
                  {/* Delete / Exit Room button */}
                  <button
                    onClick={(e) => handleDeleteClick(e, opp)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      color: '#a0aec0',
                      fontSize: '14px',
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ff6b6b'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#a0aec0'}
                    title="나가기"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Confirmation Exit Modal */}
        {showExitModal && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '320px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              boxSizing: 'border-box'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#2c3a5c', margin: '0 0 8px 0' }}>
                쪽지방 나가기
              </h4>
              <p style={{ fontSize: '12.5px', color: '#718096', margin: '0 0 20px 0', lineHeight: '1.4' }}>
                {getAnonName(opponentToExit)} 쪽지방을 나가시겠습니까?<br />
                대화 내역이 완전히 삭제됩니다.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={cancelExit}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#f1f3f5',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#4a5568',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={confirmExit}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#ff6b6b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  나가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Chatroom screen
  const messages = chatHistory[activeChatOpponent] || [];

  return (
    <div className="page chat-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0px', position: 'relative' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f1f3f5',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button
          onClick={() => setActiveChatOpponent(null)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#f1f3f5',
            color: '#4a5568',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginRight: '8px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f3f5'}
        >
          ◀ 목록
        </button>
        <button
          onClick={handleLeaveClick}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ffe6e6',
            color: '#ff6b6b',
            border: '1px solid #ffcccc',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginRight: '12px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffd1d1'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffe6e6'}
        >
          나가기
        </button>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3a5c', flexGrow: 1 }}>
          {getAnonName(activeChatOpponent)}님과의 쪽지
        </span>
        <span style={{
          fontSize: '10px',
          color: '#2ecc71',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '3px'
        }}>
          ● 온라인
        </span>
      </div>

      {/* Messages Feed */}
      <div className="messages-container" style={{
        flex: 1,
        padding: '16px',
        backgroundColor: '#fafafa',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((msg, idx) => {
          const isMe = msg.author === '나';
          const isSystem = msg.author === '시스템';

          if (isSystem) {
            return (
              <div
                key={idx}
                style={{
                  alignSelf: 'center',
                  backgroundColor: '#edf2f7',
                  color: '#4a5568',
                  fontSize: '11px',
                  padding: '5px 14px',
                  borderRadius: '16px',
                  margin: '8px 0',
                  textAlign: 'center',
                  maxWidth: '85%',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                📢 {msg.text}
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="message-item"
              style={isMe ? {
                alignSelf: 'flex-end',
                borderLeft: 'none',
                borderRight: '3px solid #ff6b6b',
                backgroundColor: '#ffe3e3',
                maxWidth: '80%',
                marginLeft: 'auto',
                padding: '10px 12px',
                borderRadius: '10px'
              } : {
                alignSelf: 'flex-start',
                maxWidth: '80%',
                marginRight: 'auto',
                padding: '10px 12px',
                borderRadius: '10px',
                borderLeft: '3px solid #ff6b6b',
                backgroundColor: '#ffffff'
              }}
            >
              <div className="message-author" style={{ fontSize: '11px', fontWeight: 'bold', color: '#ff6b6b', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>{isMe ? '나' : getAnonName(msg.author)}</span>
                {msg.badge && <span style={{ color: '#ffca28', fontSize: '12px' }} title="자취 미슐랭 등급 배지">⭐</span>}
              </div>
              <div className="message-text" style={{ fontSize: '13px', color: '#333', wordBreak: 'break-word', lineHeight: '1.4' }}>
                {msg.text}
              </div>
              <div className="message-time" style={{ fontSize: '9px', color: '#999', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                {msg.timestamp}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area" style={{
        display: 'flex',
        gap: '10px',
        padding: '12px 16px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #f1f3f5',
        position: 'sticky',
        bottom: 0,
        zIndex: 10
      }}>
        <input
          type="text"
          className="chat-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="쪽지 메시지를 입력하세요..."
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          style={{
            padding: '10px 18px',
            backgroundColor: '#ff6b6b',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff5252'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b6b'}
        >
          전송
        </button>
      </div>

      {/* Custom Confirmation Exit Modal */}
      {showExitModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '320px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#2c3a5c', margin: '0 0 8px 0' }}>
              쪽지방 나가기
            </h4>
            <p style={{ fontSize: '12.5px', color: '#718096', margin: '0 0 20px 0', lineHeight: '1.4' }}>
              {getAnonName(opponentToExit)} 쪽지방을 나가시겠습니까?<br />
              대화 내역이 완전히 삭제됩니다.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={cancelExit}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#f1f3f5',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#4a5568',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                취소
              </button>
              <button
                onClick={confirmExit}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#ff6b6b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
