import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration', true);
const healthDuration = new Trend('health_check_duration', true);
const accountsDuration = new Trend('accounts_duration', true);
const transferDuration = new Trend('transfer_duration', true);
const successfulTransfers = new Counter('successful_transfers');

// Test configuration — Golden Signals focused
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up
    { duration: '1m', target: 50 },    // Sustained load
    { duration: '30s', target: 100 },  // Peak load
    { duration: '1m', target: 100 },   // Sustain peak
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // Latency SLO
    errors: ['rate<0.05'],                            // Error rate < 5%
    login_duration: ['p(95)<300'],
    health_check_duration: ['p(95)<100'],
    accounts_duration: ['p(95)<200'],
    transfer_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const USERS = ['admin', 'teller', 'viewer'];

export default function () {
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  let token;

  group('Authentication', function () {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      username: user,
      password: 'test',
    }), { headers: { 'Content-Type': 'application/json' } });

    loginDuration.add(loginRes.timings.duration);
    const loginOk = check(loginRes, {
      'login status 200': (r) => r.status === 200,
      'login returns token': (r) => JSON.parse(r.body).token !== undefined,
    });
    errorRate.add(!loginOk);

    if (loginOk) {
      token = JSON.parse(loginRes.body).token;
    }
  });

  if (!token) return;

  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  group('Health Check', function () {
    const healthRes = http.get(`${BASE_URL}/health`);
    healthDuration.add(healthRes.timings.duration);
    const healthOk = check(healthRes, {
      'health status 200': (r) => r.status === 200,
      'health returns healthy': (r) => JSON.parse(r.body).status === 'healthy',
    });
    errorRate.add(!healthOk);
  });

  group('Account Operations', function () {
    const accountsRes = http.get(`${BASE_URL}/api/accounts`, authHeaders);
    accountsDuration.add(accountsRes.timings.duration);
    const accountsOk = check(accountsRes, {
      'accounts status 200': (r) => r.status === 200,
      'accounts returns array': (r) => Array.isArray(JSON.parse(r.body)),
      'accounts has entries': (r) => JSON.parse(r.body).length > 0,
    });
    errorRate.add(!accountsOk);
  });

  group('Fund Transfer', function () {
    const transferRes = http.post(`${BASE_URL}/api/transfer`, JSON.stringify({
      fromAccountId: 1,
      toAccountId: 2,
      amount: 0.01,
    }), authHeaders);

    transferDuration.add(transferRes.timings.duration);
    const transferOk = check(transferRes, {
      'transfer status 200': (r) => r.status === 200,
    });
    errorRate.add(!transferOk);
    if (transferOk) successfulTransfers.add(1);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'performance-report.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  // k6 provides a built-in text summary
  return '';
}
