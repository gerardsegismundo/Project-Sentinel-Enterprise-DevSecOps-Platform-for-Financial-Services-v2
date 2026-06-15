import { Amplify } from "aws-amplify";
import { signIn, signOut, fetchAuthSession } from "aws-amplify/auth";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    },
  },
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Kept for backward-compat; Cognito session token takes precedence
let _overrideToken: string | null = null;

export function setToken(token: string) { _overrideToken = token; }
export function getToken(): string | null { return _overrideToken; }
export function clearToken() { _overrideToken = null; }

async function getCognitoAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const cognitoToken = await getCognitoAccessToken();
  const token = cognitoToken ?? _overrideToken;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
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

export async function login(username: string, password: string): Promise<LoginResponse> {
  await signIn({ username, password });
  const session = await fetchAuthSession();
  const accessToken = session.tokens?.accessToken?.toString() ?? "";
  const idPayload = session.tokens?.idToken?.payload ?? {};
  const groups = (idPayload["cognito:groups"] as string[] | undefined) ?? [];
  const user: User = {
    id: 0,
    username: (idPayload["cognito:username"] as string) ?? username,
    role: groups[0] ?? "viewer",
  };
  return { token: accessToken, user };
}

export async function logout(): Promise<void> {
  clearToken();
  await signOut();
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
