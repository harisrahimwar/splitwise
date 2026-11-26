import { Avatar, IconTile, ScreenHeader, categoryOf, formatDate } from '../components/ui';
import { formatMoney, splitEqually } from '../money';
import type { ScreenProps } from '../nav';

export function ExpenseScreen({ state, dispatch, nav, expenseId }: ScreenProps & { expenseId: string }) {
  const me = state.currentUserId;
  const expense = state.expenses.find((e) => e.id === expenseId);
  if (!expense) return <main className="screen"><ScreenHeader title="Expense not found" onBack={nav.back} /></main>;

  const isPayment = expense.kind === 'payment';
  const nameOf = (id: string) => (id === me ? 'You' : state.users.find((u) => u.id === id)?.name ?? id);
  const group = state.groups.find((g) => g.id === expense.groupId);
  const cat = categoryOf(expense);
  const people = Object.keys(expense.shares).filter((id) => expense.shares[id] > 0);
  const equal = JSON.stringify(splitEqually(expense.amount, people)) === JSON.stringify(Object.fromEntries(people.map((id) => [id, expense.shares[id]])));
  const payerName = expense.paidById === me ? 'you' : nameOf(expense.paidById);

  function remove() {
    if (confirm(`Delete "${expense!.description}"? This can't be undone.`)) {
      dispatch({ type: 'deleteExpense', id: expense!.id });
      nav.back();
    }
  }

  return (
    <main className="screen">
      <ScreenHeader title={isPayment ? 'Payment' : 'Expense'} onBack={nav.back} />

      <section className="summary-card">
        <IconTile icon={isPayment ? 'settle' : cat.icon} tone={isPayment ? 'green' : cat.tone} size="lg" />
        <h2>{expense.description}</h2>
        <p className="big-amount">
          <small>RM</small> {(expense.amount / 100).toFixed(2)}
        </p>
        <p className="muted">
          {[isPayment ? 'Payment' : cat.label, formatDate(expense.date), group?.name].filter(Boolean).join(' · ')}
        </p>
        <span className="person-chip">
          <Avatar user={state.users.find((u) => u.id === expense.paidById)} isMe={expense.paidById === me} size="sm" />
          Paid by {nameOf(expense.paidById)}
        </span>
      </section>

      <h2 className="subheading">
        {isPayment ? 'Paid to' : `Split ${equal ? 'equally' : 'by amount'} · ${people.length}`}
      </h2>
      <div className="list">
        {people.map((id) => (
          <div key={id} className="list-row list-row--static">
            <Avatar user={state.users.find((u) => u.id === id)} isMe={id === me} />
            <span className="list-row__main">
              <strong>{nameOf(id)}</strong>
              <span>
                {isPayment
                  ? 'received'
                  : id === expense.paidById
                    ? id === me ? 'your share' : 'their share'
                    : `owes ${payerName}`}
              </span>
            </span>
            <strong className="row-amount">{formatMoney(expense.shares[id])}</strong>
          </div>
        ))}
      </div>

      <div className="stack">
        {!isPayment && (
          <button type="button" className="btn btn--primary" onClick={() => nav.push({ name: 'addExpense', editId: expense.id })}>
            Edit expense
          </button>
        )}
        <button type="button" className="btn btn--secondary" onClick={remove}>
          Delete {isPayment ? 'payment' : 'expense'}
        </button>
      </div>
    </main>
  );
}
