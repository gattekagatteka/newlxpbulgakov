import React from 'react';

export default function AppFooter() {
  return (
    <footer className="appFooter">
      <div className="footerInner">
        <div className="footerLogoWrap">
          <img src="/logo.png" alt="logo" className="footerLogo" />
        </div>
        <div className="footerContacts">
          <div className="footerContact">Telegram</div>
          <div className="footerContact">Вконтакте</div>
          <div className="footerContact">ithub@vvsu.ithub.ru</div>
        </div>
      </div>
    </footer>
  );
}
