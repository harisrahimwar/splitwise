import { useState } from 'react';
import {
  ActionButton,
  AmountPill,
  Avatar,
  CATEGORIES,
  Chips,
  DateDivider,
  ExpenseRow,
  Icon,
  type IconName,
  Hero,
  ScreenHeader,
  SectionHeader,
  formatDate,
  groupByDate,
} from '../components/ui';
import { formatMoney, netBalances, simplifyDebts } from '../money';
import type { Nav, ScreenProps } from '../nav';
import type { AppState, Expense } from '../types';

/** Expense list with category filter chips and month dividers, used on group and friend pages. */
export function ExpenseFeed({ state, expenses, nav, emptyText }: { state: AppState; expenses: Expense[]; nav: Nav; emptyText: string }) {
  const [filter, setFilter] = useState('all');
  const used = new Set(expenses.map((e) => (e.kind === 'payment' ? 'payment' : (e.category ?? 'other'))));
  const options: { id: string; label: string; icon?: IconName }[] = [
    { id: 'all', label: 'All', icon: 'grid' },
    ...CATEGORIES.filter((c) => used.has(c.id)).map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
    ...(used.has('payment') ? [{ id: 'payment', label: 'Payments', icon: 'settle' as const }] : []),
  ];
  const shown = expenses.filter((e) =>
    filter === 'all' ? true : filter === 'payment' ? e.kind === 'payment' : e.kind !== 'payment' && (e.category ?? 'other') === filter,
  );

  if (expenses.length === 0) return <p className="muted center">{emptyText}</p>;

  return (
    <>
      {options.length > 2 && <Chips options={options} value={filter} onChange={setFilter} />}
      {groupByDate(shown, 'month').map((section) => (
        <div key={section.label}>
          <DateDivider label={section.label} />
          <div className="list">
            {section.items.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                users={state.users}
                groups={state.groups}
                me={state.currentUserId}
                onOpen={() => nav.push({ name: 'expense', id: e.id })}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

type Panel = 'settle' | 'balances' | 'invite' | null;

export function GroupScreen({ state, dispatch, nav, groupId }: ScreenProps & { groupId: string }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [newMemberId, setNewMemberId] = useState('');
  const me = state.currentUserId;
  const nameOf = (id: string) => (id === me ? 'You' : state.users.find((u) => u.id === id)?.name ?? id);
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return <main className="screen"><ScreenHeader title="Group not found" onBack={nav.back} /></main>;

  const expenses = state.expenses.filter((e) => e.groupId === groupId);
  const net = netBalances(expenses);
  const settlements = simplifyDebts(net);
  const myNet = net[me] ?? 0;
  const nonMembers = state.users.filter((u) => !group.memberIds.includes(u.id));
  const firstDate = expenses.map((e) => e.date).sort()[0];
  const togglePanel = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  return (
    <main className="screen screen--sticky">
      <ScreenHeader title={group.name} onBack={nav.back} />

      <Hero
        title={group.name}
        chips={[
          { text: `${group.memberIds.length} members`, tone: 'green' },
          { text: 'Simplified', tone: 'glass', icon: 'refresh' },
        ]}
        label={myNet > 0 ? "You're owed" : myNet < 0 ? 'You owe' : 'You are settled up'}
        amount={myNet}
        sub={`${expenses.length} ${expenses.length === 1 ? 'expense' : 'expenses'}${firstDate ? ` · since ${formatDate(firstDate).replace(/ \d{4}$/, '')}` : ''}`}
      />

      <div className="actions-row actions-row--3">
        <ActionButton icon="settle" label="Settle" primary onClick={() => togglePanel('settle')} />
        <ActionButton icon="scale" label="Balances" onClick={() => togglePanel('balances')} />
        <ActionButton icon="userPlus" label="Invite" onClick={() => togglePanel('invite')} />
      </div>

      {panel === 'settle' && (
        <section className="panel">
          <h3>Suggested payments</h3>
          <p className="panel__hint">
            <Icon name="bills" size={18} /> Debts are simplified: fewer payments, same totals.
          </p>
          {settlements.length === 0 && <p className="muted">Everyone is settled up.</p>}
          {settlements.map((s) => (
            <div key={`${s.fromId}-${s.toId}`} className="panel__row">
              <span>
                <strong>{nameOf(s.fromId)}</strong> {s.fromId === me ? 'pay' : 'pays'} <strong>{nameOf(s.toId)}</strong>
                <br />
                <span className="muted">{formatMoney(s.amount)}</span>
              </span>
              <button
                type="button"
                className="btn btn--small"
                onClick={() => nav.push({ name: 'settle', fromId: s.fromId, toId: s.toId, amount: s.amount, groupId })}
              >
                Settle
              </button>
            </div>
          ))}
        </section>
      )}

      {panel === 'balances' && (
        <section className="panel">
          <h3>Balances</h3>
          {group.memberIds.map((id) => (
            <div key={id} className="panel__row">
              <span className="panel__person">
                <Avatar user={state.users.find((u) => u.id === id)} isMe={id === me} size="sm" />
                <span>
                  <strong>{nameOf(id)}</strong>
                  <br />
                  <span className="muted">{(net[id] ?? 0) > 0 ? 'gets back' : (net[id] ?? 0) < 0 ? 'owes' : 'settled up'}</span>
                </span>
              </span>
              <AmountPill amount={net[id] ?? 0} />
            </div>
          ))}
        </section>
      )}

      {panel === 'invite' && (
        <section className="panel">
          <h3>Invite a member</h3>
          {nonMembers.length === 0 ? (
            <p className="muted">Everyone you know is already in this group. Add friends from Account.</p>
          ) : (
            <div className="inline-form">
              <select value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)}>
                <option value="">Choose a friend…</option>
                {nonMembers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn--small"
                disabled={!newMemberId}
                onClick={() => {
                  dispatch({ type: 'addGroupMember', groupId, userId: newMemberId });
                  setNewMemberId('');
                }}
              >
                Add
              </button>
            </div>
          )}
        </section>
      )}

      <SectionHeader title="Expenses" />
      <ExpenseFeed state={state} expenses={expenses} nav={nav} emptyText="No expenses yet. Add the first one." />

      <div className="sticky-footer">
        <button type="button" className="btn btn--primary" onClick={() => nav.push({ name: 'addExpense', groupId })}>
          <Icon name="plus" /> Add expense
        </button>
      </div>
    </main>
  );
}
