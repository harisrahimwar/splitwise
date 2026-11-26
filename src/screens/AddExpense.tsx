import { useState, type FormEvent } from 'react';
import { Avatar, CATEGORIES, CheckCircle, Icon, type IconName, IconTile, ScreenHeader, categoryOf, groupIcon } from '../components/ui';
import { formatMoney, localISODate, parseMoney, splitByWeights, splitEqually } from '../money';
import type { ScreenProps } from '../nav';
import type { Category, Id } from '../types';

type SplitMode = 'equal' | 'exact' | 'percent' | 'shares';

const MODES: { id: SplitMode; label: string; icon: IconName }[] = [
  { id: 'equal', label: 'Equal', icon: 'equal' },
  { id: 'exact', label: 'Exact', icon: 'hash' },
  { id: 'percent', label: '%', icon: 'percent' },
  { id: 'shares', label: 'Shares', icon: 'pie' },
];

function parseWhole(text: string): number | null {
  const t = text.trim();
  return /^\d+$/.test(t) ? parseInt(t, 10) : null;
}

export function AddExpenseScreen({
  state,
  dispatch,
  nav,
  groupId: initialGroupId = null,
  friendId,
  editId,
}: ScreenProps & { groupId?: Id | null; friendId?: Id; editId?: Id }) {
  const me = state.currentUserId;
  const editing = editId ? state.expenses.find((e) => e.id === editId) : undefined;
  const nameOf = (id: Id) => (id === me ? 'You' : state.users.find((u) => u.id === id)?.name ?? id);

  const candidatesFor = (gid: Id | null) => {
    const group = state.groups.find((g) => g.id === gid);
    if (group) return group.memberIds;
    if (friendId && !editing) return [me, friendId];
    return state.users.map((u) => u.id);
  };

  const startGroupId = editing ? editing.groupId : initialGroupId;
  const startCandidates = candidatesFor(startGroupId);
  const startParticipants = editing ? startCandidates.filter((id) => (editing.shares[id] ?? 0) > 0) : startCandidates;
  const startIsEqual =
    !editing ||
    JSON.stringify(splitEqually(editing.amount, startParticipants)) ===
      JSON.stringify(Object.fromEntries(startParticipants.map((id) => [id, editing.shares[id]])));

  const [amountText, setAmountText] = useState(editing ? (editing.amount / 100).toFixed(2) : '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [category, setCategory] = useState<Category>(editing?.category ?? 'food');
  const [date, setDate] = useState(editing?.date ?? localISODate());
  const [groupId, setGroupId] = useState<Id | null>(startGroupId);
  const [paidById, setPaidById] = useState<Id>(editing?.paidById ?? (startCandidates.includes(me) ? me : startCandidates[0]));
  const [participantIds, setParticipantIds] = useState<Id[]>(startParticipants);
  const [mode, setMode] = useState<SplitMode>(startIsEqual ? 'equal' : 'exact');
  const [inputs, setInputs] = useState<Record<Id, string>>(
    startIsEqual ? {} : Object.fromEntries(startParticipants.map((id) => [id, (editing!.shares[id] / 100).toFixed(2)])),
  );
  const [pickingCategory, setPickingCategory] = useState(false);
  const [error, setError] = useState('');

  const candidates = candidatesFor(groupId);
  const participants = candidates.filter((id) => participantIds.includes(id));
  const amount = parseMoney(amountText);

  function changeGroup(gid: Id | null) {
    const next = candidatesFor(gid);
    setGroupId(gid);
    setParticipantIds(next);
    setInputs({});
    if (!next.includes(paidById)) setPaidById(next.includes(me) ? me : next[0]);
  }

  function changeMode(m: SplitMode) {
    setMode(m);
    setInputs(m === 'shares' ? Object.fromEntries(participants.map((id) => [id, '1'])) : {});
  }

  function toggle(id: Id) {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  /** Works out each person's share for the current mode, or explains what's missing. */
  function compute(): { shares: Record<Id, number> | null; status: string; ok: boolean } {
    const total = amount ?? 0;
    if (participants.length === 0) return { shares: null, status: 'Pick at least one person', ok: false };
    if (mode === 'equal') {
      return { shares: splitEqually(total, participants), status: `${formatMoney(total)} split ${participants.length} ways`, ok: total > 0 };
    }
    if (mode === 'exact') {
      const shares: Record<Id, number> = {};
      for (const id of participants) {
        const v = parseMoney(inputs[id] || '0');
        if (v === null) return { shares: null, status: `Check the amount for ${nameOf(id)}`, ok: false };
        shares[id] = v;
      }
      const sum = Object.values(shares).reduce((a, b) => a + b, 0);
      if (sum === total && total > 0) return { shares, status: `${formatMoney(sum)} of ${(total / 100).toFixed(2)} · balanced`, ok: true };
      return {
        shares,
        status: sum < total ? `${formatMoney(total - sum)} left to assign` : `${formatMoney(sum - total)} over the total`,
        ok: false,
      };
    }
    const weights: Record<Id, number> = {};
    for (const id of participants) {
      const v = parseWhole(inputs[id] || '0');
      if (v === null) return { shares: null, status: `Use whole numbers for ${nameOf(id)}`, ok: false };
      weights[id] = v;
    }
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (mode === 'percent') {
      if (sum !== 100) return { shares: splitByWeights(total, weights), status: `${sum}% of 100% assigned`, ok: false };
      return { shares: splitByWeights(total, weights), status: '100% assigned · balanced', ok: total > 0 };
    }
    if (sum === 0) return { shares: null, status: 'Give someone at least 1 share', ok: false };
    return { shares: splitByWeights(total, weights), status: `${sum} ${sum === 1 ? 'share' : 'shares'} in total · balanced`, ok: total > 0 };
  }

  const { shares, status, ok } = compute();

  function save(e: FormEvent) {
    e.preventDefault();
    if (amount === null || amount <= 0) return setError('Enter an amount greater than 0.');
    if (!description.trim()) return setError('Add a description.');
    if (!ok || !shares) return setError(status);
    const clean = Object.fromEntries(Object.entries(shares).filter(([, v]) => v > 0));
    if (!Object.keys(clean).some((id) => id !== paidById)) {
      return setError('Nobody owes anything: the payer is the only person in the split.');
    }
    const expense = { description: description.trim(), amount, paidById, groupId, shares: clean, date, category };
    if (editing) dispatch({ type: 'updateExpense', expense: { ...editing, ...expense } });
    else dispatch({ type: 'addExpense', expense });
    nav.back();
  }

  const cat = categoryOf({ category });
  const payerName = paidById === me ? 'you' : nameOf(paidById);

  return (
    <form className="screen screen--sticky" onSubmit={save}>
      <ScreenHeader title={editing ? 'Edit expense' : 'New expense'} onBack={nav.back} />

      <div className="amount-entry">
        <span className="currency-pill">MYR</span>
        <label className="amount-entry__input">
          <span>RM</span>
          <input
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            aria-label="Amount in RM"
            autoFocus={!editing}
          />
        </label>
      </div>

      <div className="desc-card">
        <button type="button" className="desc-card__icon" onClick={() => setPickingCategory((v) => !v)} aria-label="Choose category">
          <IconTile icon={cat.icon} tone={cat.tone} />
        </button>
        <div className="desc-card__main">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was it for?" aria-label="Description" />
          <span>
            <button type="button" className="inline-link" onClick={() => setPickingCategory((v) => !v)}>
              {cat.label}
            </button>
            {' · '}
            <input className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
          </span>
        </div>
        <Icon name="pencil" />
      </div>

      {pickingCategory && (
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`category ${c.id === category ? 'category--active' : ''}`}
              onClick={() => {
                setCategory(c.id);
                setPickingCategory(false);
              }}
            >
              <IconTile icon={c.icon} tone={c.tone} />
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="picker-row">
        <label className="picker">
          <Avatar user={state.users.find((u) => u.id === paidById)} isMe={paidById === me} size="sm" />
          <span className="picker__text">
            <span>Paid by</span>
            <select value={paidById} onChange={(e) => setPaidById(e.target.value)}>
              {candidates.map((id) => (
                <option key={id} value={id}>
                  {nameOf(id)}
                </option>
              ))}
            </select>
          </span>
          <Icon name="chevronDown" />
        </label>
        <label className="picker">
          {(() => {
            const g = state.groups.find((x) => x.id === groupId);
            return <IconTile icon={g ? groupIcon(g) : 'user'} tone="yellow" />;
          })()}
          <span className="picker__text">
            <span>Split in</span>
            <select value={groupId ?? ''} onChange={(e) => changeGroup(e.target.value || null)}>
              <option value="">{friendId && !editing ? `Just ${nameOf(friendId)}` : 'No group'}</option>
              {state.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </span>
          <Icon name="chevronDown" />
        </label>
      </div>

      <div className="section-header">
        <h2>Split</h2>
      </div>
      <div className="mode-tabs" role="tablist">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={`mode-tab ${mode === m.id ? 'mode-tab--active' : ''}`}
            onClick={() => changeMode(m.id)}
          >
            <Icon name={m.icon} size={28} />
            {m.label}
          </button>
        ))}
      </div>

      <div className="list">
        {candidates.map((id) => {
          const on = participantIds.includes(id);
          const share = on && shares ? shares[id] ?? 0 : 0;
          const sub = !on
            ? 'not in this one'
            : id === paidById
              ? `paid${amount ? ` ${formatMoney(amount)}` : ''}`
              : `owes ${payerName}${mode !== 'equal' && mode !== 'exact' && share ? ` ${formatMoney(share)}` : ''}`;
          return (
            <div key={id} className={`list-row list-row--static split-row ${on ? '' : 'split-row--off'}`}>
              <Avatar user={state.users.find((u) => u.id === id)} isMe={id === me} />
              <span className="list-row__main">
                <strong>{nameOf(id)}</strong>
                <span>{sub}</span>
              </span>
              {mode === 'equal' || !on ? (
                <strong className="row-amount">{formatMoney(share)}</strong>
              ) : (
                <label className="share-input">
                  {mode === 'exact' && <span>RM</span>}
                  <input
                    value={inputs[id] ?? ''}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [id]: e.target.value }))}
                    placeholder={mode === 'exact' ? '0.00' : '0'}
                    inputMode={mode === 'exact' ? 'decimal' : 'numeric'}
                    aria-label={`${nameOf(id)} ${mode === 'exact' ? 'amount' : mode === 'percent' ? 'percent' : 'shares'}`}
                  />
                  {mode === 'percent' && <span>%</span>}
                  {mode === 'shares' && <span>×</span>}
                </label>
              )}
              <button type="button" className="check-btn" onClick={() => toggle(id)} aria-pressed={on} aria-label={`Include ${nameOf(id)}`}>
                <CheckCircle checked={on} />
              </button>
            </div>
          );
        })}
      </div>

      <p className={`banner ${ok ? 'banner--ok' : 'banner--warn'}`}>
        <Icon name={ok ? 'circleCheck' : 'info'} size={22} /> {status}
      </p>
      <p className="hint">Untick the payer if the others owe the full amount.</p>

      {error && <p className="error">{error}</p>}

      <div className="sticky-footer">
        <button type="submit" className="btn btn--primary">
          {editing ? 'Save changes' : 'Save expense'}
        </button>
      </div>
    </form>
  );
}
