import { useState } from 'react';
import { Balance } from './components/Balance';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { balanceBetween, formatMoney, isInvolved, netBalances, simplifyDebts } from './money';
import type { Action } from './store';
import type { AppState, Id } from './types';

interface ViewProps {
  state: AppState;
  dispatch: (action: Action) => void;
}

function useNameOf(state: AppState) {
  return (id: Id) => state.users.find((u) => u.id === id)?.name ?? id;
}

export function DashboardView({ state, dispatch }: ViewProps) {
  const [adding, setAdding] = useState(false);
  const me = state.currentUserId;
  const nameOf = useNameOf(state);

  const balances = state.users
    .filter((u) => u.id !== me)
    .map((u) => ({ user: u, amount: balanceBetween(state.expenses, me, u.id) }));
  const owedToMe = balances.filter((b) => b.amount > 0);
  const iOwe = balances.filter((b) => b.amount < 0);
  const total = balances.reduce((sum, b) => sum + b.amount, 0);

  return (
    <>
      <div className="view-header">
        <h2>Dashboard</h2>
        <button className="primary" onClick={() => setAdding(true)}>
          Add expense
        </button>
      </div>

      {adding && (
        <ExpenseForm
          users={state.users}
          candidateIds={state.users.map((u) => u.id)}
          defaultPayerId={me}
          groupId={null}
          onSave={(expense) => {
            dispatch({ type: 'addExpense', expense });
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="card totals">
        <div>
          Total balance: <Balance amount={total} owedLabel="you are owed" />
        </div>
      </div>

      <div className="columns">
        <div className="card">
          <h3>You owe</h3>
          {iOwe.length === 0 && <p className="muted">Nothing.</p>}
          {iOwe.map((b) => (
            <p key={b.user.id}>
              {b.user.name}: <span className="negative">{formatMoney(b.amount)}</span>
            </p>
          ))}
        </div>
        <div className="card">
          <h3>You are owed</h3>
          {owedToMe.length === 0 && <p className="muted">Nothing.</p>}
          {owedToMe.map((b) => (
            <p key={b.user.id}>
              {b.user.name}: <span className="positive">{formatMoney(b.amount)}</span>
            </p>
          ))}
        </div>
      </div>

      <h3>Your recent expenses ({nameOf(me)})</h3>
      <ExpenseList
        expenses={state.expenses.filter((e) => isInvolved(e, me))}
        users={state.users}
        groups={state.groups}
        currentUserId={me}
        onDelete={(id) => dispatch({ type: 'deleteExpense', id })}
      />
    </>
  );
}

export function FriendView({ state, dispatch, friendId }: ViewProps & { friendId: Id }) {
  const [adding, setAdding] = useState(false);
  const me = state.currentUserId;
  const friend = state.users.find((u) => u.id === friendId);
  if (!friend) return <p>Friend not found.</p>;

  const shared = state.expenses.filter((e) => isInvolved(e, me) && isInvolved(e, friendId));
  const balance = balanceBetween(state.expenses, me, friendId);

  return (
    <>
      <div className="view-header">
        <h2>{friend.name}</h2>
        <button className="primary" onClick={() => setAdding(true)}>
          Add expense
        </button>
      </div>

      <div className="card totals">
        <Balance amount={balance} owesLabel={`you owe ${friend.name}`} owedLabel={`${friend.name} owes you`} />
        <p className="muted small">Includes expenses from groups you share.</p>
      </div>

      {adding && (
        <ExpenseForm
          users={state.users}
          candidateIds={[me, friendId]}
          defaultPayerId={me}
          groupId={null}
          onSave={(expense) => {
            dispatch({ type: 'addExpense', expense });
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      <h3>Shared expenses</h3>
      <ExpenseList
        expenses={shared}
        users={state.users}
        groups={state.groups}
        currentUserId={me}
        onDelete={(id) => dispatch({ type: 'deleteExpense', id })}
      />
    </>
  );
}

export function GroupView({ state, dispatch, groupId }: ViewProps & { groupId: Id }) {
  const [adding, setAdding] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const me = state.currentUserId;
  const nameOf = useNameOf(state);
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return <p>Group not found.</p>;

  const expenses = state.expenses.filter((e) => e.groupId === groupId);
  const net = netBalances(expenses);
  const settlements = simplifyDebts(net);
  const nonMembers = state.users.filter((u) => !group.memberIds.includes(u.id));

  return (
    <>
      <div className="view-header">
        <h2>{group.name}</h2>
        <button className="primary" onClick={() => setAdding(true)}>
          Add expense
        </button>
      </div>

      {adding && (
        <ExpenseForm
          users={state.users}
          candidateIds={group.memberIds}
          defaultPayerId={group.memberIds.includes(me) ? me : group.memberIds[0]}
          groupId={groupId}
          onSave={(expense) => {
            dispatch({ type: 'addExpense', expense });
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="columns">
        <div className="card">
          <h3>Members</h3>
          {group.memberIds.map((id) => (
            <p key={id}>
              {nameOf(id)}: <Balance amount={net[id] ?? 0} owesLabel="owes" owedLabel="gets back" />
            </p>
          ))}
          {nonMembers.length > 0 && (
            <div className="add-member">
              <select value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)}>
                <option value="">Add a member…</option>
                {nonMembers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <button
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
        </div>
        <div className="card">
          <h3>Suggested payments</h3>
          {settlements.length === 0 && <p className="muted">Everyone is settled up.</p>}
          {settlements.map((s) => (
            <p key={`${s.fromId}-${s.toId}`}>
              {nameOf(s.fromId)} pays {nameOf(s.toId)} <strong>{formatMoney(s.amount)}</strong>
            </p>
          ))}
        </div>
      </div>

      <h3>Group expenses</h3>
      <ExpenseList
        expenses={expenses}
        users={state.users}
        groups={state.groups}
        currentUserId={me}
        onDelete={(id) => dispatch({ type: 'deleteExpense', id })}
      />
    </>
  );
}
