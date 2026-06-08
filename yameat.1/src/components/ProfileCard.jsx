import React from 'react';

export default function ProfileCard({ profile, currentRank, nextRankInfo, progressPercentage }) {
  const getRankFrameStyle = (level) => {
    const frames = {
      1: 'gray-frame',
      2: 'green-frame',
      3: 'blue-frame',
      4: 'purple-frame',
      5: 'silver-frame',
      6: 'gold-frame',
      7: 'orange-frame',
      8: 'crown-frame',
      9: 'diamond-frame',
      10: 'legend-frame'
    };
    return frames[level] || 'gray-frame';
  };

  return (
    <div className={`profile-card ${getRankFrameStyle(currentRank.level)}`}>
      <div className="profile-avatar">
        <span className="avatar-emoji">{currentRank.emoji}</span>
      </div>
      <div className="profile-info">
        <h3 className="profile-nickname">{profile.nickname}</h3>
        <p className="profile-rank">
          <span className="rank-level">Lv.{currentRank.level}</span>
          <span className="rank-name">{currentRank.name}</span>
        </p>
        <div className="hearts-display">
          <span className="hearts-count">❤️ {profile.hearts} 점</span>
        </div>
      </div>

      {nextRankInfo && (
        <div className="rank-progress">
          <p className="progress-text">다음 등급까지: {nextRankInfo.pointsNeeded}점</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <p className="next-rank-hint">
            Lv.{nextRankInfo.nextLevel} {nextRankInfo.nextName}
          </p>
        </div>
      )}
    </div>
  );
}
