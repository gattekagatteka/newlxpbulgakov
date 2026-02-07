const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('token') || '';
}

export async function apiRequest(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const h = { ...headers };
  if (body !== undefined) {
    h['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getToken();
    if (token) h.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let text = '';
    try {
      text = await res.text();
    } catch (_) {
      text = '';
    }
    const err = new Error(text || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  return res.text();
}
