import React, { useEffect } from 'react';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../auth/AuthContext';

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = '#FBF8F8';
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  return (
    <div className="profilePageOuter">
      <div className="pageWrap">
        <h1 className="pageTitle">Профиль</h1>

        <div className="profileTop">
          <div className="profileAvatar" />
          <div className="profileName">{user?.full_name}</div>
        </div>

        <div className="profileGrid">
          <Card className="profileCard profileInfoCard">
            <div className="profileInfoInner">
              <div className="profileField">Email: <span className="muted">{user?.username}@vvsu.ithub.ru</span></div>
              <div className="profileField">Группа: <span className="muted">гг-01-22-23-FT-2</span></div>
              <Button variant="pill" size="sm">Моё портфолио</Button>
            </div>
          </Card>

          <Card className="profileCard profileNotifCard">
            <div className="profileNotifHead">
              <span className="profileNotifIcon" aria-hidden="true">🔔</span>
              <div className="profileNotifTitle">Последние уведомления отсутствуют</div>
            </div>
            <div className="profileNotifBody">
              <div className="profileNotifBox">
                <div className="profileNotifBoxLine" aria-hidden="true" />
              </div>
            </div>
          </Card>

          <div className="profileDivider" aria-hidden="true">
            <div className="profileDividerLine" />
            <div className="profileDividerLine" />
            <div className="profileDividerLine" />
          </div>

          <Card className="profileCard profileSettingsCard">
            <div className="profileSettingsInner">
              <div className="profileSettingsTitle">Настройки</div>
              <button type="button" className="profileSettingsLink">Сменить пароль</button>
              <button type="button" className="profileLogoutBtn" onClick={signOut}>Выйти</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
