import { useState } from 'react';
import { AmountPill, Avatar, CheckCircle, EmptyState, Icon, type IconName, IconTile, ScreenHeader, groupIcon } from '../components/ui';
import { balanceBetween, formatMoney, localISODate, parseMoney } from '../money';
import type { ScreenProps } from '../nav';

const METHODS: { id: string; label: string; icon: IconName }[] = [
  { id: 'DuitNow', label: 'DuitNow', icon: 'qr' },
  { id: 'e-Wallet', label: 'e-Wallet', icon: 'phone' },
  { id: 'Cash', label: 'Cash', icon: 'cash' },
  { id: 'Other', label: 'Other', icon: 'coins' },
];

type Portion = 'full' | 'half' | 'custom';

export function SettleScreen({
  state,
  dispatch,
  nav,
  fromId,
  toId,
  amount,
  groupId = null,
}: ScreenProps & { fromId?: string; toId?: string; amount?: number; groupId?: string | null }) {
  const me = state.currentUserId;
  const [portion, setPortion] = useState<Portion>('full');
  const [customText, setCustomText] = useState('');
  const [method, setMethod] = useState('DuitNow');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // No one picked yet: list everyone the viewer has an open balance with.
  if (!fromId || !toId || !amount) {
    const open = state.users
      .filter((u) => u.id !== me)
      .map((u) => ({ user: u, amount: balanceBetween(state.expenses, me, u.id) }))
      .filter((b) => b.amount !== 0);
    return (
      <main className="screen">
        <ScreenHeader title="Settle up" onBack={nav.back} />
        {open.length === 0 ? (
          <EmptyState icon="circleCheck" title="All settled up" text="You don't owe anyone, and nobody owes you." />
        ) : (
          <>
            <p className="muted">Who are you settling with?</p>
            <div className="list">
              {open.map((b) => (
                <button
                  key={b.user.id}
                  type="button"
                  className="list-row"
                  onClick={() =>
                    nav.push({
                      name: 'settle',
                      fromId: b.amount < 0 ? me : b.user.id,
                      toId: b.amount < 0 ? b.user.id : me,
                      amount: Math.abs(b.amount),
                      groupId: null,
                    })
                  }
                >
                  <Avatar user={b.user} />
                  <span className="list-row__main">
                    <strong>{b.user.name}</strong>
                    <span>{b.amount > 0 ? 'owes you' : 'you owe'}</span>
                  </span>
                  <AmountPill amount={b.amount} />
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    );
  }

  const nameOf = (id: string) => (id === me ? 'You' : state.users.find((u) => u.id === id)?.name ?? id);
  const group = state.groups.find((g) => g.id === groupId);
  const pay = portion === 'full' ? amount : portion === 'half' ? Math.round(amount / 2) : parseMoney(customText);

  function record() {
    if (pay === null || pay <= 0) return setError('Enter an amount greater than 0.');
    if (pay > amount!) return setError(`That's more than the ${formatMoney(amount!)} owed.`);
    dispatch({
      type: 'addExpense',
      expense: {
        kind: 'payment',
        description: `Paid via ${method}${note.trim() ? ` · ${note.trim()}` : ''}`,
        amount: pay,
        paidById: fromId!,
        groupId,
        shares: { [toId!]: pay },
        date: localISODate(),
      },
    });
    nav.replace({ name: 'settled', fromId: fromId!, toId: toId!, amount: pay, groupId });
  }

  return (
    <main className="screen screen--sticky">
      <ScreenHeader title="Settle up" onBack={nav.back} />

      <section className="settle-card">
        <div className="settle-card__people">
          <Avatar user={state.users.find((u) => u.id === fromId)} isMe={fromId === me} size="xl" />
          <div className="settle-card__middle">
            <p className="big-amount">
              <small>RM</small> {((pay ?? 0) / 100).toFixed(2)}
            </p>
            <span className="settle-card__arrow">
              <Icon name="arrowRight" size={18} />
            </span>
          </div>
          <Avatar user={state.users.find((u) => u.id === toId)} isMe={toId === me} size="xl" />
        </div>
        <p className="settle-card__who">
          <strong>{nameOf(fromId)}</strong> {fromId === me ? 'pay' : 'pays'} <strong>{toId === me ? 'you' : nameOf(toId)}</strong>
        </p>
        <span className="tag tag--blue">
          {group && <Icon name={groupIcon(group)} size={18} />}
          {group ? `${group.name} · ` : 'All shared expenses · '}
          {formatMoney(amount)} owed
        </span>
      </section>

      <div className="chips chips--center">
        {(['full', 'half', 'custom'] as const).map((p) => (
          <button key={p} type="button" className={`chip ${portion === p ? 'chip--active' : ''}`} onClick={() => setPortion(p)}>
            {portion === p && <Icon name="check" size={20} />} {p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      {portion === 'custom' && (
        <label className="field">
          <span className="field__label">Amount (RM)</span>
          <input value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="0.00" inputMode="decimal" autoFocus />
        </label>
      )}

      <h2 className="subheading">Paid via</h2>
      <div className="method-grid">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`method ${method === m.id ? 'method--active' : ''}`}
            onClick={() => setMethod(m.id)}
            aria-pressed={method === m.id}
          >
            <IconTile icon={m.icon} tone={method === m.id ? 'solid' : 'blue'} />
            <CheckCircle checked={method === m.id} />
            <strong>{m.label}</strong>
          </button>
        ))}
      </div>

      <div className="settings">
        <label className="settings__row">
          <Icon name="pencil" />
          <strong className="settings__main">Note</strong>
          <input className="settings__input settings__input--right" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
        </label>
      </div>

      <p className="info-line">
        <Icon name="info" size={20} /> Records a payment made outside the app.
      </p>
      {error && <p className="error">{error}</p>}

      <div className="sticky-footer">
        <button type="button" className="btn btn--primary" onClick={record}>
          Record payment
        </button>
      </div>
    </main>
  );
}

export function SettledScreen({
  state,
  nav,
  fromId,
  toId,
  amount,
  groupId,
}: ScreenProps & { fromId: string; toId: string; amount: number; groupId: string | null }) {
  const me = state.currentUserId;
  const nameOf = (id: string) => (id === me ? 'You' : state.users.find((u) => u.id === id)?.name ?? id);
  const group = state.groups.find((g) => g.id === groupId);

  return (
    <main className="screen screen--center">
      <div className="success">
        <svg className="success__art" viewBox="0 0 200 200" aria-hidden="true">
          <path d="M100 10c3 28 14 39 42 42-28 3-39 14-42 42-3-28-14-39-42-42 28-3 39-14 42-42z" fill="#ffe000" />
          <path d="M44 66c1.5 12 6 16.5 18 18-12 1.5-16.5 6-18 18-1.5-12-6-16.5-18-18 12-1.5 16.5-6 18-18z" fill="#ffe000" />
          <circle cx="150" cy="58" r="12" fill="none" stroke="#ffe000" strokeWidth="9" />
          <rect x="70" y="92" width="18" height="18" rx="2" transform="rotate(45 79 101)" fill="#ffe000" />
          <path d="M44 140l38 30 72-76" fill="none" stroke="#0064dc" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1>Payment recorded</h1>
        <p>
          {nameOf(fromId)} paid {toId === me ? 'you' : nameOf(toId)} {formatMoney(amount)}.{' '}
          {group ? `${group.name} balances are now up to date.` : 'Your balances are now up to date.'}
        </p>
      </div>
      <div className="stack stack--bottom">
        {group && (
          <button type="button" className="btn btn--primary" onClick={() => { nav.tab('groups'); nav.push({ name: 'group', id: group.id }); }}>
            Back to {group.name}
          </button>
        )}
        <button type="button" className={`btn ${group ? 'btn--secondary' : 'btn--primary'}`} onClick={() => nav.tab('home')}>
          Back to Home
        </button>
      </div>
    </main>
  );
}
