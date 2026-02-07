import { apiRequest } from './client';

export function getAttendanceJournal({ groupId, disciplineId, days }) {
  const daysStr = days.join(',');
  return apiRequest(`/journal/attendance?group_id=${groupId}&discipline_id=${disciplineId}&days=${encodeURIComponent(daysStr)}`);
}

export function setAttendance({ studentId, disciplineId, day, status }) {
  return apiRequest('/journal/attendance', {
    method: 'POST',
    body: { student_id: studentId, discipline_id: disciplineId, day, status },
  });
}

export function getGradesJournal({ groupId, disciplineId }) {
  return apiRequest(`/journal/grades?group_id=${groupId}&discipline_id=${disciplineId}`);
}

export function setGrade({ studentId, disciplineId, topicId, points, maxPoints = 5 }) {
  return apiRequest('/journal/grades', {
    method: 'POST',
    body: { student_id: studentId, discipline_id: disciplineId, topic_id: topicId, points, max_points: maxPoints },
  });
}
