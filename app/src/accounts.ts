interface Account {
  id: number;
  accountNumber: string;
  type: string;
  balance: number;
}

const accounts: Account[] = [
  { id: 1, accountNumber: '****1234', type: 'checking', balance: 1500.00 },
  { id: 2, accountNumber: '****5678', type: 'savings', balance: 5000.00 }
];

interface SanitizedAccount {
  id: number;
  type: string;
  balance: number;
}

function findAccountById(id: number): Account | undefined {
  return accounts.find(a => a.id === id);
}

function sanitizeAccount(account: Account): SanitizedAccount {
  return { id: account.id, type: account.type, balance: account.balance };
}

export { accounts, findAccountById, sanitizeAccount };
export type { Account, SanitizedAccount };