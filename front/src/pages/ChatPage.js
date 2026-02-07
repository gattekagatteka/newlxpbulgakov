import React, { useMemo, useState } from 'react';

import Card from '../components/ui/Card';

export default function ChatPage() {
  const [text, setText] = useState('');
  const [active, setActive] = useState('Че Эльвира А.');
  const messages = useMemo(
    () => [
      { side: 'left', text: 'Здравствуйте! Напомню: практическая работа по разделу сдаётся до пятницы 23:59.' },
      { side: 'right', text: 'Хорошо, спасибо. Можно уточнить: достаточно одного ответа в поле или нужен файл?' },
      { side: 'left', text: 'Достаточно текста в ответе. Если есть макет/скриншоты — можете приложить ссылку в конце.' },
      { side: 'right', text: 'Понял. А оценка будет по 5-балльной или по 10-балльной шкале?' },
      { side: 'left', text: 'За практическую — до 10 баллов. Темы в журнале — по 5.' },
      { side: 'right', text: 'Ок, сдаю сегодня. Если что — напишу.' },
    ],
    []
  );

  return (
    <div className="pageWrap">
      <h1 className="pageTitle">Чат с преподавателями</h1>

      <Card className="chatCard">
        <div className="chatLayout">
          <div className="chatLeft">
            <div className="chatSearch">
              <input className="searchInput" placeholder="Поиск" />
            </div>
            <div className="chatUsers">
              {['Че Эльвира А.', 'Козлова Мария К.', 'Степанов Герман В.', 'Юрченко Александр С.'].map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`chatUser ${active === name ? 'chatUserActive' : ''}`}
                  onClick={() => setActive(name)}
                >
                  <div className="chatAvatar" />
                  <div className="chatUserName">{name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="chatRight">
            <div className="chatTopBar">
              <div className="chatTopLeft">
                <div className="chatAvatar" />
                <div className="chatTopName">{active}</div>
              </div>
              <div className="chatTopActions">
                <button type="button" className="iconBtn" onClick={() => {}} aria-label="Поиск">🔍</button>
                <button type="button" className="iconBtn" onClick={() => {}} aria-label="Настройки">⚙</button>
                <button type="button" className="iconBtn" onClick={() => {}} aria-label="Ещё">⋯</button>
              </div>
            </div>
            <div className="chatMessages">
              {messages.map((m, idx) => (
                <div key={idx} className={`chatMsg ${m.side === 'right' ? 'chatMsgRight' : 'chatMsgLeft'}`}>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="chatInputRow">
              <button type="button" className="chatAttachBtn" onClick={() => {}} aria-label="Скрепка">📎</button>
              <input className="chatInput" value={text} onChange={(e) => setText(e.target.value)} placeholder="Введите сообщение..." />
              <button type="button" className="chatSendBtn" onClick={() => setText('')}>
                →
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
