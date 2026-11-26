import { useState, type FormEvent } from 'react';
import { formatMoney, parseMoney, splitEqually } from '../money';
import type { Expense, Id, User } from '../types';

interface Props {
  users: User[];
  /** People who can pay or take part in this expense. */
  candidateIds: Id[];
  defaultPayerId: Id;
  groupId: Id | null;
  onSave: (expense: Omit<Expense, 'id'>) => void;
  onCancel: () => void;
}

type SplitMode = 'equal' | 'exact';

export function ExpenseForm({ users, candidateIds, defaultPayerId, groupId, onSave, onCancel }: Props) {
  const nameOf = (id: Id) => users.find((u) => u.id === id)?.name ?? id;

  const [description, setDescription] = useState('');
  const [amountText, setAmountText] = useState('');
  const [paidById, setPaidById] = useState(defaultPayerId);
  const [participantIds, setParticipantIds] = useState<Id[]>(candidateIds);
  const [mode, setMode] = useState<SplitMode>('equal');
  const [exactText, setExactText] = useState<Record<Id, string>>({});
  const [error, setError] = useState('');

  const amount = parseMoney(amountText);
  // Keep the people in the same order as the candidate list.
  const participants = candidateIds.filter((id) => participantIds.includes(id));

  function toggleParticipant(id: Id) {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return setError('Add a description.');
    if (amount === null || amount <= 0) return setError('Enter an amount greater than 0.');
    if (participants.length === 0) return setError('Pick at least one person to split with.');

    let shares: Record<Id, number>;
    if (mode === 'equal') {
      shares = splitEqually(amount, participants);
    } else {
      shares = {};
      for (const id of participants) {
        const share = parseMoney(exactText[id] ?? '');
        if (share === null) return setError(`Enter a valid amount for ${nameOf(id)}.`);
        if (share > 0) shares[id] = share;
      }
      const sum = Object.values(shares).reduce((a, b) => a + b, 0);
      if (sum !== amount) {
        return setError(`The amounts add up to ${formatMoney(sum)}, but the total is ${formatMoney(amount)}.`);
      }
    }

    const owedByOthers = Object.entries(shares).some(([id, share]) => id !== paidById && share > 0);
    if (!owedByOthers) return setError('Nobody owes anything: the payer is the only person in the split.');

    onSave({
      description: description.trim(),
      amount,
      paidById,
      groupId,
      shares,
      date: new Date().toISOString().slice(0, 10),
    });
  }

  const exactSum = participants.reduce((sum, id) => sum + (parseMoney(exactText[id] ?? '') ?? 0), 0);

  return (
    <form className="card expense-form" onSubmit={handleSubmit}>
      <h3>Add an expense</h3>

      <label>
        Description
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Dinner" autoFocus />
      </label>

      <label>
        Amount (RM)
        <input value={amountText} onChange={(e) => setAmountText(e.target.value)} placeholder="0.00" inputMode="decimal" />
      </label>

      <label>
        Paid by
        <select value={paidById} onChange={(e) => setPaidById(e.target.value)}>
          {candidateIds.map((id) => (
            <option key={id} value={id}>
              {nameOf(id)}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend>Split</legend>
        <label className="inline">
          <input type="radio" checked={mode === 'equal'} onChange={() => setMode('equal')} /> Equally
        </label>
        <label className="inline">
          <input type="radio" checked={mode === 'exact'} onChange={() => setMode('exact')} /> By exact amounts
        </label>
      </fieldset>

      <fieldset>
        <legend>Between</legend>
        {candidateIds.map((id) => (
          <div key={id} className="split-row">
            <label className="inline">
              <input type="checkbox" checked={participantIds.includes(id)} onChange={() => toggleParticipant(id)} />{' '}
              {nameOf(id)}
            </label>
            {mode === 'exact' && participantIds.includes(id) && (
              <input
                className="share-input"
                value={exactText[id] ?? ''}
                onChange={(e) => setExactText((prev) => ({ ...prev, [id]: e.target.value }))}
                placeholder="0.00"
                inputMode="decimal"
              />
            )}
          </div>
        ))}
        <p className="hint">
          {mode === 'equal' && amount && participants.length > 0
            ? `About ${formatMoney(Math.floor(amount / participants.length))} each. `
            : ''}
          {mode === 'exact' && `Entered ${formatMoney(exactSum)} of ${formatMoney(amount ?? 0)}. `}
          Untick the payer if the others owe the full amount.
        </p>
      </fieldset>

      {error && <p className="error">{error}</p>}

      <div className="actions">
        <button type="submit" className="primary">
          Save
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
