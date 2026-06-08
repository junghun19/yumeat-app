import React, { useState, useEffect } from 'react';
import ProfileCard from '../components/ProfileCard';
import { getRankByPoints, getNextRankInfo, RANK_SYSTEM } from '../utils/rankSystem';
import { storage } from '../utils/storage';
import { API_BASE_URL } from '../config';

export default function Profile({ profile, setProfile, onLogout }) {
  const [currentRank, setCurrentRank] = useState(getRankByPoints(profile.hearts || 0));
  const [nextRankInfo, setNextRankInfo] = useState(getNextRankInfo(profile.hearts || 0));
  const [nicknameInput, setNicknameInput] = useState(profile.nickname || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (profile.nickname) {
      setNicknameInput(profile.nickname);
    }
  }, [profile.nickname]);

  useEffect(() => {
    if (!profile.username) return;

    // Fetch dynamic profile score calculated by FastAPI server
    fetch(`${API_BASE_URL}/api/profile/user/${encodeURIComponent(profile.username)}`)
      .then(res => res.json())
      .then(data => {
        const updated = {
          ...profile,
          nickname: data.nickname,
          hearts: data.hearts
        };
        setProfile(updated);
        storage.saveUserProfile(updated); // Sync local storage
      })
      .catch(err => console.error('Error fetching profile:', err));
  }, [profile.username]);

  useEffect(() => {
    const rank = getRankByPoints(profile.hearts || 0);
    setCurrentRank(rank);
    setNextRankInfo(getNextRankInfo(profile.hearts || 0));
  }, [profile.hearts]);

  const handleSaveNickname = async () => {
    if (!nicknameInput.trim()) {
      setSaveError('닉네임을 입력해 주세요.');
      return;
    }
    if (nicknameInput.trim() === profile.nickname) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/nickname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: profile.username,
          new_nickname: nicknameInput.trim()
        }),
      });

      const data = await response.json();
      if (data.error) {
        setSaveError(data.error);
      } else if (data.status === 'success') {
        const updatedProfile = {
          ...profile,
          nickname: data.nickname
        };
        storage.saveUserProfile(updatedProfile);
        setProfile(updatedProfile);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving nickname:', err);
      setSaveError('서버 연결에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const progressPercentage = nextRankInfo
    ? (((profile.hearts || 0) - currentRank.minPoints) / (nextRankInfo.nextLevel ? (RANK_SYSTEM[nextRankInfo.nextLevel - 1].minPoints - currentRank.minPoints) : 100)) * 100
    : 100;

  return (
    <div className="page profile-page" style={{ paddingBottom: '120px' }}>
      <h2>👤 내 정보</h2>

      {/* 프로필 카드 (자동 레벨업 및 등급별 테두리 동적 변경) */}
      <ProfileCard
        profile={profile}
        currentRank={currentRank}
        nextRankInfo={nextRankInfo}
        progressPercentage={Math.min(progressPercentage, 100)}
      />

      {/* 신뢰도(하트) 획득 가이드 테이블 */}
      <div className="rank-info-section" style={{ marginTop: '25px' }}>
        <h3>❤️ 신뢰도(하트) 획득 가이드</h3>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#2c3a5c', borderBottom: '1px solid #f1f3f5', paddingBottom: '8px' }}>
              <span>📝 추천 식단 작성</span>
              <span style={{ fontWeight: 'bold', color: '#ff6b6b' }}>+5 ❤️</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#2c3a5c', borderBottom: '1px solid #f1f3f5', paddingBottom: '8px' }}>
              <span>🥗 냉털 작성</span>
              <span style={{ fontWeight: 'bold', color: '#ff6b6b' }}>+3 ❤️</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#2c3a5c', borderBottom: '1px solid #f1f3f5', paddingBottom: '8px' }}>
              <span>👍 좋아요 1개 획득</span>
              <span style={{ fontWeight: 'bold', color: '#ff6b6b' }}>+1 ❤️</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#2c3a5c', borderBottom: '1px solid #f1f3f5', paddingBottom: '8px' }}>
              <span>🏆 추천 식단 채택 (인기 1위)</span>
              <span style={{ fontWeight: 'bold', color: '#ff6b6b' }}>+20 ❤️</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#2c3a5c', paddingBottom: '2px' }}>
              <span>🛵 배달 더치페이 성공</span>
              <span style={{ fontWeight: 'bold', color: '#ff6b6b' }}>+10 ❤️</span>
            </div>
          </div>
        </div>
      </div>

      {/* 등급 정보 리스트 */}
      <div className="rank-info-section" style={{ marginTop: '25px' }}>
        <h3>🏅 등급 체계 안내</h3>
        <div className="rank-list">
          {RANK_SYSTEM.map(rank => (
            <div
              key={rank.level}
              className={`rank-item ${rank.level === currentRank.level ? 'current' : ''}`}
              style={rank.level === currentRank.level ? { backgroundColor: rank.color + '20', borderColor: rank.color } : {}}
            >
              <span className="rank-emoji">{rank.emoji}</span>
              <span className="rank-details">
                <strong>Lv.{rank.level}</strong> {rank.name}
                <br />
                <small>{rank.minPoints} ~ {rank.maxPoints === Infinity ? '∞' : rank.maxPoints}점</small>
              </span>
              {rank.level === currentRank.level && <span className="current-badge" style={{ backgroundColor: rank.color, color: '#ffffff' }}>✓ 현재</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 닉네임 수정 및 로그아웃 설정 카드 */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #ffe3e3',
        boxShadow: '0 4px 15px rgba(255, 107, 107, 0.05)',
        marginTop: '25px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h3 style={{ fontSize: '15px', color: '#2c3a5c', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          ⚙️ 계정 및 프로필 설정
        </h3>
        
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#718096', marginBottom: '6px' }}>
            아이디
          </label>
          <input 
            type="text"
            value={profile.username || '알 수 없음'}
            disabled
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f7fafc',
              color: '#a0aec0',
              fontSize: '13px',
              cursor: 'not-allowed',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ff6b6b', marginBottom: '6px' }}>
            닉네임 변경
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text"
              placeholder="변경할 닉네임을 입력하세요"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #e2e8f0',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ff6b6b'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              onClick={handleSaveNickname}
              disabled={isSaving}
              style={{
                padding: '0 16px',
                backgroundColor: '#ff6b6b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#ff5252'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ff6b6b'}
            >
              {isSaving ? '저장 중...' : '💾 저장'}
            </button>
          </div>
          {saveSuccess && (
            <span style={{ display: 'block', fontSize: '11px', color: '#38a169', marginTop: '6px', fontWeight: 'bold' }}>
              ✓ 닉네임이 성공적으로 변경되었습니다.
            </span>
          )}
          {saveError && (
            <span style={{ display: 'block', fontSize: '11px', color: '#e53e3e', marginTop: '6px', fontWeight: 'bold' }}>
              ⚠️ {saveError}
            </span>
          )}
        </div>

        <div style={{ borderTop: '1px solid #f1f3f5', paddingTop: '12px', marginTop: '4px' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#f7fafc',
              color: '#e53e3e',
              border: '1px solid #edf2f7',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#fed7d7';
              e.target.style.borderColor = '#feb2b2';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#f7fafc';
              e.target.style.borderColor = '#edf2f7';
            }}
          >
            🚪 로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
