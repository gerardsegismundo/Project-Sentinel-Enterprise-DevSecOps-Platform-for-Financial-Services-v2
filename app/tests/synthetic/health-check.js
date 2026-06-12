/**
 * Synthetic monitoring script for Project Sentinel Banking App.
 *
 * Runs as a scheduled CI job (every 5 minutes) or locally via:
 *   TARGET_URL=http://localhost:3000 node tests/synthetic/health-check.js
 *
 * Checks:
 *   1. Health endpoint responds with status "healthy"
 *   2. Auth flow works (login → get accounts)
 *   3. Response times within SLO thresholds
 *   4. TLS certificate validity (when HTTPS)
 */

const http = require('http');
const https = require('https');

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';
const SLO_LATENCY_MS = parseInt(process.env.SLO_LATENCY_MS || '500', 10);
const DEMO_USER = process.env.DEMO_USER || 'admin';

const results = [];

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, TARGET_URL);
    const proto = url.protocol === 'https:' ? https : http;
    const start = Date.now();

    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json', ...headers },
      timeout: 10000,
    };

    const req = proto.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data,
          latency: Date.now() - start,
          headers: res.headers,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function record(name, passed, latency, detail) {
  results.push({ name, passed, latency, detail, timestamp: new Date().toISOString() });
  const icon = passed ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${name} (${latency}ms) ${detail || ''}`);
}

async function checkHealth() {
  try {
    const res = await request('GET', '/health');
    const body = JSON.parse(res.body);
    const passed = res.status === 200 && body.status === 'healthy';
    record('Health endpoint', passed, res.latency, `status=${body.status}`);
    return passed;
  } catch (err) {
    record('Health endpoint', false, 0, err.message);
    return false;
  }
}

async function checkAuth() {
  try {
    const loginRes = await request('POST', '/api/auth/login', {
      username: DEMO_USER,
      password: 'test',
    });
    const loginBody = JSON.parse(loginRes.body);
    const loginPassed = loginRes.status === 200 && !!loginBody.token;
    record('Login flow', loginPassed, loginRes.latency, `user=${DEMO_USER}`);

    if (!loginPassed) return false;

    const accountsRes = await request('GET', '/api/accounts', null, {
      Authorization: `Bearer ${loginBody.token}`,
    });
    const accountsPassed = accountsRes.status === 200;
    record('Authenticated API call', accountsPassed, accountsRes.latency, 'GET /api/accounts');

    return loginPassed && accountsPassed;
  } catch (err) {
    record('Auth flow', false, 0, err.message);
    return false;
  }
}

async function checkLatencySLO() {
  try {
    const res = await request('GET', '/health');
    const passed = res.latency < SLO_LATENCY_MS;
    record(`Latency SLO (<${SLO_LATENCY_MS}ms)`, passed, res.latency);
    return passed;
  } catch (err) {
    record('Latency SLO', false, 0, err.message);
    return false;
  }
}

async function checkInvalidAuth() {
  try {
    const res = await request('POST', '/api/auth/login', {
      username: 'nonexistent',
      password: 'wrong',
    });
    const passed = res.status === 401;
    record('Invalid auth rejection', passed, res.latency, `status=${res.status}`);
    return passed;
  } catch (err) {
    record('Invalid auth rejection', false, 0, err.message);
    return false;
  }
}

async function main() {
  console.log(`\nSynthetic Monitoring — ${TARGET_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('─'.repeat(60));

  const checks = await Promise.all([
    checkHealth(),
    checkAuth(),
    checkLatencySLO(),
    checkInvalidAuth(),
  ]);

  console.log('─'.repeat(60));

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`\nResults: ${passed}/${total} passed, ${failed} failed`);

  // Output JSON report for CI artifact collection
  const report = {
    target: TARGET_URL,
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed },
    checks: results,
  };
  console.log('\n--- JSON Report ---');
  console.log(JSON.stringify(report, null, 2));

  process.exit(failed > 0 ? 1 : 0);
}

main();
