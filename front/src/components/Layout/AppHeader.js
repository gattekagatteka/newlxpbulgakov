import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext';

function TopTab({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `topTab ${isActive ? 'topTabActive' : ''}`}
    >
      {children}
    </NavLink>
  );
}

export default function AppHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="appHeader">
      <div className="appHeaderLeft">
        <button className="headerLogoBtn" type="button" onClick={() => navigate('/')} aria-label="На главную">
          <img className="headerLogo" src="/logo.png" alt="logo" />
        </button>
        <nav className="topTabs">
          {user?.role === 'teacher' ? <TopTab to="/journal">Журнал</TopTab> : <TopTab to="/disciplines">Дневник</TopTab>}
          <TopTab to="/schedule/full">Расписание</TopTab>
          <TopTab to="/disciplines">Дисциплины</TopTab>
        </nav>
      </div>

      <div className="appHeaderCenter">
        <div className="searchWrap">
          <span className="searchIcon" aria-hidden="true">🔍</span>
          <input className="searchInput" placeholder="" />
        </div>
      </div>

      <div className="appHeaderRight">
        <button className="iconBtn" type="button" aria-label="Чат" onClick={() => navigate('/chat')}>
          💬
        </button>
        <button className="iconBtn" type="button" aria-label="Уведомления" onClick={() => navigate('/profile')}>
          🔔
        </button>
        <button className="profileNameBtn" type="button" onClick={() => navigate('/profile')}>
          {user ? user.full_name : 'ФИО'}
        </button>
        <button className="avatarBtn" type="button" onClick={() => navigate('/profile')} aria-label="Профиль">
          <span className="avatarCircle" />
        </button>
      </div>
    </header>
  );
}
