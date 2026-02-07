import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getScheduleDay } from '../api/schedule';

function iso(d) {
  return d.toISOString().slice(0, 10);
}

export default function SchedulePage() {
  const navigate = useNavigate();
  const today = useMemo(() => iso(new Date()), []);
  const [items, setItems] = useState([]);

  useEffect(() => {
    getScheduleDay(today).then(setItems).catch(() => setItems([]));
  }, [today]);

  return (
    <div className="schedulePageOuter">
      <div className="disciplineSubHeader">
        <div className="disciplineSubHeaderInner">
          <div className="journalSubHeaderBar">
            <button className="disciplineBackBtn" type="button" onClick={() => navigate(-1)} aria-label="Назад">
              ←
            </button>
            <div className="journalSubHeaderTitle">Расписание</div>
          </div>
        </div>
      </div>
      <div className="pageWrap">
        <div className="pageHeader">
          <div className="pageTitle" style={{ display: 'none' }}>Расписание</div>
        </div>

        <div className="fullBleed">
          <Card className="sectionCard sectionCardFullBleed">
            <div className="fullBleedInner">
              {items.length === 0 ? (
                <div className="muted">Нет занятий</div>
              ) : (
                <div className="list">
                  {items.map((it, idx) => (
                    <div key={it.id} className="scheduleItem">
                      <div className="scheduleRow scheduleRowWhite">
                        <div className="scheduleNum">{idx + 1}</div>
                        <div className="scheduleInfo">
                          <div className="scheduleTitle">{it.discipline_title}</div>
                          <div className="scheduleMeta">
                            {it.start_time.slice(0, 5)} — {it.end_time.slice(0, 5)} &nbsp;&nbsp; Ауд. {it.room}
                          </div>
                          <div className="scheduleMeta">{it.group_name}</div>
                        </div>
                        <div className="scheduleRight">
                          <div className="badge badgeRed">0/100</div>
                          <Button variant="pill" size="xs" onClick={() => navigate('/schedule/full')}>Перейти в расписание</Button>
                        </div>
                      </div>
                      <div className="scheduleGreen" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <Button className="wideBtn" onClick={() => navigate('/schedule/full')}>Перейти на полное расписание</Button>
      </div>
    </div>
  );
}
