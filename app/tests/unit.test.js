const request = require('supertest');
const app = require('../src/index');

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('healthy');
  });

  it('should include a timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Accounts API', () => {
  it('should return list of accounts (without sensitive data)', async () => {
    const res = await request(app).get('/api/accounts');
    expect(res.statusCode).toEqual(200);
    expect(res.body.accounts).toBeDefined();
    expect(res.body.accounts[0]).not.toHaveProperty('accountNumber');
  });

  it('should return account details for a valid account', async () => {
    const res = await request(app).get('/api/accounts/1');
    expect(res.statusCode).toEqual(200);
    expect(res.body.account).toBeDefined();
    expect(res.body.account.id).toBe(1);
    expect(res.body.account.type).toBeDefined();
    expect(res.body.account.balance).toBeDefined();
    expect(res.body.account).not.toHaveProperty('accountNumber');
  });

  it('should return the second account by id', async () => {
    const res = await request(app).get('/api/accounts/2');
    expect(res.statusCode).toEqual(200);
    expect(res.body.account.id).toBe(2);
  });

  it('should return 404 for non-existent account', async () => {
    const res = await request(app).get('/api/accounts/999');
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toBe('Account not found');
  });

  it('should return 404 for non-numeric account id', async () => {
    const res = await request(app).get('/api/accounts/abc');
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toBe('Account not found');
  });

  it('should include all expected fields in the account list', async () => {
    const res = await request(app).get('/api/accounts');
    const account = res.body.accounts[0];
    expect(account).toHaveProperty('id');
    expect(account).toHaveProperty('type');
    expect(account).toHaveProperty('balance');
  });

  it('should return 400 for non-numeric account ID', async () => {
    const res = await request(app).get('/api/accounts/abc');
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Invalid account ID format');
  });
});

describe('Transfer API', () => {
  it('should reject transfer with missing parameters', async () => {
    const res = await request(app).post('/api/transfer').send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Invalid transfer parameters');
  });

  it('should reject invalid transfer parameters', async () => {
    const res = await request(app).post('/api/transfer').send({ amount: -50 });
    expect(res.statusCode).toEqual(400);
  });

  it('should reject transfer with zero amount', async () => {
    const res = await request(app).post('/api/transfer').send({
      fromAccountId: 1,
      toAccountId: 2,
      amount: 0
    });
    expect(res.statusCode).toEqual(400);
  });

  it('should reject transfer with non-existent source account', async () => {
    const res = await request(app).post('/api/transfer').send({
      fromAccountId: 999,
      toAccountId: 2,
      amount: 10
    });
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toBe('Account not found');
  });

  it('should reject transfer with non-existent destination account', async () => {
    const res = await request(app).post('/api/transfer').send({
      fromAccountId: 1,
      toAccountId: 999,
      amount: 10
    });
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toBe('Account not found');
  });

  it('should reject transfer with insufficient funds', async () => {
    const res = await request(app).post('/api/transfer').send({
      fromAccountId: 1,
      toAccountId: 2,
      amount: 100000
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Insufficient funds');
  });

  it('should complete a valid transfer', async () => {
    const before = await request(app).get('/api/accounts');
    const fromBefore = before.body.accounts.find(a => a.id === 1).balance;
    const toBefore = before.body.accounts.find(a => a.id === 2).balance;

    const res = await request(app).post('/api/transfer').send({
      fromAccountId: 1,
      toAccountId: 2,
      amount: 100
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Transfer successful');
    expect(res.body.fromBalance).toBe(fromBefore - 100);
    expect(res.body.toBalance).toBe(toBefore + 100);
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
    expect(res.body.error).toBe('Endpoint not found');
  });

  it('should return 404 for unknown POST routes', async () => {
    const res = await request(app).post('/unknown');
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toBe('Endpoint not found');
  });
});

describe('Security Headers', () => {
  it('should include helmet security headers', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('should accept JSON request bodies', async () => {
    const res = await request(app)
      .post('/api/transfer')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ fromAccountId: 1, toAccountId: 2, amount: 1 }));
    expect(res.statusCode).not.toEqual(415);
  });
});

describe('Error Handling Middleware', () => {
  it('should return 500 for unhandled errors', async () => {
    const errorApp = require('express')();
    errorApp.get('/error', (req, res, next) => {
      next(new Error('Test error'));
    });
    errorApp.use((err, req, res, next) => {
      res.status(500).json({ error: 'Internal server error' });
    });
    const res = await request(errorApp).get('/error');
    expect(res.statusCode).toEqual(500);
    expect(res.body.error).toBe('Internal server error');
  });
});
