import { splitEqually } from './money';
import type { AppState } from './types';

/** Demo data for the PoC: five users, one group and a few expenses. */
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
    groups: [{ id: 'g-langkawi', name: 'Langkawi Trip', memberIds: everyone }],
    expenses: [
      {
        id: 'e-hotel',
        description: 'Hotel',
        amount: 100000,
        paidById: 'akmal',
        groupId: 'g-langkawi',
        shares: splitEqually(100000, everyone),
        date: '2026-11-20',
      },
      {
        id: 'e-dinner',
        description: 'Seafood dinner',
        amount: 15000,
        paidById: 'sarah',
        groupId: 'g-langkawi',
        shares: splitEqually(15000, ['akmal', 'sarah', 'aina']),
        date: '2026-11-21',
      },
      {
        id: 'e-movie',
        description: 'Movie tickets',
        amount: 4000,
        paidById: 'syahmi',
        groupId: null,
        shares: splitEqually(4000, ['akmal', 'syahmi']),
        date: '2026-11-23',
      },
    ],
  };
}
