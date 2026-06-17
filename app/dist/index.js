"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("./logger"));
const middleware_1 = require("./middleware");
const accounts_1 = require("./accounts");
const errors_1 = require("./errors");
const auth_1 = require("./auth");
const cognito_auth_1 = require("./cognito-auth");
const auth_2 = require("./auth");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
(0, middleware_1.applyMiddleware)(app);
app.use(auth_1.authMiddleware);
// Cognito JWT guard — applied only to protected API routes
const useCognito = !!process.env.COGNITO_USER_POOL_ID;
if (useCognito) {
    app.use('/api/accounts', cognito_auth_1.cognitoAuthMiddleware);
    app.use('/api/transfer', cognito_auth_1.cognitoAuthMiddleware);
}
app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: process.env.npm_package_version });
});
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
    }
    const user = (0, auth_2.findUserByUsername)(username);
    if (!user) {
        logger_1.default.warn('Login failed — unknown user', { username, ip: req.ip });
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const token = (0, auth_2.generateToken)(user);
    logger_1.default.info('User logged in', { username: user.username, role: user.role, ip: req.ip });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});
app.get('/api/accounts', (req, res) => {
    logger_1.default.info('Accounts endpoint accessed', { ip: req.ip });
    res.json({ accounts: accounts_1.accounts.map(accounts_1.sanitizeAccount) });
});
app.get('/api/accounts/:id', (req, res) => {
    const parsed = parseInt(req.params.id, 10);
    if (Number.isNaN(parsed)) {
        logger_1.default.warn('Invalid account ID format', { accountId: req.params.id, ip: req.ip });
        res.status(400).json({ error: 'Invalid account ID format' });
        return;
    }
    const account = (0, accounts_1.findAccountById)(parsed);
    if (!account) {
        logger_1.default.warn('Account not found', { accountId: req.params.id, ip: req.ip });
        res.status(404).json({ error: 'Account not found' });
        return;
    }
    res.json({ account: (0, accounts_1.sanitizeAccount)(account) });
});
app.post('/api/transfer', (req, res) => {
    const { fromAccountId, toAccountId, amount } = req.body;
    if (!fromAccountId || !toAccountId || !amount || typeof amount !== 'number' || amount <= 0) {
        logger_1.default.warn('Invalid transfer parameters', { fromAccountId, toAccountId, amount, ip: req.ip });
        res.status(400).json({ error: 'Invalid transfer parameters' });
        return;
    }
    if (fromAccountId === toAccountId) {
        logger_1.default.warn('Self-transfer attempted', { accountId: fromAccountId, ip: req.ip });
        res.status(400).json({ error: 'Cannot transfer to the same account' });
        return;
    }
    const fromAccount = (0, accounts_1.findAccountById)(fromAccountId);
    const toAccount = (0, accounts_1.findAccountById)(toAccountId);
    if (!fromAccount || !toAccount) {
        logger_1.default.warn('Transfer account not found', {
            fromAccountId, toAccountId,
            fromExists: !!fromAccount, toExists: !!toAccount,
            ip: req.ip
        });
        res.status(404).json({ error: 'Account not found' });
        return;
    }
    if (fromAccount.balance < amount) {
        logger_1.default.warn('Insufficient funds', { fromAccountId, amount, balance: fromAccount.balance });
        res.status(400).json({ error: 'Insufficient funds' });
        return;
    }
    const previousFromBalance = fromAccount.balance;
    const previousToBalance = toAccount.balance;
    fromAccount.balance -= amount;
    toAccount.balance += amount;
    if (fromAccount.balance !== previousFromBalance - amount || toAccount.balance !== previousToBalance + amount) {
        fromAccount.balance = previousFromBalance;
        toAccount.balance = previousToBalance;
        logger_1.default.error('Transfer consistency check failed, rolled back', {
            fromAccountId, toAccountId, amount
        });
        res.status(500).json({ error: 'Transfer failed due to internal error' });
        return;
    }
    logger_1.default.info('Transfer completed', {
        fromAccountId, toAccountId, amount,
        fromBalance: fromAccount.balance, toBalance: toAccount.balance
    });
    res.json({ message: 'Transfer successful', fromBalance: fromAccount.balance, toBalance: toAccount.balance });
});
// Serve Next.js static export when available (skip in test env)
const clientBuildPath = path_1.default.join(__dirname, '..', 'client', 'out');
const clientIndexPath = path_1.default.join(clientBuildPath, 'index.html');
if (fs_1.default.existsSync(clientIndexPath) && process.env.NODE_ENV !== 'test') {
    app.use(express_1.default.static(clientBuildPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path === '/health') {
            return next();
        }
        res.sendFile(clientIndexPath, (err) => {
            if (err)
                next();
        });
    });
}
app.use(errors_1.notFoundHandler);
app.use((err, req, res, next) => {
    (0, errors_1.globalErrorHandler)(err, req, res, next);
});
process.on('unhandledRejection', (reason) => {
    logger_1.default.error('Unhandled promise rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined
    });
});
process.on('uncaughtException', (err) => {
    logger_1.default.error('Uncaught exception — shutting down', { error: err.message, stack: err.stack });
    process.exit(1);
});
if (require.main === module) {
    const server = app.listen(PORT, () => {
        logger_1.default.info(`Banking app running on port ${PORT}`, { environment: NODE_ENV });
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            logger_1.default.error(`Port ${PORT} is already in use`, { port: PORT });
        }
        else {
            logger_1.default.error('Server failed to start', { error: err.message });
        }
        process.exit(1);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map