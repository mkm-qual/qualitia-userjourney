const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  localStorage.setItem('token', data.token);
  return data;
}

export function logout() {
  localStorage.removeItem('token');
}

export async function getMe() {
  const res = await fetch(`${BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function getJourney() {
  const res = await fetch(`${BASE}/journey`, { headers: authHeaders() });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function getJourneyVersion() {
  const res = await fetch(`${BASE}/journey/version`, { headers: authHeaders() });
  if (!res.ok) return null;
  return res.json();
}

export async function saveJourney(data) {
  const res = await fetch(`${BASE}/journey`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ data })
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Save failed');
  return result;
}

export async function getUsers() {
  const res = await fetch(`${BASE}/users`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function createUser(username, password, role) {
  const res = await fetch(`${BASE}/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ username, password, role })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function updateUserPassword(id, password) {
  const res = await fetch(`${BASE}/users/${id}/password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${BASE}/auth/change-password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function deleteUser(id) {
  const res = await fetch(`${BASE}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}
