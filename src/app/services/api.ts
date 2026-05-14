const API = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Solicitud fallida' }));
    throw new Error(err.error || 'Solicitud fallida');
  }
  return res.json();
}

// Auth
export async function register(data) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function login(data) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getMe() {
  const res = await fetch(`${API}/auth/me`, { headers: headers() });
  return handleResponse(res);
}

// Employees
export async function getEmployees() {
  const res = await fetch(`${API}/employees`, { headers: headers() });
  return handleResponse(res);
}

export async function createEmployee(data) {
  const res = await fetch(`${API}/employees`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateEmployee(id, data) {
  const res = await fetch(`${API}/employees/${id}`, {
    method: 'PUT', headers: headers(), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteEmployee(id) {
  const res = await fetch(`${API}/employees/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  return handleResponse(res);
}

// Clients
export async function getClients() {
  const res = await fetch(`${API}/clients`, { headers: headers() });
  return handleResponse(res);
}

export async function createClient(data) {
  const res = await fetch(`${API}/clients`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateClient(id, data) {
  const res = await fetch(`${API}/clients/${id}`, {
    method: 'PUT', headers: headers(), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteClient(id) {
  const res = await fetch(`${API}/clients/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  return handleResponse(res);
}

// Appointments
export async function getAppointments() {
  const res = await fetch(`${API}/appointments`, { headers: headers() });
  return handleResponse(res);
}

export async function createAppointment(data) {
  const res = await fetch(`${API}/appointments`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateAppointment(id, data) {
  const res = await fetch(`${API}/appointments/${id}`, {
    method: 'PUT', headers: headers(), body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteAppointment(id) {
  const res = await fetch(`${API}/appointments/${id}`, {
    method: 'DELETE', headers: headers(),
  });
  return handleResponse(res);
}

// Config
export async function getConfig() {
  const res = await fetch(`${API}/config`, { headers: headers() });
  return handleResponse(res);
}

export async function updateConfig(data) {
  const res = await fetch(`${API}/config`, {
    method: 'PUT', headers: headers(), body: JSON.stringify(data),
  });
  return handleResponse(res);
}
