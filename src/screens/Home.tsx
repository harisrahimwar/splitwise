import { useState } from 'react';
import { ActionButton, AmountPill, Avatar, Hero, IconTile, ScreenHeader, SectionHeader, groupIcon } from '../components/ui';
import { balanceBetween, formatMoney, isInvolved, netBalances } from '../money';
import type { ScreenProps } from '../nav';
import type { AppState, Group, Id } from '../types';

export function myNetInGroup(state: AppState, group: Group, me: Id) {
  return netBalances(state.expenses.filter((e) => e.groupId === group.id))[me] ?? 0;
}

export function GroupCard({ state, group, onOpen }: { state: AppState; group: Group; onOpen: () => void }) {
  const net = myNetInGroup(state, group, state.currentUserId);
  return (
    <button type="button" className="group-card" onClick={onOpen}>
      <IconTile icon={groupIcon(group)} tone="yellow" />
      <strong>{group.name}</strong>
      <span className="muted">{group.memberIds.length} members</span>
      <AmountPill amount={net} />
    </button>
  );
}

export function HomeScreen({ state, nav }: ScreenProps) {
  const [outstandingOnly, setOutstandingOnly] = useState(false);
  const me = state.currentUserId;

  const friends = state.users
    .filter((u) => u.id !== me)
    .map((u) => {
      const shared = state.expenses
        .filter((e) => e.kind !== 'payment' && isInvolved(e, me) && isInvolved(e, u.id))
        .sort((a, b) => b.date.localeCompare(a.date));
      return { user: u, amount: balanceBetween(state.expenses, me, u.id), latest: shared[0]?.description };
    });
  const owed = friends.reduce((s, f) => s + Math.max(f.amount, 0), 0);
  const owe = friends.reduce((s, f) => s + Math.max(-f.amount, 0), 0);
  const net = owed - owe;
  const myGroups = state.groups.filter((g) => g.memberIds.includes(me));
  const shownFriends = outstandingOnly ? friends.filter((f) => f.amount !== 0) : friends;

  return (
    <main className="screen">
      <ScreenHeader title="Split" />

      <Hero
        title="Your balance"
        chips={[
          net > 0
            ? { text: "You're owed", tone: 'green' }
            : net < 0
              ? { text: 'You owe', tone: 'red' }
              : { text: 'All settled', tone: 'glass' },
          { text: `${myGroups.length} ${myGroups.length === 1 ? 'group' : 'groups'}`, tone: 'glass', icon: 'refresh' },
        ]}
        label="Net balance"
        amount={net}
        sub={`Owed ${formatMoney(owed)} · Owe ${formatMoney(owe)}`}
      />

      <div className="actions-row">
        <ActionButton icon="plus" label="Add" primary onClick={() => nav.push({ name: 'addExpense' })} />
        <ActionButton icon="settle" label="Settle" onClick={() => nav.push({ name: 'settle' })} />
        <ActionButton icon="users" label="New group" onClick={() => nav.push({ name: 'newGroup' })} />
        <ActionButton icon="userPlus" label="Friend" onClick={() => nav.tab('account')} />
      </div>

      <SectionHeader title="Groups" link={{ label: 'See all', onClick: () => nav.tab('groups') }} />
      {myGroups.length === 0 ? (
        <button type="button" className="list-row list-row--dashed" onClick={() => nav.push({ name: 'newGroup' })}>
          <IconTile icon="plus" />
          <span className="list-row__main">
            <strong>Create a group</strong>
            <span>For a trip, your home or a night out</span>
          </span>
        </button>
      ) : (
        <div className="carousel">
          {myGroups.map((g) => (
            <GroupCard key={g.id} state={state} group={g} onOpen={() => nav.push({ name: 'group', id: g.id })} />
          ))}
        </div>
      )}

      <SectionHeader
        title="Friends"
        link={{ label: outstandingOnly ? 'Show all' : 'Outstanding', onClick: () => setOutstandingOnly((v) => !v) }}
      />
      {shownFriends.length === 0 && <p className="muted center">Nobody owes anything. Nice.</p>}
      <div className="list">
        {shownFriends.map((f) => (
          <button key={f.user.id} type="button" className="list-row" onClick={() => nav.push({ name: 'friend', id: f.user.id })}>
            <Avatar user={f.user} />
            <span className="list-row__main">
              <strong>{f.user.name}</strong>
              <span>{f.latest ?? 'No shared expenses yet'}</span>
            </span>
            <span className="list-row__side list-row__side--pill-first">
              <AmountPill amount={f.amount} />
              <span className="list-row__note">{f.amount > 0 ? 'owes you' : f.amount < 0 ? 'you owe' : 'all square'}</span>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
