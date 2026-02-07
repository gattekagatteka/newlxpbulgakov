import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../auth/AuthContext';
import { getAssignment, getMySubmission, submitAssignment } from '../api/assignments';

export default function AssignmentPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAssignment(assignmentId).then(setAssignment).catch(() => setAssignment(null));
  }, [assignmentId]);

  useEffect(() => {
    if (user?.role !== 'student') return;
    getMySubmission(assignmentId)
      .then((s) => {
        setSubmission(s);
        setAnswer(s.answer_text || '');
      })
      .catch(() => setSubmission(null));
  }, [assignmentId, user]);

  async function onSubmit() {
    setSaving(true);
    try {
      const s = await submitAssignment(assignmentId, answer);
      setSubmission(s);
    } finally {
      setSaving(false);
    }
  }

  const statusText = submission?.status ? submission.status : 'не сдано';
  const statusClass = submission?.status === 'сдано' ? 'badgeGreen' : 'badgeRed';
  const assignmentTitle = assignment ? assignment.title : 'Практическая работа';

  const getFallbackText = (title) => {
    const t = (title || '').toString().trim();
    return `Цель работы:
Проверить знания студента в области ${t ? t : 'HTML 5, API и веб-спецификаций'}, умение анализировать требования и применять их на практике.

Задание:
1. Определения и основы.
- Кратко опиши, что такое HTML 5 и какие его ключевые преимущества для разработки.
- Укажи, какие API появились в HTML 5 и в каких сценариях они применяются.

2. Разница между версиями.
- Объясни, чем HTML 5 отличается от более ранних версий.
- Приведи примеры тегов/возможностей, которые появились именно в HTML 5.

3. Тестирование поддержки.
- Составь таблицу (или список) поддерживаемых API в разных браузерах.
- Сделай вывод, как обеспечивать совместимость при разработке.

Требования к оформлению:
- Ответ структурируй по пунктам.
- Примеры приводи с коротким пояснением.
- Итоговый вывод выдели отдельным абзацем.`;
  };

  const longText = useMemo(() => {
    const raw = (assignment?.text || '').toString();
    if (!raw || raw.trim().length < 120) return getFallbackText(assignmentTitle);
    return raw;
  }, [assignment?.text, assignmentTitle]);

  return (
    <div className="assignmentPageOuter">
      <div className="disciplineSubHeader">
        <div className="disciplineSubHeaderInner">
          <div className="assignmentSubHeaderBar">
            <button className="disciplineBackBtn" type="button" onClick={() => navigate(-1)} aria-label="Назад">
              ←
            </button>
            <div className="assignmentSubHeaderTitle">{assignmentTitle}</div>
            <div className={`badge ${statusClass}`}>{statusText}</div>
          </div>
        </div>
      </div>

      <div className="pageWrap assignmentPage">
        <Card className="sectionCard assignmentIntroCard">
          <div className="assignmentIntroHead">
            <div className="assignmentIntroTitle">{assignmentTitle}</div>
            <div className={`badge ${statusClass}`}>{statusText}</div>
          </div>
          <div className="assignmentIntroBody">
            <div className="assignmentIntroText">{longText}</div>
          </div>
        </Card>

        <Card className="sectionCard assignmentCard">
          <div className="assignmentCardHead">
            <div className="assignmentCardTitle">Задание "{assignmentTitle}"</div>
            <div className="assignmentCardPoints">{assignment?.max_points ?? 10} баллов</div>
          </div>
          <div className="assignmentCardBody">
            <div className="assignmentText">{longText}</div>
          </div>
        </Card>

        {user?.role === 'student' ? (
          <Card className="sectionCard assignmentAnswerCard">
            <div className="assignmentAnswerTitle">Поле ответа</div>
            <div className="assignmentAnswerInputWrap">
              <textarea className="assignmentTextarea" value={answer} onChange={(e) => setAnswer(e.target.value)} />
              <div className="assignmentAnswerLine" aria-hidden="true" />
            </div>
            <div className="assignmentAnswerActions">
              <Button variant="pill" size="sm">Проверить себя</Button>
              <Button variant="pill" size="sm" onClick={onSubmit} disabled={saving}>Отправить</Button>
            </div>
          </Card>
        ) : null}

        <div className="assignmentBottom">
          <Button variant="pill" size="sm" className="assignmentNextBtn" onClick={() => navigate('/disciplines')}>Перейти к следующей теме</Button>
          <Button variant="pill" size="sm" className="assignmentNextIcon" onClick={() => navigate('/disciplines')} aria-label="Следующая тема">→</Button>
        </div>
      </div>
    </div>
  );
}
