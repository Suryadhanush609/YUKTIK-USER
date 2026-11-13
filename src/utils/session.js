// src/utils/session.js

const USER_INCIDENTS_KEY = 'yuktik_user_reported_incidents';
const REPORTER_ID_KEY = 'yuktik_reporter_id';

export function getReporterId() {
  let id = localStorage.getItem(REPORTER_ID_KEY);
  if (!id) {
    id = 'CITIZEN-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    localStorage.setItem(REPORTER_ID_KEY, id);
  }
  return id;
}

export function saveUserIncident(incidentId) {
  const ids = getUserIncidentIds();
  if (!ids.includes(Number(incidentId))) {
    ids.unshift(Number(incidentId));
    localStorage.setItem(USER_INCIDENTS_KEY, JSON.stringify(ids));
  }
}

export function getUserIncidentIds() {
  try {
    const raw = localStorage.getItem(USER_INCIDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse user incident ids', e);
    return [];
  }
}

