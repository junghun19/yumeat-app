// 자취 미슐랭 등급 시스템 (0점 ~ 180점 이상)
export const RANK_SYSTEM = [
  { level: 1, name: '자취 새내기', minPoints: 0, maxPoints: 19, color: '#9E9E9E', emoji: '🌱' },
  { level: 2, name: '초보 자취인', minPoints: 20, maxPoints: 39, color: '#4CAF50', emoji: '🍀' },
  { level: 3, name: '떠오르는 자취인', minPoints: 40, maxPoints: 59, color: '#2196F3', emoji: '💙' },
  { level: 4, name: '숙련된 자취인', minPoints: 60, maxPoints: 79, color: '#9C27B0', emoji: '✨' },
  { level: 5, name: '자취 미슐랭 1스타', minPoints: 80, maxPoints: 99, color: '#C0C0C0', emoji: '⚔️' },
  { level: 6, name: '마스터 자취인', minPoints: 100, maxPoints: 119, color: '#FFD700', emoji: '🏅' },
  { level: 7, name: '자취 전문가', minPoints: 120, maxPoints: 139, color: '#FFA500', emoji: '🔥' },
  { level: 8, name: '왕관 자취인', minPoints: 140, maxPoints: 159, color: '#FF1493', emoji: '👑' },
  { level: 9, name: '다이아몬드 자취인', minPoints: 160, maxPoints: 179, color: '#00CED1', emoji: '💎' },
  { level: 10, name: '전설의 자취인', minPoints: 180, maxPoints: Infinity, color: '#FFD700', emoji: '🌟' }
];

export const getRankByPoints = (points) => {
  return RANK_SYSTEM.find(rank => points >= rank.minPoints && points <= rank.maxPoints) || RANK_SYSTEM[0];
};

export const getNextRankInfo = (points) => {
  const currentRank = getRankByPoints(points);
  if (currentRank.level === 10) return null;
  
  const nextRank = RANK_SYSTEM[currentRank.level];
  return {
    nextLevel: nextRank.level,
    nextName: nextRank.name,
    pointsNeeded: nextRank.minPoints - points
  };
};
