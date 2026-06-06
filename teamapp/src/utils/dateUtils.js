// 날짜 유틸리티 함수

export const getToday = () => {
  return new Date(2026, 5, 2); // 2026년 6월 2일 고정
};

export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateKorean = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

export const calculateDDay = (expirationDate) => {
  const today = getToday();
  const expDate = new Date(expirationDate);
  const timeDiff = expDate - today;
  const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  if (dayDiff < 0) return 'expired';
  return dayDiff;
};

export const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  return { daysInMonth, startingDayOfWeek };
};

export const getDayOfWeekName = (day) => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[day];
};
