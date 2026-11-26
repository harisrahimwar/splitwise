import { useEffect, useReducer } from 'react';
import { seedState } from './seed';
import type { AppState, Expense, Id } from './types';

const STORAGE_KEY = 'cdsplit-state-v1';

export type Action =
  | { type: 'addUser'; name: string }
  | { type: 'addGroup'; name: string; memberIds: Id[] }
  | { type: 'addGroupMember'; groupId: Id; userId: Id }
  | { type: 'addExpense'; expense: Omit<Expense, 'id'> }
  | { type: 'updateExpense'; expense: Expense }
  | { type: 'deleteExpense'; id: Id }
  | { type: 'setCurrentUser'; id: Id }
  | { type: 'reset' };

function newId(prefix: string): Id {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'addUser':
      return { ...state, users: [...state.users, { id: newId('u'), name: action.name }] };
    case 'addGroup':
      return {
        ...state,
        groups: [...state.groups, { id: newId('g'), name: action.name, memberIds: action.memberIds }],
      };
    case 'addGroupMember':
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.groupId && !g.memberIds.includes(action.userId)
            ? { ...g, memberIds: [...g.memberIds, action.userId] }
            : g,
        ),
      };
    case 'addExpense':
      return { ...state, expenses: [...state.expenses, { ...action.expense, id: newId('e') }] };
    case 'updateExpense':
      return {
        ...state,
        expenses: state.expenses.map((e) => (e.id === action.expense.id ? action.expense : e)),
      };
    case 'deleteExpense':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) };
    case 'setCurrentUser':
      return { ...state, currentUserId: action.id };
    case 'reset':
      return seedState();
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // Storage unavailable or corrupted: fall back to demo data.
  }
  return seedState();
}

/** App state, saved to localStorage so it survives a page refresh. */
export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore: the app still works, it just won't remember changes.
    }
  }, [state]);
  return [state, dispatch] as const;
}
