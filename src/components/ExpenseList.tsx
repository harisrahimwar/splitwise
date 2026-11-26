import { formatMoney } from '../money';
import type { Expense, Group, Id, User } from '../types';

interface Props {
  expenses: Expense[];
  users: User[];
  groups: Group[];
  currentUserId: Id;
  onDelete: (id: Id) => void;
}

export function ExpenseList({ expenses, users, groups, currentUserId, onDelete }: Props) {
  const nameOf = (id: Id) => users.find((u) => u.id === id)?.name ?? id;

  if (expenses.length === 0) return <p className="muted">No expenses yet.</p>;

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ul className="expense-list">
      {sorted.map((e) => {
        const myShare = e.shares[currentUserId] ?? 0;
        let summary = <span className="muted">not involved</span>;
        if (e.paidById === currentUserId && e.amount - myShare > 0) {
          summary = <span className="positive">you lent {formatMoney(e.amount - myShare)}</span>;
        } else if (e.paidById !== currentUserId && myShare > 0) {
          summary = <span className="negative">you borrowed {formatMoney(myShare)}</span>;
        }
        const group = groups.find((g) => g.id === e.groupId);

        return (
          <li key={e.id} className="card expense">
            <div className="expense-main">
              <strong>{e.description}</strong>
              <span className="muted">
                {e.date} · {nameOf(e.paidById)} paid {formatMoney(e.amount)}
                {group ? ` · ${group.name}` : ''}
              </span>
              <span className="muted small">
                {Object.entries(e.shares)
                  .map(([id, share]) => `${nameOf(id)} ${formatMoney(share)}`)
                  .join(', ')}
              </span>
            </div>
            <div className="expense-side">
              {summary}
              <button className="link" onClick={() => onDelete(e.id)}>
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
