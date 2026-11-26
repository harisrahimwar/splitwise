import { splitEqually } from './money';
import type { AppState } from './types';

/** Demo data for the PoC: five users, two groups and a few expenses. */
export function seedState(): AppState {
  const users = [
    { id: 'akmal', name: 'Akmal' },
    { id: 'syahmi', name: 'Syahmi' },
    { id: 'hakimi', name: 'Hakimi' },
    { id: 'sarah', name: 'Sarah' },
    { id: 'aina', name: 'Aina' },
  ];
  const everyone = users.map((u) => u.id);

  return {
    currentUserId: 'akmal',
    users,
    groups: [
      { id: 'g-langkawi', name: 'Langkawi Trip', memberIds: everyone },
      { id: 'g-home', name: 'Apartment 4B', memberIds: ['akmal', 'hakimi', 'aina'] },
    ],
    expenses: [
      {
        id: 'e-hotel',
        description: 'Hotel',
        amount: 100000,
        paidById: 'akmal',
        groupId: 'g-langkawi',
        shares: splitEqually(100000, everyone),
        date: '2026-11-20',
        category: 'stay',
      },
      {
        id: 'e-dinner',
        description: 'Seafood dinner',
        amount: 15000,
        paidById: 'sarah',
        groupId: 'g-langkawi',
        shares: splitEqually(15000, ['akmal', 'sarah', 'aina']),
        date: '2026-11-21',
        category: 'food',
      },
      {
        id: 'e-movie',
        description: 'Movie tickets',
        amount: 4000,
        paidById: 'syahmi',
        groupId: null,
        shares: splitEqually(4000, ['akmal', 'syahmi']),
        date: '2026-11-23',
        category: 'fun',
      },
      {
        id: 'e-electric',
        description: 'Electricity bill',
        amount: 19650,
        paidById: 'hakimi',
        groupId: 'g-home',
        shares: splitEqually(19650, ['akmal', 'hakimi', 'aina']),
        date: '2026-11-24',
        category: 'bills',
      },
    ],
  };
}
