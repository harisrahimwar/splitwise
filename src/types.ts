export type Id = string;

export interface User {
  id: Id;
  name: string;
}

export interface Group {
  id: Id;
  name: string;
  memberIds: Id[];
}

export interface Expense {
  id: Id;
  description: string;
  /** Total amount in cents. */
  amount: number;
  paidById: Id;
  /** null = a direct expense between friends, not inside a group. */
  groupId: Id | null;
  /** How much each participant owes for this expense, in cents. Sums to `amount`. */
  shares: Record<Id, number>;
  /** ISO date string. */
  date: string;
}

export interface AppState {
  users: User[];
  groups: Group[];
  expenses: Expense[];
  /** Whose point of view the app shows. Stands in for login in this PoC. */
  currentUserId: Id;
}
