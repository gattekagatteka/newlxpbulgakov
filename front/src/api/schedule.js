import { apiRequest } from './client';

export function getScheduleDay(day) {
  return apiRequest(`/schedule/day?day=${day}`);
}

export function getScheduleWeek(start, end) {
  return apiRequest(`/schedule/week?start=${start}&end=${end}`);
}
