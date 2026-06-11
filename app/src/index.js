const express = require('express');
const logger = require('./logger');
const { applyMiddleware } = require('./middleware');
const { accounts, findAccountById, sanitizeAccount } = require('./accounts');
const { notFoundHandler, globalErrorHandler } = require('./errors');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

applyMiddleware(app);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: process.env.npm_package_version });
});

app.get('/api/accounts', (req, res) => {
  logger.info('Accounts endpoint accessed', { ip: req.ip });
  res.json({ accounts: accounts.map(sanitizeAccount) });
});

app.get('/api/accounts/:id', (req, res) => {
  const account = findAccountById(parseInt(req.params.id, 10));
  if (!account) {
    logger.warn('Account not found', { accountId: req.params.id, ip: req.ip });
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json({ account: sanitizeAccount(account) });
});

app.post('/api/transfer', (req, res) => {
  const { fromAccountId, toAccountId, amount } = req.body;

  if (!fromAccountId || !toAccountId || amount == null || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid transfer parameters' });
  }
  
  const fromAccount = findAccountById(fromAccountId);
  const toAccount = findAccountById(toAccountId);
  
  if (!fromAccount || !toAccount) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  if (fromAccount.balance < amount) {
    logger.warn('Insufficient funds', { fromAccountId, amount, balance: fromAccount.balance });
    return res.status(400).json({ error: 'Insufficient funds' });
  }
  
  fromAccount.balance -= amount;
  toAccount.balance += amount;
  
  logger.info('Transfer completed', { fromAccountId, toAccountId, amount, newBalance: fromAccount.balance });
  
  res.json({ message: 'Transfer successful', fromBalance: fromAccount.balance, toBalance: toAccount.balance });
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Banking app running on port ${PORT}`, { environment: NODE_ENV });
  });
}

module.exports = app;
