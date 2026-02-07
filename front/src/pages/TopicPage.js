import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { getTopic, getTopicsByDiscipline } from '../api/disciplines';
import { getAssignmentsByDiscipline } from '../api/assignments';

export default function TopicPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [nextTopicId, setNextTopicId] = useState(null);
  const [practiceAssignmentId, setPracticeAssignmentId] = useState(null);
  const scrollRef = useRef(null);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    getTopic(topicId).then(setTopic).catch(() => setTopic(null));
  }, [topicId]);

  useEffect(() => {
    if (!topicId) return;
    try {
      const key = 'read_topics_v1';
      const raw = window.localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const id = Number(topicId);
      const next = Array.isArray(list) ? list : [];
      if (!next.includes(id)) {
        next.push(id);
        window.localStorage.setItem(key, JSON.stringify(next));
      }
    } catch {
      // ignore
    }
  }, [topicId]);

  useEffect(() => {
    if (!topic?.discipline_id || !topic?.order_index) {
      setNextTopicId(null);
      return;
    }

    getTopicsByDiscipline(topic.discipline_id)
      .then((ts) => {
        const cur = Number(topic.order_index);
        const next = (ts || [])
          .filter((t) => Number(t.order_index) > cur)
          .sort((a, b) => Number(a.order_index) - Number(b.order_index))[0];
        setNextTopicId(next?.id ?? null);
      })
      .catch(() => setNextTopicId(null));
  }, [topic?.discipline_id, topic?.order_index]);

  useEffect(() => {
    if (!topic?.discipline_id) {
      setPracticeAssignmentId(null);
      return;
    }
    getAssignmentsByDiscipline(topic.discipline_id)
      .then((items) => setPracticeAssignmentId(((items || [])[0] || null)?.id ?? null))
      .catch(() => setPracticeAssignmentId(null));
  }, [topic?.discipline_id]);

  const hash = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h;
  };

  const getDemoSections = (disciplineTitle, title) => {
    const d = (disciplineTitle || '').toString().trim();
    const t = (title || '').toString().trim();
    if (!t) return [];

    const seed = `${d}::${t}`;
    const h = hash(seed);
    const variants = [
      {
        a: `Определение и назначение`,
        b: `Где встречается на практике`,
        c: `Мини‑чеклист по теме`,
      },
      {
        a: `Базовые понятия`,
        b: `Пример использования`,
        c: `Типичные ошибки`,
      },
      {
        a: `Ключевые термины`,
        b: `Алгоритм работы`,
        c: `Самопроверка`,
      },
    ];
    const v = variants[h % variants.length];
    const name = d ? `${d}: ${t}` : t;

    return [
      {
        title: `${v.a}`,
        body:
          `Тема «${name}» — это важный блок для понимания дальнейших материалов.\n\n` +
          `Разберём определения, роли участников процесса и то, какие задачи решает данная технология/подход. ` +
          `Обрати внимание на термины и связи между ними — они понадобятся в практической части.\n\n` +
          `Кратко по сути:\n` +
          `1) Что это и для чего применяется.\n` +
          `2) Какие ограничения и предпосылки есть у подхода.\n` +
          `3) Как выглядит результат “на выходе”.`,
      },
      {
        title: `${v.b}`,
        body:
          `Рассмотрим пример: возьми небольшой сценарий (веб‑страница, форма, запрос к серверу) и попробуй применить понятия из первой части.\n\n` +
          `Подумай:\n` +
          `- где находятся входные данные;\n` +
          `- как они преобразуются;\n` +
          `- какие есть точки контроля (валидация/ошибки/статусы).\n\n` +
          `Если что‑то не получается — вернись к определениям и сопоставь их со своим примером.`,
      },
      {
        title: `${v.c}`,
        body:
          `Перед переходом дальше проверь себя:\n` +
          `1) Можешь ли ты объяснить тему одним абзацем?\n` +
          `2) Привести 1–2 примера применения?\n` +
          `3) Назвать 2 типичные ошибки и как их избежать?\n\n` +
          `Если ответы уверенные — переходи к следующей теме и выполняй практику.`,
      },
    ];
  };

  const topicText = (() => {
    if (!topic) return '';
    const candidates = [
      topic.content,
      topic.text,
      topic.description,
      topic.body,
      topic?.data?.content,
      topic?.data?.text,
      topic?.data?.description,
      topic?.data?.body,
    ];
    const found = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
    return found ? found.trim() : '';
  })();

  const sections = useMemo(() => {
    if (!topic) return [];
    if (topicText) {
      return [{ title: 'Описание', body: topicText }];
    }
    return getDemoSections(topic.discipline_title, topic.title);
  }, [topic, topicText]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? el.scrollTop / max : 0;
      setReadProgress(Math.max(0, Math.min(1, p)));
    };

    el.scrollTop = 0;
    onScroll();
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [topicId, sections.length]);

  return (
    <div className="topicPageOuter">
      <div className="disciplineSubHeader">
        <div className="disciplineSubHeaderInner">
          <div className="topicSubHeaderBar">
            <button className="disciplineBackBtn" type="button" onClick={() => navigate(-1)} aria-label="Назад">
              ←
            </button>
            <div className="topicSubHeaderTitle">{topic ? topic.title : 'Тема'}</div>
            <div className="badge badgeGreen">Пройдено</div>
          </div>
        </div>
      </div>

      <div className="pageWrap topicPage">
        <Card className="sectionCard topicHeaderCard">
          {topic ? (
            <div className="topicSectionsWithProgress">
              <div className="readProgressTrack" style={{ '--p': readProgress }} aria-hidden="true">
                <div className="readProgressThumb" />
              </div>
              <div className="topicSections" ref={scrollRef}>
                {sections.map((s, idx) => (
                  <div key={`${idx}-${s.title}`} className="topicSection">
                    <div className="topicSectionTitle">{s.title}</div>
                    <div className="topicSectionBody">{s.body}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="topicTextCard">...</div>
          )}
        </Card>

        <div className="topicBottom">
          <Button variant="pill" size="sm" onClick={() => navigate('/disciplines')}>←</Button>
          <Button
            variant="pill"
            size="sm"
            onClick={() => {
              if (nextTopicId) {
                navigate(`/topics/${nextTopicId}`);
                return;
              }
              if (practiceAssignmentId) {
                navigate(`/assignments/${practiceAssignmentId}`);
              }
            }}
          >
            Перейти к следующей теме →
          </Button>
        </div>
      </div>
    </div>
  );
}
