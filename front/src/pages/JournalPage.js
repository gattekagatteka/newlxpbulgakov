import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../auth/AuthContext';
import { getAttendanceJournal, getGradesJournal, setAttendance, setGrade } from '../api/journal';
import { getDisciplines } from '../api/disciplines';

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

export default function JournalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const modeOptions = useMemo(
    () => [
      { value: 'attendance', label: 'Посещаемость' },
      { value: 'grades', label: 'Успеваемость' },
    ],
    []
  );
  const groupOptions = useMemo(
    () => [
      { id: 1, label: 'Группа 22-FT-1' },
      { id: 2, label: 'Группа 22-FT-2' },
      { id: 3, label: 'Группа 22-FT-3' },
    ],
    []
  );

  const [mode, setMode] = useState(modeOptions[0].value);
  const [groupId, setGroupId] = useState(groupOptions[1].id);
  const [disciplineId, setDisciplineId] = useState(null);
  const canEdit = user?.role === 'teacher';

  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < 3; i += 1) {
      out.push(iso(addDays(today, i * 7)));
    }
    return out;
  }, [today]);

  const [students, setStudents] = useState([]);

  const [attendance, setAttendanceState] = useState({});
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(null);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);

  const [topics, setTopics] = useState([]);
  const [grades, setGradesState] = useState({});
  const [gradePicker, setGradePicker] = useState(null);

  useEffect(() => {
    let alive = true;
    async function loadDisciplines() {
      try {
        const list = await getDisciplines();
        if (!alive) return;
        if (Array.isArray(list) && list.length) {
          setDisciplineId(list[0].id);
        }
      } catch (_) {
        // ignore
      }
    }

    if (user?.role) loadDisciplines();
    return () => {
      alive = false;
    };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === 'student' && user.group_id) {
      setGroupId(user.group_id);
    }
  }, [user?.group_id, user?.role]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await getAttendanceJournal({ groupId, disciplineId, days });
        if (!alive) return;
        const nextStudents = (res?.rows || []).map((r) => ({ id: r.student.id, fio: r.student.full_name }));
        const nextAttendance = {};
        for (const r of res?.rows || []) {
          nextAttendance[r.student.id] = { ...(r.statuses || {}) };
        }
        setStudents(nextStudents);
        setAttendanceState(nextAttendance);
      } catch (_) {
        if (alive) setAttendanceState({});
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (user?.role === 'teacher' && mode === 'attendance' && disciplineId) load();
    if (user?.role === 'student' && mode === 'attendance' && disciplineId) load();
    return () => {
      alive = false;
    };
  }, [days, disciplineId, groupId, mode, user?.role]);

  useEffect(() => {
    let alive = true;
    async function loadGrades() {
      setLoading(true);
      try {
        const res = await getGradesJournal({ groupId, disciplineId });
        if (!alive) return;
        const nextTopics = (res?.topics || []).map((t) => ({ id: t.topic_id, title: t.title, maxPoints: t.max_points }));
        const nextStudents = (res?.rows || []).map((r) => ({ id: r.student.id, fio: r.student.full_name }));

        const nextGrades = {};
        for (const r of res?.rows || []) {
          const m = {};
          for (const [k, v] of Object.entries(r.points || {})) {
            const s = String(v || '').trim().toLowerCase();
            if (!s || s === 'не выставлено') {
              m[Number(k)] = null;
              continue;
            }
            const n = Number(String(v).split('/')[0]);
            m[Number(k)] = Number.isNaN(n) ? null : n;
          }
          nextGrades[r.student.id] = m;
        }

        setTopics(nextTopics);
        setStudents(nextStudents);
        setGradesState(nextGrades);
      } catch (_) {
        if (alive) setGradesState({});
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (user?.role === 'teacher' && mode === 'grades' && disciplineId) loadGrades();
    if (user?.role === 'student' && mode === 'grades' && disciplineId) loadGrades();
    return () => {
      alive = false;
    };
  }, [disciplineId, groupId, mode, user?.role]);

  function statusLabel(s) {
    if (s === 'присутствовал') return 'Присутствовал';
    if (s === 'отсутствовал') return 'Отсутствовал';
    if (s === 'уважительная причина') return 'Уважительная причина';
    return 'Не выставлено';
  }

  function statusClass(s) {
    if (s === 'присутствовал') return 'attCellPresent';
    if (s === 'отсутствовал') return 'attCellAbsent';
    if (s === 'уважительная причина') return 'attCellReason';
    return 'attCellUnset';
  }

  async function applyStatus(studentId, day, status) {
    setPicker(null);
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [day]: status,
      },
    }));

    try {
      if (!disciplineId) return;
      await setAttendance({ studentId, disciplineId, day, status });
    } catch (_) {
      // ignore
    }
  }

  function gradeLabel(v) {
    if (v === null || v === undefined || v === '') return 'Не выставлено';
    return `${v}/5`;
  }

  function gradeClass(v) {
    if (v === null || v === undefined || v === '') return 'attCellUnset';
    const n = Number(v);
    if (Number.isNaN(n)) return 'attCellUnset';
    if (n >= 5) return 'attCellPresent';
    if (n <= 0) return 'attCellAbsent';
    return 'attCellReason';
  }

  async function applyGrade(studentId, topicId, points) {
    setGradePicker(null);
    const safePoints = points === null || points === undefined ? 0 : points;
    setGradesState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [topicId]: safePoints,
      },
    }));

    try {
      if (!disciplineId) return;
      await setGrade({ studentId, disciplineId, topicId, points: safePoints });
    } catch (_) {
      // ignore
    }
  }

  return (
    <div className="journalPageOuter">
      <div className="disciplineSubHeader">
        <div className="disciplineSubHeaderInner">
          <div className="journalSubHeaderBar">
            <button className="disciplineBackBtn" type="button" onClick={() => navigate(-1)} aria-label="Назад">
              ←
            </button>
            <div className="journalSubHeaderTitle">Журнал</div>
          </div>
        </div>
      </div>

      <div className="pageWrap journalPage">
        <div
          className="journalControls"
          style={{ gridTemplateColumns: `1.1fr repeat(${mode === 'attendance' ? days.length : topics.length}, 1fr)` }}
        >
          <button
            className="pillSelect journalControlsMode"
            type="button"
            onClick={() => setMode((m) => (m === 'attendance' ? 'grades' : 'attendance'))}
          >
            {modeOptions.find((x) => x.value === mode)?.label || modeOptions[0].label}
            <span className="pillArrow" aria-hidden="true">▾</span>
          </button>
          <button
            className="pillSelect journalControlsGroup"
            type="button"
            onClick={() => (canEdit ? setGroupPickerOpen(true) : null)}
          >
            {groupOptions.find((x) => x.id === groupId)?.label || groupOptions[1].label}
            <span className="pillArrow" aria-hidden="true">▾</span>
          </button>
        </div>

        {mode === 'attendance' ? (
          <Card className="sectionCard journalAttendCard">
            <div className="attHeader">
              <div className="attHeaderCell attHeaderFio">ФИО</div>
              {days.map((d) => (
                <div key={d} className="attHeaderCell">{new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</div>
              ))}
            </div>

            <div className="attBody">
              {loading ? <div className="muted">Загрузка...</div> : null}
              {(canEdit ? students : students.filter((s) => s.id === user?.student_id)).map((st) => (
                <div key={st.id} className="attRow">
                  <div className="attFioCell">{st.fio}</div>
                  {days.map((d) => {
                    const val = attendance?.[st.id]?.[d];
                    return (
                      <button
                        key={`${st.id}_${d}`}
                        type="button"
                        className={`attCell ${statusClass(val)}`}
                        onClick={() => (canEdit ? setPicker({ studentId: st.id, day: d }) : null)}
                      >
                        {statusLabel(val)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="sectionCard journalAttendCard">
            <div className="attHeader">
              <div className="attHeaderCell attHeaderFio">ФИО</div>
              {topics.map((t) => (
                <div key={t.id} className="attHeaderCell">{t.title}</div>
              ))}
            </div>

            <div className="attBody">
              {loading ? <div className="muted">Загрузка...</div> : null}
              {(canEdit ? students : students.filter((s) => s.id === user?.student_id)).map((st) => (
                <div key={st.id} className="attRow">
                  <div className="attFioCell">{st.fio}</div>
                  {topics.map((t) => {
                    const val = grades?.[st.id]?.[t.id];
                    return (
                      <button
                        key={`${st.id}_${t.id}`}
                        type="button"
                        className={`attCell ${gradeClass(val)}`}
                        onClick={() => (canEdit ? setGradePicker({ studentId: st.id, topicId: t.id }) : null)}
                      >
                        {gradeLabel(val)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Button className="wideBtn" onClick={() => navigate('/disciplines')}>Перейти в дисциплину</Button>

        {picker ? (
          <div className="attPickerOverlay" role="dialog" aria-modal="true" onClick={() => setPicker(null)}>
            <div className="attPicker" onClick={(e) => e.stopPropagation()}>
              <div className="attPickerHead">
                <div className="attPickerTitle">Выберите статус</div>
                <button className="attPickerClose" type="button" onClick={() => setPicker(null)} aria-label="Закрыть">
                  ×
                </button>
              </div>
              <div className="attPickerGrid">
                <button type="button" className="attPickBtn" onClick={() => applyStatus(picker.studentId, picker.day, 'присутствовал')}>
                  Присутствовал
                </button>
                <button type="button" className="attPickBtn" onClick={() => applyStatus(picker.studentId, picker.day, 'отсутствовал')}>
                  Отсутствовал
                </button>
                <button type="button" className="attPickBtn" onClick={() => applyStatus(picker.studentId, picker.day, 'уважительная причина')}>
                  Уважительная причина
                </button>
                <button type="button" className="attPickBtn" onClick={() => applyStatus(picker.studentId, picker.day, 'не выставлено')}>
                  Не выставлено
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {gradePicker ? (
          <div className="attPickerOverlay" role="dialog" aria-modal="true" onClick={() => setGradePicker(null)}>
            <div className="attPicker" onClick={(e) => e.stopPropagation()}>
              <div className="attPickerHead">
                <div className="attPickerTitle">Выберите балл</div>
                <button className="attPickerClose" type="button" onClick={() => setGradePicker(null)} aria-label="Закрыть">
                  ×
                </button>
              </div>
              <div className="attPickerGrid">
                {[0, 1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="attPickBtn"
                    onClick={() => applyGrade(gradePicker.studentId, gradePicker.topicId, p)}
                  >
                    {p}
                  </button>
                ))}
                <button type="button" className="attPickBtn" onClick={() => applyGrade(gradePicker.studentId, gradePicker.topicId, 0)}>
                  Не выставлено
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {groupPickerOpen ? (
          <div className="attPickerOverlay" role="dialog" aria-modal="true" onClick={() => setGroupPickerOpen(false)}>
            <div className="attPicker" onClick={(e) => e.stopPropagation()}>
              <div className="attPickerHead">
                <div className="attPickerTitle">Выберите группу</div>
                <button className="attPickerClose" type="button" onClick={() => setGroupPickerOpen(false)} aria-label="Закрыть">
                  ×
                </button>
              </div>
              <div className="attPickerGrid">
                {groupOptions.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="attPickBtn"
                    onClick={() => {
                      setGroupId(g.id);
                      setGroupPickerOpen(false);
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
