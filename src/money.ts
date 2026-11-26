import type { Expense, Id } from './types';

/** Today (or `d`) as YYYY-MM-DD in the user's own time zone, not UTC. */
export function localISODate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatMoney(cents: number): string {
  return `RM ${(Math.abs(cents) / 100).toFixed(2)}`;
}

/** Parses "12.5" into 1250 cents. Returns null for anything that isn't a valid non-negative amount. */
export function parseMoney(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) return null;
  return Math.round(parseFloat(trimmed) * 100);
}

/** Splits a total evenly; leftover cents go to the first people in the list. */
export function splitEqually(total: number, ids: Id[]): Record<Id, number> {
  const shares: Record<Id, number> = {};
  if (ids.length === 0) return shares;
  const base = Math.floor(total / ids.length);
  let remainder = total - base * ids.length;
  for (const id of ids) {
    shares[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return shares;
}

/** Like formatMoney but keeps the sign: "+RM 12.00", "-RM 3.50", "RM 0.00". */
export function formatSigned(cents: number): string {
  return `${cents > 0 ? '+' : cents < 0 ? '-' : ''}${formatMoney(cents)}`;
}

/**
 * Splits a total in proportion to whole-number weights (percent points, share counts).
 * Leftover cents go to the people with the largest remainders, so the parts always sum to `total`.
 */
export function splitByWeights(total: number, weights: Record<Id, number>): Record<Id, number> {
  const ids = Object.keys(weights).filter((id) => weights[id] > 0);
  const sum = ids.reduce((s, id) => s + weights[id], 0);
  const shares: Record<Id, number> = {};
  if (sum === 0) return shares;
  const parts = ids.map((id) => {
    const exact = (total * weights[id]) / sum;
    return { id, base: Math.floor(exact), rest: exact - Math.floor(exact) };
  });
  let remainder = total - parts.reduce((s, p) => s + p.base, 0);
  for (const p of [...parts].sort((a, b) => b.rest - a.rest)) {
    shares[p.id] = p.base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return Object.fromEntries(ids.map((id) => [id, shares[id]]));
}

export function isInvolved(expense: Expense, userId: Id): boolean {
  return expense.paidById === userId || (expense.shares[userId] ?? 0) > 0;
}

/** Net position per person: positive = they are owed money, negative = they owe money. */
export function netBalances(expenses: Expense[]): Record<Id, number> {
  const net: Record<Id, number> = {};
  for (const e of expenses) {
    net[e.paidById] = (net[e.paidById] ?? 0) + e.amount;
    for (const [id, share] of Object.entries(e.shares)) {
      net[id] = (net[id] ?? 0) - share;
    }
  }
  return net;
}

/** Positive = `other` owes `me`; negative = `me` owes `other`. */
export function balanceBetween(expenses: Expense[], me: Id, other: Id): number {
  let balance = 0;
  for (const e of expenses) {
    if (e.paidById === me) balance += e.shares[other] ?? 0;
    else if (e.paidById === other) balance -= e.shares[me] ?? 0;
  }
  return balance;
}

export interface Settlement {
  fromId: Id;
  toId: Id;
  amount: number;
}

/** Turns net balances into a short list of "X pays Y" transfers. */
export function simplifyDebts(net: Record<Id, number>): Settlement[] {
  const debtors = Object.entries(net)
    .filter(([, v]) => v < 0)
    .map(([id, v]) => ({ id, amount: -v }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ id, amount: v }))
    .sort((a, b) => b.amount - a.amount);

  const result: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    result.push({ fromId: debtors[i].id, toId: creditors[j].id, amount: pay });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }
  return result;
}
