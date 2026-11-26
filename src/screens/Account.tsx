import { useState, type FormEvent } from 'react';
import { AmountPill, Avatar, Icon, IconTile, ScreenHeader } from '../components/ui';
import { balanceBetween } from '../money';
import type { ScreenProps } from '../nav';
import type { AppState } from '../types';

function exportCsv(state: AppState) {
  const nameOf = (id: string) => state.users.find((u) => u.id === id)?.name ?? id;
  const groupOf = (id: string | null) => state.groups.find((g) => g.id === id)?.name ?? '';
  const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [
    ['Date', 'Description', 'Type', 'Category', 'Group', 'Paid by', 'Amount (RM)', 'Split'],
    ...[...state.expenses]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => [
        e.date,
        e.description,
        e.kind === 'payment' ? 'Payment' : 'Expense',
        e.category ?? '',
        groupOf(e.groupId),
        nameOf(e.paidById),
        (e.amount / 100).toFixed(2),
        Object.entries(e.shares)
          .map(([id, s]) => `${nameOf(id)} ${(s / 100).toFixed(2)}`)
          .join('; '),
      ]),
  ];
  const blob = new Blob([rows.map((r) => r.map(quote).join(',')).join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cdsplit-expenses.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function AccountScreen({ state, dispatch, nav }: ScreenProps) {
  const [friendName, setFriendName] = useState('');
  const [error, setError] = useState('');
  const me = state.users.find((u) => u.id === state.currentUserId);
  const friends = state.users.filter((u) => u.id !== state.currentUserId);

  function addFriend(e: FormEvent) {
    e.preventDefault();
    const name = friendName.trim();
    if (!name) return;
    if (state.users.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      return setError(`${name} is already on the list.`);
    }
    dispatch({ type: 'addUser', name });
    setFriendName('');
    setError('');
  }

  return (
    <main className="screen">
      <ScreenHeader title="Account" />

      <section className="profile-card">
        <Avatar user={me} isMe size="xl" />
        <div>
          <h2>{me?.name}</h2>
          <span className="tag">Demo profile · no login yet</span>
        </div>
      </section>

      <h3 className="overline">Preferences</h3>
      <div className="settings">
        <label className="settings__row">
          <IconTile icon="user" />
          <span className="settings__main">
            <strong>Viewing as</strong>
            <span>Switch whose balances you see</span>
          </span>
          <select
            className="settings__select"
            value={state.currentUserId}
            onChange={(e) => dispatch({ type: 'setCurrentUser', id: e.target.value })}
          >
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <div className="settings__row">
          <IconTile icon="coins" />
          <span className="settings__main">
            <strong>Currency</strong>
          </span>
          <span className="settings__value">MYR</span>
        </div>
      </div>

      <h3 className="overline">Friends</h3>
      <div className="settings">
        {friends.map((f) => (
          <button key={f.id} type="button" className="settings__row" onClick={() => nav.push({ name: 'friend', id: f.id })}>
            <Avatar user={f} />
            <span className="settings__main">
              <strong>{f.name}</strong>
            </span>
            <AmountPill amount={balanceBetween(state.expenses, state.currentUserId, f.id)} />
          </button>
        ))}
        <form className="settings__row" onSubmit={addFriend}>
          <IconTile icon="userPlus" />
          <input
            className="settings__input"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="Add a friend by name"
            aria-label="Friend's name"
          />
          <button type="submit" className="btn btn--small" disabled={!friendName.trim()}>
            Add
          </button>
        </form>
      </div>
      {error && <p className="error">{error}</p>}

      <h3 className="overline">Your data</h3>
      <div className="settings">
        <button type="button" className="settings__row" onClick={() => exportCsv(state)}>
          <IconTile icon="download" />
          <span className="settings__main">
            <strong>Export expenses</strong>
            <span>CSV of all groups</span>
          </span>
          <Icon name="chevronRight" />
        </button>
        <button
          type="button"
          className="settings__row"
          onClick={() => {
            if (confirm('Reset all data back to the demo data?')) dispatch({ type: 'reset' });
          }}
        >
          <IconTile icon="reset" />
          <span className="settings__main">
            <strong>Reset demo data</strong>
            <span>Puts the sample friends and expenses back</span>
          </span>
          <Icon name="chevronRight" />
        </button>
      </div>
    </main>
  );
}
