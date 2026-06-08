// LocalStorage 관리 유틸리티

export const storage = {
  // 게시글
  getPosts: () => {
    const posts = localStorage.getItem('posts');
    return posts ? JSON.parse(posts) : [];
  },
  savePosts: (posts) => {
    localStorage.setItem('posts', JSON.stringify(posts));
  },

  // 냉장고 식재료
  getFridgeItems: () => {
    const items = localStorage.getItem('fridgeItems');
    return items ? JSON.parse(items) : [];
  },
  saveFridgeItems: (items) => {
    localStorage.setItem('fridgeItems', JSON.stringify(items));
  },

  // 일기
  getDiaries: () => {
    const diaries = localStorage.getItem('diaries');
    return diaries ? JSON.parse(diaries) : {};
  },
  saveDiaries: (diaries) => {
    localStorage.setItem('diaries', JSON.stringify(diaries));
  },

  // 채팅 메시지
  getMessages: () => {
    const messages = localStorage.getItem('messages');
    return messages ? JSON.parse(messages) : [];
  },
  saveMessages: (messages) => {
    localStorage.setItem('messages', JSON.stringify(messages));
  },

  // 사용자 정보
  getUserProfile: () => {
    const profile = localStorage.getItem('userProfile');
    return profile ? JSON.parse(profile) : { nickname: '자취인', hearts: 0 };
  },
  saveUserProfile: (profile) => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }
};
