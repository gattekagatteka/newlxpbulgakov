import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Card from '../components/ui/Card';
import { getDisciplines, getTopicsByDiscipline } from '../api/disciplines';
import { getAssignmentsByDiscipline } from '../api/assignments';
import { getMySubmission } from '../api/assignments';
import { useAuth } from '../auth/AuthContext';

export default function DisciplinesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [disciplines, setDisciplines] = useState([]);
  const [selected, setSelected] = useState(null);
  const [topics, setTopics] = useState([]);
  const [practice, setPractice] = useState(null);
  const [practiceStatus, setPracticeStatus] = useState(null);
  const [open, setOpen] = useState(false);

  const hash = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h;
  };

  const getTopicPreview = (t) => {
    const raw = (t?.content || t?.description || t?.text || '').toString().trim();
    if (raw) return raw.length > 140 ? `${raw.slice(0, 140)}…` : raw;
    const title = (t?.title || '').toString().trim();
    if (!title) return '';

    const disciplineTitle = (selected?.title || '').toString().trim();
    const order = Number.isFinite(Number(t?.order_index)) ? Number(t.order_index) : null;
    const tl = title.toLowerCase();
    const kind = tl.includes('введ') ? 'intro' : tl.includes('практ') ? 'practice' : tl.includes('контрол') || tl.includes('кр') ? 'checkpoint' : 'topic';
    const slug = title
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .toLowerCase();

    const templates = {
      intro: (
        `Разберём базовые понятия и терминологию: что это такое, зачем нужно и где применяется. ` +
        `В конце — краткие примеры и вопросы для самопроверки.`
      ),
      practice: (
        `Практика: выполним шаги по заданию, закрепим теорию на примерах и разберём типичные ошибки. ` +
        `Результат — готовое решение и понимание алгоритма действий.`
      ),
      checkpoint: (
        `Контрольная точка: проверка понимания темы. ` +
        `Содержит ключевые вопросы и критерии, по которым оценивается результат.`
      ),
      topic: (
        `Конспект и примеры по теме: основные определения, разбор случаев использования и короткие выводы. ` +
        `Рекомендуется пройти последовательно и сделать заметки.`
      ),
    };

    const hint = templates[kind] || templates.topic;
    const variants = [
      'Совет: пройдись по примерам и выпиши ключевые термины.',
      'Подсказка: после чтения попробуй ответить на вопросы для самопроверки.',
      'Рекомендуется: читать последовательно и не пропускать определения.',
      'Важно: обрати внимание на типовые ошибки и способы их избежать.',
    ];
    const v = variants[hash(`${disciplineTitle}::${title}`) % variants.length];
    const prefix = order ? `${order}. ` : '';
    const withName = slug ? `${prefix}${title}. ` : prefix;
    const disc = disciplineTitle ? `(${disciplineTitle}) ` : '';
    const out = `${disc}${withName}${hint} ${v}`.trim();
    return out.length > 240 ? `${out.slice(0, 240)}…` : out;
  };

  useEffect(() => {
    getDisciplines().then((d) => {
      setDisciplines(d);
      setSelected(d[0] || null);
    }).catch(() => {
      setDisciplines([]);
      setSelected(null);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    getTopicsByDiscipline(selected.id).then(setTopics).catch(() => setTopics([]));
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    getAssignmentsByDiscipline(selected.id)
      .then((items) => {
        const first = (items || [])[0] || null;
        setPractice(first);
      })
      .catch(() => setPractice(null));
  }, [selected]);

  useEffect(() => {
    if (!practice?.id || user?.role !== 'student') {
      setPracticeStatus(null);
      return;
    }
    getMySubmission(practice.id)
      .then((s) => setPracticeStatus(s?.status ?? null))
      .catch(() => setPracticeStatus(null));
  }, [practice?.id, user]);

  const readTopicIds = (() => {
    try {
      const raw = window.localStorage.getItem('read_topics_v1');
      const list = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list.map((x) => Number(x)) : []);
    } catch {
      return new Set();
    }
  })();

  return (
    <div className="disciplinesPageOuter">
      <div className="disciplineSubHeader">
        <div className="disciplineSubHeaderInner">
          <div className="disciplineHeaderBar">
            <button className="disciplineBackBtn" type="button" onClick={() => navigate(-1)} aria-label="Назад">
              ←
            </button>
            <button
              type="button"
              className="disciplineSelectBtn"
              onClick={() => setOpen((v) => !v)}
              aria-label="Выбрать дисциплину"
            >
              <div className="disciplineSelectTitle">{selected?.title || 'Дисциплина'}</div>
              <div className="disciplineSelectCaret">▾</div>
            </button>
          </div>

          {open ? (
            <div className="disciplineDropdown">
              {disciplines.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`disciplineDropdownItem ${selected?.id === d.id ? 'disciplineDropdownItemActive' : ''}`}
                  onClick={() => {
                    setSelected(d);
                    setOpen(false);
                  }}
                >
                  {d.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="pageWrap disciplinesPage">
        <div className="disciplineContent">
          <div className="disciplineStatsRow">
            <Card className="sectionCard disciplineHoursCard">
              <div className="pointsText">
                <div>Кол-во часов изучения: {selected?.hours_total || 56} академических часов</div>
                <div>Максимальное кол-во баллов: {selected?.max_points || 100} баллов</div>
              </div>
            </Card>

            <Card className="sectionCard disciplinePointsCard">
              <div className="pointsRed">
                <div className="pointsRedTop">Баллы</div>
                <div className="pointsRedVal">0/100</div>
              </div>
            </Card>
          </div>

          <Card className="sectionCard disciplinesTopicsCard">
            <div className="topicsOuter">
              <div className="topicsScroll">
                {topics.map((t, idx) => {
                  const isRead = readTopicIds.has(Number(t.id));
                  const statusClass = isRead ? 'statusPillGreen' : 'statusPillGray';
                  const statusText = isRead ? 'Прочитано' : 'Не прочитано';
                  const preview = getTopicPreview(t);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className="topicRow topicRowBtn topicRowGray"
                      onClick={() => navigate(`/topics/${t.id}`)}
                    >
                      <div className="topicLeft">
                        <div className="topicTitle">{t.title}</div>
                        {preview ? <div className="topicText">{preview}</div> : null}
                      </div>
                      <div className={`statusPill ${statusClass}`}>{statusText}</div>
                    </button>
                  );
                })}

                {practice ? (
                  <button
                    key={`practice-${practice.id}`}
                    type="button"
                    className="topicRow topicRowBtn topicRowGray"
                    onClick={() => navigate(`/assignments/${practice.id}`)}
                  >
                    <div className="topicLeft">
                      <div className="topicTitle">{practice.title}</div>
                      <div className="topicText">Практическое задание. Выполни работу и отправь ответ на проверку.</div>
                    </div>
                    <div
                      className={`statusPill ${practiceStatus === 'сдано' || practiceStatus === 'проверено' ? 'statusPillGreen' : 'statusPillRed'}`}
                    >
                      {practiceStatus || 'не сдано'}
                    </div>
                  </button>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
