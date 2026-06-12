const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { applyMiddleware } = require('./middleware');
const { accounts, findAccountById, sanitizeAccount } = require('./accounts');
const { notFoundHandler, globalErrorHandler } = require('./errors');
const { authMiddleware, generateToken, findUserByUsername } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

applyMiddleware(app);
app.use(authMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: process.env.npm_package_version });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const user = findUserByUsername(username);
  if (!user) {
    logger.warn('Login failed — unknown user', { username, ip: req.ip });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken(user);
  logger.info('User logged in', { username: user.username, role: user.role, ip: req.ip });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

app.get('/api/accounts', (req, res) => {
  logger.info('Accounts endpoint accessed', { ip: req.ip });
  res.json({ accounts: accounts.map(sanitizeAccount) });
});

app.get('/api/accounts/:id', (req, res) => {
  const parsed = parseInt(req.params.id, 10);
  if (Number.isNaN(parsed)) {
    logger.warn('Invalid account ID format', { accountId: req.params.id, ip: req.ip, requestId: req.requestId });
    return res.status(400).json({ error: 'Invalid account ID format' });
  }
  const account = findAccountById(parsed);
  if (!account) {
    logger.warn('Account not found', { accountId: req.params.id, ip: req.ip, requestId: req.requestId });
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json({ account: sanitizeAccount(account) });
});

app.post('/api/transfer', (req, res) => {
  const { fromAccountId, toAccountId, amount } = req.body;
  
  if (!fromAccountId || !toAccountId || !amount || typeof amount !== 'number' || amount <= 0) {
    logger.warn('Invalid transfer parameters', { fromAccountId, toAccountId, amount, ip: req.ip, requestId: req.requestId });
    return res.status(400).json({ error: 'Invalid transfer parameters' });
  }

  if (fromAccountId === toAccountId) {
    logger.warn('Self-transfer attempted', { accountId: fromAccountId, ip: req.ip, requestId: req.requestId });
    return res.status(400).json({ error: 'Cannot transfer to the same account' });
  }
  
  const fromAccount = findAccountById(fromAccountId);
  const toAccount = findAccountById(toAccountId);
  
  if (!fromAccount || !toAccount) {
    logger.warn('Transfer account not found', {
      fromAccountId, toAccountId,
      fromExists: !!fromAccount, toExists: !!toAccount,
      ip: req.ip, requestId: req.requestId
    });
    return res.status(404).json({ error: 'Account not found' });
  }
  
  if (fromAccount.balance < amount) {
    logger.warn('Insufficient funds', { fromAccountId, amount, balance: fromAccount.balance, requestId: req.requestId });
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  const previousFromBalance = fromAccount.balance;
  const previousToBalance = toAccount.balance;
  fromAccount.balance -= amount;
  toAccount.balance += amount;

  if (fromAccount.balance !== previousFromBalance - amount || toAccount.balance !== previousToBalance + amount) {
    fromAccount.balance = previousFromBalance;
    toAccount.balance = previousToBalance;
    logger.error('Transfer consistency check failed, rolled back', {
      fromAccountId, toAccountId, amount, requestId: req.requestId
    });
    return res.status(500).json({ error: 'Transfer failed due to internal error' });
  }
  
  logger.info('Transfer completed', {
    fromAccountId, toAccountId, amount,
    fromBalance: fromAccount.balance, toBalance: toAccount.balance,
    requestId: req.requestId
  });
  
  res.json({ message: 'Transfer successful', fromBalance: fromAccount.balance, toBalance: toAccount.balance });
});

// Serve React client build when available
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'build');
const clientIndexPath = path.join(clientBuildPath, 'index.html');
if (fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return next();
    }
    res.sendFile(clientIndexPath, (err) => {
      if (err) next();
    });
  });
}

app.use(notFoundHandler);
app.use(globalErrorHandler);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(`Banking app running on port ${PORT}`, { environment: NODE_ENV });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`, { port: PORT });
    } else {
      logger.error('Server failed to start', { error: err.message, stack: err.stack });
    }
    process.exit(1);
  });
}

module.exports = app;
