import React from 'react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'calendar', icon: '📅', label: '캘린더' },
    { id: 'fridge', icon: '🧊', label: '냉장고' },
    { id: 'home', icon: '🏠', label: '홈', isCenter: true },
    { id: 'chat', icon: '💬', label: '채팅' },
    { id: 'profile', icon: '👤', label: '내 정보' }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''} ${tab.isCenter ? 'center-btn' : ''}`}
          onClick={() => setActiveTab(tab.id)}
          title={tab.label}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
