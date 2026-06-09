const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'banking-app', environment: NODE_ENV },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests', retryAfter: '15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

const accounts = [
  { id: 1, accountNumber: '****1234', type: 'checking', balance: 1500.00 },
  { id: 2, accountNumber: '****5678', type: 'savings', balance: 5000.00 }
];

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: process.env.npm_package_version });
});

app.get('/api/accounts', (req, res) => {
  logger.info('Accounts endpoint accessed', { ip: req.ip });
  res.json({ accounts: accounts.map(a => ({ id: a.id, type: a.type, balance: a.balance })) });
});

app.get('/api/accounts/:id', (req, res) => {
  const account = accounts.find(a => a.id === parseInt(req.params.id));
  if (!account) {
    logger.warn('Account not found', { accountId: req.params.id, ip: req.ip });
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json({ account: { id: account.id, type: account.type, balance: account.balance } });
});

app.post('/api/transfer', (req, res) => {
  const { fromAccountId, toAccountId, amount } = req.body;
  
  if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid transfer parameters' });
  }
  
  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccount = accounts.find(a => a.id === toAccountId);
  
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

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Banking app running on port ${PORT}`, { environment: NODE_ENV });
  });
}

module.exports = app;
