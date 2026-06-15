const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

let authToken: string | null = null;

export function setToken(token: string) {
  authToken = token;
}

export function getToken(): string | null {
  return authToken;
}

export function clearToken() {
  authToken = null;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || `Request failed with status ${res.status}`);
    (err as ApiError).status = res.status;
    throw err;
  }

  return data as T;
}

export interface ApiError extends Error {
  status: number;
}

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Account {
  id: number;
  type: string;
  balance: number;
}

export interface TransferResponse {
  message: string;
  from: Account;
  to: Account;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getAccounts(): Promise<{ accounts: Account[] }> {
  return request<{ accounts: Account[] }>("/api/accounts");
}

export function getAccount(id: number): Promise<Account> {
  return request<Account>(`/api/accounts/${id}`);
}

export function transfer(fromId: number, toId: number, amount: number): Promise<TransferResponse> {
  return request<TransferResponse>("/api/transfer", {
    method: "POST",
    body: JSON.stringify({ fromAccountId: fromId, toAccountId: toId, amount }),
  });
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}
