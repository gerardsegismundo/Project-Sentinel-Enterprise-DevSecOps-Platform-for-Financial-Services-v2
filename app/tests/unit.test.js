const request = require('supertest');
const app = require('../src/index');

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('Accounts API', () => {
  it('should return list of accounts (without sensitive data)', async () => {
    const res = await request(app).get('/api/accounts');
    expect(res.statusCode).toEqual(200);
    expect(res.body.accounts).toBeDefined();
    expect(res.body.accounts[0]).not.toHaveProperty('accountNumber');
  });

  it('should return 404 for non-existent account', async () => {
    const res = await request(app).get('/api/accounts/999');
    expect(res.statusCode).toEqual(404);
  });

  it('should return 400 for non-numeric account ID', async () => {
    const res = await request(app).get('/api/accounts/abc');
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Invalid account ID format');
  });
});

describe('Transfer API', () => {
  it('should reject invalid transfer parameters', async () => {
    const res = await request(app).post('/api/transfer').send({ amount: -50 });
    expect(res.statusCode).toEqual(400);
  });

  it('should reject transfer with insufficient funds', async () => {
    const res = await request(app).post('/api/transfer').send({
      fromAccountId: 1,
      toAccountId: 2,
      amount: 100000
    });
    expect(res.statusCode).toEqual(400);
  });

  it('should reject self-transfer', async () => {
    const res = await request(app).post('/api/transfer').send({
      fromAccountId: 1,
      toAccountId: 1,
      amount: 10
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Cannot transfer to the same account');
  });

  it('should reject non-numeric amount', async () => {
    const res = await request(app).post('/api/transfer').send({
      fromAccountId: 1,
      toAccountId: 2,
      amount: 'fifty'
    });
    expect(res.statusCode).toEqual(400);
  });
});

describe('JSON Parse Error Handling', () => {
  it('should return 400 for malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/transfer')
      .set('Content-Type', 'application/json')
      .send('{"invalid json');
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Malformed JSON in request body');
  });
});

describe('Request Correlation', () => {
  it('should include X-Request-Id header in responses', async () => {
    const res = await request(app).get('/api/accounts');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});

describe('404 Handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');
    expect(res.statusCode).toEqual(404);
  });
});
