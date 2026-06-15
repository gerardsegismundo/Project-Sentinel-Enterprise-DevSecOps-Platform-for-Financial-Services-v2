interface Account {
    id: number;
    accountNumber: string;
    type: string;
    balance: number;
}
declare const accounts: Account[];
interface SanitizedAccount {
    id: number;
    type: string;
    balance: number;
}
declare function findAccountById(id: number): Account | undefined;
declare function sanitizeAccount(account: Account): SanitizedAccount;
export { accounts, findAccountById, sanitizeAccount };
export type { Account, SanitizedAccount };
//# sourceMappingURL=accounts.d.ts.map