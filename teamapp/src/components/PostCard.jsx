import React from 'react';

export default function PostCard({ post, onUpdateEmotions, onStartChat, myNickname, onDeletePost }) {
  const emotionButtons = [
    { emoji: '👍', label: '좋아요', key: 'like' },
    { emoji: '👎', label: '싫어요', key: 'dislike' },
    { emoji: '😢', label: '슬퍼요', key: 'sad' },
    { emoji: '😊', label: '즐거워요', key: 'happy' },
    { emoji: '😡', label: '화나요', key: 'angry' }
  ];

  const handleEmotionClick = (emotionKey) => {
    onUpdateEmotions(post.id, emotionKey);
  };

  const isAuthor = post.author === myNickname || post.author === '나' || post.author === '나 (익명)';

  return (
    <div className="post-card">
      <div className="post-header">
        <h4>{post.title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="post-author">by {post.author}</span>
          {isAuthor ? (
            <button 
              className="post-delete-btn" 
              onClick={() => onDeletePost(post.id)}
              style={{
                padding: '2px 8px',
                backgroundColor: '#fff0f0',
                border: '1px solid #ffc0c0',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#ff4d4d',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
            >
              🗑️ 글 삭제
            </button>
          ) : (
            <button 
              className="post-chat-btn" 
              onClick={() => onStartChat(post.author)}
              style={{
                padding: '2px 8px',
                backgroundColor: '#ffe6e6',
                border: '1px solid #ffcccc',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#ff6b6b',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
            >
              ✉️ 쪽지
            </button>
          )}
        </div>
      </div>
      <p className="post-content">{post.content}</p>
      <div className="post-category">
        <span className="category-badge">{post.category}</span>
      </div>
      <div className="emotion-buttons">
        {emotionButtons.map((btn) => (
          <button
            key={btn.key}
            className="emotion-btn"
            onClick={() => handleEmotionClick(btn.key)}
            title={btn.label}
          >
            <span className="emotion-emoji">{btn.emoji}</span>
            <span className="emotion-count">{post.emotions[btn.key] || 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
