import { apiRequest } from './client';

export function getDisciplines() {
  return apiRequest('/disciplines');
}

export function getTopicsByDiscipline(disciplineId) {
  return apiRequest(`/disciplines/${disciplineId}/topics`);
}

export function getTopic(topicId) {
  return apiRequest(`/topics/${topicId}`);
}
