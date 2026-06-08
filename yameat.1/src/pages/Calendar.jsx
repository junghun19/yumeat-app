import React, { useState, useEffect } from 'react';
import { getCalendarDays, getDayOfWeekName, formatDateKorean, getToday } from '../utils/dateUtils';
import { storage } from '../utils/storage';
import { API_BASE_URL } from '../config';

const EMOTIONS = ['😀', '😢', '😡', '😍', '😴', '😵', '😎', '🤔'];

export default function Calendar({ activeTab, profile }) {
  const today = getToday();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [diaryText, setDiaryText] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [diaries, setDiaries] = useState({});
  const [expiringDates, setExpiringDates] = useState([]);
  const username = profile ? profile.username : 'default_user';

  const { daysInMonth, startingDayOfWeek } = getCalendarDays(year, month);

  useEffect(() => {
    const savedDiaries = storage.getDiaries();
    setDiaries(savedDiaries);
  }, []);

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetch(`${API_BASE_URL}/api/fridge/expiring-dates?user_id=${encodeURIComponent(username)}`)
        .then(res => res.json())
        .then(data => setExpiringDates(data))
        .catch(err => console.error('Error fetching expiring dates:', err));
    }
  }, [activeTab, username]);

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDateClick = (day) => {
    if (!day) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    const diary = diaries[dateStr];
    setDiaryText(diary?.text || '');
    setSelectedEmotion(diary?.emotion || null);
  };

  const saveDiary = () => {
    if (!selectedDate) return;
    const updatedDiaries = {
      ...diaries,
      [selectedDate]: {
        text: diaryText,
        emotion: selectedEmotion
      }
    };
    setDiaries(updatedDiaries);
    storage.saveDiaries(updatedDiaries);
  };

  const handleEmotionSelect = (emotion) => {
    if (selectedEmotion === emotion) {
      setSelectedEmotion(null);
    } else {
      setSelectedEmotion(emotion);
    }
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="page calendar-page">
      <h2>📅 {year}년 {month + 1}월 달력</h2>

      {/* 요일 헤더 */}
      <div className="calendar-grid">
        <div className="weekday-header">
          {weekDays.map(day => (
            <div key={day} className="weekday-cell">{day}</div>
          ))}
        </div>

        {/* 날짜 */}
        <div className="dates-grid">
          {days.map((day, index) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const diary = day ? diaries[dateStr] : null;
            const isExpiring = day && expiringDates.includes(dateStr);

            return (
              <div
                key={index}
                className={`date-cell ${day ? 'active' : ''} ${selectedDate === dateStr ? 'selected' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                {day}
                {diary?.emotion && (
                  <div className="diary-emoji">
                    {diary.emotion}
                  </div>
                )}
                {isExpiring && (
                  <div className="expiry-dot">🔴</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 일기 입력 섹션 */}
      {selectedDate && (
        <div className="diary-section">
          <h3>{formatDateKorean(new Date(selectedDate))}</h3>
          <p className="diary-hint">오늘 하루를 한 줄로 기록해보세요.</p>

          <textarea
            className="diary-input"
            placeholder="오늘의 하루를 기록해주세요..."
            value={diaryText}
            onChange={(e) => setDiaryText(e.target.value)}
          />

          <div className="emotion-selector">
            <p>감정 선택:</p>
            <div className="emotion-buttons-grid">
              {EMOTIONS.map((emotion, index) => (
                <button
                  key={index}
                  className={`emotion-select-btn ${selectedEmotion === emotion ? 'selected' : ''}`}
                  onClick={() => handleEmotionSelect(emotion)}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          <button className="diary-save-btn" onClick={saveDiary}>
            💾 저장
          </button>
        </div>
      )}
    </div>
  );
}
