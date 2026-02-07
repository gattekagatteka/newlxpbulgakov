import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Card from '../components/ui/Card';
import { getScheduleWeek } from '../api/schedule';

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

export default function ScheduleFullPage() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const start = useMemo(() => iso(today), [today]);
  const end = useMemo(() => iso(addDays(today, 6)), [today]);

  const [data, setData] = useState({ start, end, items: [] });

  useEffect(() => {
    getScheduleWeek(start, end).then(setData).catch(() => setData({ start, end, items: [] }));
  }, [start, end]);

  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < 6; i += 1) {
      out.push(iso(addDays(today, i)));
    }
    return out;
  }, [today]);

  const slots = [
    { num: 1, time: '8:30-10:00' },
    { num: 2, time: '10:10-11:40' },
    { num: 3, time: '11:50-13:20' },
    { num: 4, time: '13:30-15:00' },
    { num: 5, time: '15:10-16:40' },
    { num: 6, time: '16:50-18:20' },
    { num: 7, time: '18:30-20:00' },
    { num: 8, time: '20:10-21:40' },
  ];

  const slotStarts = useMemo(
    () => [
      { idx: 0, start: 8 * 60 + 30, end: 10 * 60 },
      { idx: 1, start: 10 * 60 + 10, end: 11 * 60 + 40 },
      { idx: 2, start: 11 * 60 + 50, end: 13 * 60 + 20 },
      { idx: 3, start: 13 * 60 + 30, end: 15 * 60 },
      { idx: 4, start: 15 * 60 + 10, end: 16 * 60 + 40 },
      { idx: 5, start: 16 * 60 + 50, end: 18 * 60 + 20 },
      { idx: 6, start: 18 * 60 + 30, end: 20 * 60 },
      { idx: 7, start: 20 * 60 + 10, end: 21 * 60 + 40 },
    ],
    []
  );

  function toMinutes(hhmm) {
    const s = String(hhmm || '00:00').slice(0, 5);
    const [hh, mm] = s.split(':');
    const h = Number(hh);
    const m = Number(mm);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
  }

  function slotIndexForItem(it) {
    const t = toMinutes(it.start_time);
    const found = slotStarts.find((s) => t >= s.start && t <= s.end);
    if (found) return found.idx;
    let best = 0;
    let bestDiff = Infinity;
    for (const s of slotStarts) {
      const diff = Math.abs(t - s.start);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = s.idx;
      }
    }
    return best;
  }

  function colorClass(it) {
    const s = `${it.discipline_title}-${it.group_name}`;
    const v = s.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 4;
    return v === 0 ? 'weekEventGreen' : v === 1 ? 'weekEventBlue' : v === 2 ? 'weekEventRed' : 'weekEventPurple';
  }

  function hashString(str) {
    return String(str)
      .split('')
      .reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0);
  }

  function mulberry32(a) {
    return function rng() {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const grid = useMemo(() => {
    const map = new Map();
    const key = (day, slot) => `${day}__${slot}`;

    for (const it of data.items || []) {
      const slot = slotIndexForItem(it);
      map.set(key(it.day, slot), it);
    }

    // If backend returns too few lessons, add deterministic demo lessons
    const baseTitles = (data.items || []).map((x) => x.discipline_title).filter(Boolean);
    const titles = baseTitles.length
      ? baseTitles
      : ['HTML/CSS', 'HTML 5 API', 'Web-компоненты', 'Введение в фреймворки', 'Основы UX/UI'];

    for (const day of days) {
      const seed = hashString(`${day}_${start}_${end}`);
      const rng = mulberry32(seed);
      const desired = 3;
      let added = 0;

      // try up to N attempts to place lessons into free slots
      for (let attempts = 0; attempts < 30 && added < desired; attempts += 1) {
        const slot = Math.floor(rng() * slots.length);
        if (map.has(key(day, slot))) continue;
        const title = titles[Math.floor(rng() * titles.length)];
        map.set(key(day, slot), {
          id: `demo-${day}-${slot}`,
          day,
          start_time: slots[slot].time.split('-')[0].padStart(5, '0'),
          end_time: slots[slot].time.split('-')[1].padStart(5, '0'),
          discipline_title: title,
          group_name: `Группа 22-FT-${1 + Math.floor(rng() * 3)}`,
          room: `${1200 + Math.floor(rng() * 400)}`,
        });
        added += 1;
      }
    }

    return map;
  }, [data.items, days, end, slotIndexForItem, slots, start]);

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
        <div className="weekNav">
          <div className="weekBtn">←</div>
          <div className="weekRange">{start} — {end}</div>
          <div className="weekBtn">→</div>
        </div>

        <Card className="sectionCard weekCard">
          <div className="weekDaysLine">
            <div className="weekDays">
              {["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"].map((d) => (
                <div key={d} className="weekDay">{d}</div>
              ))}
            </div>
          </div>
          <div className="weekGrid">
            <div className="weekTimes">
              {slots.map((s) => (
                <div key={s.num} className="weekTimeBox">
                  <div className="weekTimeNum">{s.num}</div>
                  <div className="weekTimeRange">{s.time}</div>
                </div>
              ))}
            </div>
            <div className="weekCells">
              {slots.map((s) => (
                <div key={s.num} className="weekRow">
                  {days.map((day) => {
                    const it = grid.get(`${day}__${s.num - 1}`);
                    return (
                      <div
                        key={`${s.num}-${day}`}
                        className={`weekCell ${it ? `weekCellFilled ${colorClass(it)}` : 'weekCellEmpty'}`}
                      >
                        {it ? (
                          <>
                            <div className="weekCellTitle">{it.discipline_title}</div>
                            <div className="weekCellMeta">{it.group_name}</div>
                            <div className="weekCellMeta">Ауд. {it.room}</div>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
