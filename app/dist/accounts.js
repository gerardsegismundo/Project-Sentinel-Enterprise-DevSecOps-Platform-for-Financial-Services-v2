"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accounts = void 0;
exports.findAccountById = findAccountById;
exports.sanitizeAccount = sanitizeAccount;
const accounts = [
    { id: 1, accountNumber: '****1234', type: 'checking', balance: 1500.00 },
    { id: 2, accountNumber: '****5678', type: 'savings', balance: 5000.00 }
];
exports.accounts = accounts;
function findAccountById(id) {
    return accounts.find(a => a.id === id);
}
function sanitizeAccount(account) {
    return { id: account.id, type: account.type, balance: account.balance };
}
//# sourceMappingURL=accounts.js.map