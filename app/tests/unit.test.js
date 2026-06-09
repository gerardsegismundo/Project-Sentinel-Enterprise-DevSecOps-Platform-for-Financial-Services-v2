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
});

describe('404 Handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');
    expect(res.statusCode).toEqual(404);
  });
});
