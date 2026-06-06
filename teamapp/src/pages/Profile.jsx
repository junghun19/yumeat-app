import React, { useState, useEffect } from 'react';
import ProfileCard from '../components/ProfileCard';
import { getRankByPoints, getNextRankInfo, RANK_SYSTEM } from '../utils/rankSystem';
import { storage } from '../utils/storage';

export default function Profile() {
  const [profile, setProfile] = useState({ nickname: '자취 미슐랭', hearts: 0 });
  const [currentRank, setCurrentRank] = useState(getRankByPoints(0));
  const [nextRankInfo, setNextRankInfo] = useState(getNextRankInfo(0));

  useEffect(() => {
    const localProfile = storage.getUserProfile();
    const nickname = localProfile ? localProfile.nickname : '자취 미슐랭';

    // Fetch dynamic profile score calculated by FastAPI server
    fetch(`http://localhost:8000/api/profile/${encodeURIComponent(nickname)}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        storage.saveUserProfile(data); // Sync local storage
      })
      .catch(err => console.error('Error fetching profile:', err));
  }, []);

  useEffect(() => {
    const rank = getRankByPoints(profile.hearts);
    setCurrentRank(rank);
    setNextRankInfo(getNextRankInfo(profile.hearts));
  }, [profile.hearts]);

  const progressPercentage = nextRankInfo
    ? ((profile.hearts - currentRank.minPoints) / (nextRankInfo.nextLevel ? (RANK_SYSTEM[nextRankInfo.nextLevel - 1].minPoints - currentRank.minPoints) : 100)) * 100
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
    </div>
  );
}
