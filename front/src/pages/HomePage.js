import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../auth/AuthContext';
import { getDisciplines } from '../api/disciplines';
import { getScheduleDay } from '../api/schedule';

function iso(d) {
  return d.toISOString().slice(0, 10);
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = useMemo(() => iso(new Date()), []);

  const [schedule, setSchedule] = useState([]);
  const [disciplines, setDisciplines] = useState([]);

  useEffect(() => {
    getScheduleDay(today).then(setSchedule).catch(() => setSchedule([]));
    getDisciplines().then(setDisciplines).catch(() => setDisciplines([]));
  }, [today]);

  return (
    <div className={user?.role === 'teacher' ? 'homeTeacherOuter' : ''}>
      <div className="pageWrap">
        <h1 className="pageTitle">Расписание на сегодня</h1>

        <Card className="sectionCard">
          {schedule.length === 0 ? (
            <div className="muted">Нет занятий</div>
          ) : (
            <div className="list">
              {schedule.slice(0, 2).map((it, idx) => (
                <div key={it.id} className="scheduleRow">
                  <div className="scheduleNum">{idx + 1}</div>
                  <div className="scheduleInfo">
                    <div className="scheduleTitle">{it.discipline_title}</div>
                    <div className="scheduleMeta">
                      {it.start_time.slice(0, 5)} — {it.end_time.slice(0, 5)} &nbsp;&nbsp; Ауд. {it.room}
                    </div>
                    <div className="scheduleMeta">{it.group_name}</div>
                  </div>
                  {user?.role === 'teacher' ? (
                    <div className="scheduleActions">
                      <Button variant="pill" size="sm" onClick={() => navigate('/journal')}>Перейти в журнал</Button>
                      <Button variant="pill" size="sm" onClick={() => navigate('/schedule/full')}>Перейти в расписание</Button>
                    </div>
                  ) : (
                    <div className="scheduleRight">
                      <div className="badge badgeRed">0/100</div>
                      <Button variant="pill" size="xs" onClick={() => navigate('/disciplines')}>Перейти в дневник</Button>
                    </div>
                  )}
                  {user?.role !== 'teacher' ? <div className="scheduleGreen" aria-hidden="true" /> : null}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Button className="wideBtn" onClick={() => navigate('/schedule/full')}>Перейти на полное расписание</Button>

        <div className="spacer" />

        {user?.role === 'teacher' ? (
          <>
            <h2 className="pageTitle">Журнал</h2>
            <Card className="sectionCard">
              <div className="groupsList">
                {["Группа 22-FT-1", "Группа 22-FT-2", "Группа 22-FT-3"].map((g) => (
                  <div key={g} className="groupRow">
                    <div className="groupName">{g}</div>
                    <div className="groupBtns">
                      <Button variant="pill" size="sm" onClick={() => navigate('/journal')}>Посещаемость</Button>
                      <Button variant="pill" size="sm" onClick={() => navigate('/journal')}>Успеваемость</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Button className="wideBtn" onClick={() => navigate('/journal')}>Перейти в полный журнал</Button>
          </>
        ) : (
          <>
            <h2 className="pageTitle">Успеваемость</h2>
            <Card className="sectionCard">
              <div className="progressList">
                {disciplines.slice(0, 5).map((d) => (
                  <div key={d.id} className="progressRow">
                    <div className="progressName progressNamePill">{d.title}</div>
                    <div className="progressBadges">
                      <div className="badge badgeGreen badgeGreenCombo">
                        <span>11/11</span>
                        <span>100%</span>
                      </div>
                      <div className="badge badgeRed">0/100</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Button className="wideBtn" onClick={() => navigate('/disciplines')}>Перейти в дневник</Button>
          </>
        )}
      </div>
    </div>
  );
}
