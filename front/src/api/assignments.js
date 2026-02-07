import { apiRequest } from './client';

export function getAssignment(assignmentId) {
  return apiRequest(`/assignments/${assignmentId}`);
}

export function getMySubmission(assignmentId) {
  return apiRequest(`/assignments/${assignmentId}/my`);
}

export function submitAssignment(assignmentId, answerText) {
  return apiRequest(`/assignments/${assignmentId}/submit`, { method: 'POST', body: { answer_text: answerText } });
}

export function getAssignmentsByDiscipline(disciplineId) {
  return apiRequest(`/assignments/by_discipline/${disciplineId}`);
}
