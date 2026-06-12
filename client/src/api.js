const API_BASE = process.env.REACT_APP_API_URL || '';

let authToken = null;

export function setToken(token) {
  authToken = token;
}

export function getToken() {
  return authToken;
}

export function clearToken() {
  authToken = null;
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

export function login(username, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getAccounts() {
  return request('/api/accounts');
}

export function getAccount(id) {
  return request(`/api/accounts/${id}`);
}

export function transfer(fromAccountId, toAccountId, amount) {
  return request('/api/transfer', {
    method: 'POST',
    body: JSON.stringify({ fromAccountId, toAccountId, amount }),
  });
}

export function getHealth() {
  return request('/health');
}
