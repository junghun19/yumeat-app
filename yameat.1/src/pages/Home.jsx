import React, { useState, useEffect } from 'react';
import RecipeCard from '../components/RecipeCard';
import PostCard from '../components/PostCard';
import { storage } from '../utils/storage';
import { API_BASE_URL } from '../config';

export default function Home({ profile, onStartChat }) {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('자유게시판');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postIdToDelete, setPostIdToDelete] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('자유게시판');

  const categories = ['자유게시판', '추천 식단', '배달 더치페이', '냉털'];

  const myNickname = profile ? profile.nickname : '자취인';

  useEffect(() => {
    // Fetch posts dynamically from FastAPI database
    fetch(`${API_BASE_URL}/api/posts`)
      .then(res => res.json())
      .then(data => {
        setPosts(data);
      })
      .catch(err => console.error('Error fetching posts:', err));
  }, []);

  const filteredPosts = posts.filter(post => post.category === selectedCategory);

  const getTopRecommendedRecipe = () => {
    const recipePosts = posts.filter(post => post.category === '추천 식단');
    if (recipePosts.length === 0) {
      return {
        id: 'empty',
        name: '첫 추천 식단을 공유해 주세요!',
        author: '얌잇',
        emoji: '🍳'
      };
    }
    
    // Sort recipe posts by total positive feedback count (like + happy)
    const sorted = [...recipePosts].sort((a, b) => {
      const scoreA = (a.emotions?.like || 0) + (a.emotions?.happy || 0);
      const scoreB = (b.emotions?.like || 0) + (b.emotions?.happy || 0);
      return scoreB - scoreA;
    });

    const topPost = sorted[0];
    return {
      id: topPost.id,
      name: topPost.title,
      author: topPost.author,
      emoji: '🍲'
    };
  };

  const topRecipe = getTopRecommendedRecipe();

  const handleUpdateEmotions = (postId, emotionKey) => {
    // Implement Facebook/KakaoTalk style emotion 1-click restriction via localStorage
    const savedUserEmotions = localStorage.getItem('post_emotions');
    const userEmotions = savedUserEmotions ? JSON.parse(savedUserEmotions) : {};
    
    const prevEmotion = userEmotions[postId];
    let action = '';
    
    if (prevEmotion === emotionKey) {
      // Cancel click if clicking same emoji
      action = 'cancel';
      delete userEmotions[postId];
    } else if (prevEmotion) {
      // Toggle emoji: decrement previous and increment new
      action = 'change';
      userEmotions[postId] = emotionKey;
    } else {
      // Add emoji for the first time
      action = 'add';
      userEmotions[postId] = emotionKey;
    }
    
    // Save to local state
    localStorage.setItem('post_emotions', JSON.stringify(userEmotions));
    
    // Post to server DB
    fetch(`${API_BASE_URL}/api/posts/${postId}/emotion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emotion: emotionKey,
        action: action,
        prev_emotion: prevEmotion
      })
    })
      .then(res => res.json())
      .then(updatedPost => {
        if (!updatedPost.error) {
          setPosts(prev => prev.map(post => post.id === postId ? updatedPost : post));
        }
      })
      .catch(err => console.error('Error updating emotion:', err));
  };

  const handleCreatePost = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const newPost = {
      title: newTitle.trim(),
      author: myNickname,
      content: newContent.trim(),
      category: newCategory
    };

    fetch(`${API_BASE_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPost)
    })
      .then(res => res.json())
      .then(savedPost => {
        setPosts(prev => [savedPost, ...prev]);
        setSelectedCategory(newCategory);

        // Clear inputs and close modal
        setNewTitle('');
        setNewContent('');
        setNewCategory('자유게시판');
        setIsWriteModalOpen(false);
      })
      .catch(err => console.error('Error creating post:', err));
  };

  const handleDeletePost = (postId) => {
    setPostIdToDelete(postId);
    setShowDeleteModal(true);
  };

  const confirmDeletePost = () => {
    if (postIdToDelete) {
      fetch(`${API_BASE_URL}/api/posts/${postIdToDelete}`, {
        method: 'DELETE'
      })
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setPosts(prev => prev.filter(post => post.id !== postIdToDelete));
          }
          setShowDeleteModal(false);
          setPostIdToDelete(null);
        })
        .catch(err => {
          console.error('Error deleting post:', err);
          setShowDeleteModal(false);
          setPostIdToDelete(null);
        });
    }
  };

  const cancelDeletePost = () => {
    setShowDeleteModal(false);
    setPostIdToDelete(null);
  };

  return (
    <div className="page home-page" style={{ position: 'relative' }}>
      {/* 로고 및 타이틀 */}
      <div className="logo-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0 20px 0' }}>
        <img src="/logo.png" alt="얌잇 로고" style={{ width: '148px', height: '148px', objectFit: 'contain', marginBottom: '10px' }} />
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#2f3a63', margin: '0 0 10px 0' }}>오늘 뭐 먹지?</h1>
      </div>

      {/* 오늘의 추천 섹션 */}
      <section className="today-recipes">
        <h2>🍳 오늘의 추천 (실시간 인기 1위)</h2>
        <div className="recipes-scroll">
          <RecipeCard recipe={topRecipe} />
        </div>
      </section>

      {/* 카테고리 탭 */}
      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={`tab-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 게시글 목록 */}
      <section className="posts-section">
        {filteredPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onUpdateEmotions={handleUpdateEmotions}
            onStartChat={onStartChat}
            myNickname={myNickname}
            onDeletePost={handleDeletePost}
          />
        ))}
      </section>

      {/* Floating Action Button (FAB) for writing a post */}
      <button 
        className="fab-write-btn"
        onClick={() => setIsWriteModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: 'calc(50% - 195px)',
          backgroundColor: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '24px',
          padding: '10px 18px',
          boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
          cursor: 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 90,
          transition: 'all 0.2s ease'
        }}
      >
        ✏️ 글쓰기
      </button>

      {/* Write Post Modal */}
      {isWriteModalOpen && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
            boxSizing: 'border-box'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <button 
                onClick={() => setIsWriteModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#333'
                }}
              >
                ✕
              </button>
              <h3 style={{ flexGrow: 1, textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginRight: '20px' }}>
                글 쓰기
              </h3>
            </div>

            {/* Dropdown */}
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#ff6b6b', marginBottom: '6px' }}>커뮤니티 선택</label>
            <select 
              value={newCategory} 
              onChange={(e) => setNewCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px',
                marginBottom: '15px',
                outline: 'none',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="자유게시판">자유게시판</option>
              <option value="추천 식단">추천 식단</option>
              <option value="배달 더치페이">배달 더치페이</option>
              <option value="냉털">냉털</option>
            </select>

            {/* Title Input */}
            <input 
              type="text" 
              placeholder="제목을 입력해주세요" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px',
                marginBottom: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {/* Content Textarea */}
            <textarea 
              placeholder="얌잇에서 자유롭게 이야기를 나눠봐요." 
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              style={{
                width: '100%',
                height: '220px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px',
                marginBottom: '20px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />

            {/* Submit Button */}
            <div>
              <button 
                onClick={handleCreatePost}
                style={{
                  float: 'right',
                  padding: '12px 24px',
                  backgroundColor: '#ff6b6b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxShadow: '0 2px 6px rgba(255, 107, 107, 0.2)'
                }}
              >
                작성 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Delete Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 300,
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
              게시글 삭제
            </h4>
            <p style={{ fontSize: '12.5px', color: '#718096', margin: '0 0 20px 0', lineHeight: '1.4' }}>
              정말로 이 게시글을 삭제하시겠습니까?<br />
              삭제된 글은 복구할 수 없습니다.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={cancelDeletePost}
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
                onClick={confirmDeletePost}
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
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
