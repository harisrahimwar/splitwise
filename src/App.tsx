import { useState, type FormEvent } from 'react';
import { balanceBetween, formatMoney } from './money';
import { useAppState } from './store';
import type { Id } from './types';
import { DashboardView, FriendView, GroupView } from './views';

type View = { kind: 'dashboard' } | { kind: 'friend'; id: Id } | { kind: 'group'; id: Id };

export default function App() {
  const [state, dispatch] = useAppState();
  const [view, setView] = useState<View>({ kind: 'dashboard' });
  const [friendName, setFriendName] = useState('');
  const [friendError, setFriendError] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<Id[]>([]);
  const [groupError, setGroupError] = useState('');

  const me = state.currentUserId;
  const friends = state.users.filter((u) => u.id !== me);

  function addFriend(e: FormEvent) {
    e.preventDefault();
    const name = friendName.trim();
    if (!name) return;
    if (state.users.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      return setFriendError(`${name} is already on the list.`);
    }
    dispatch({ type: 'addUser', name });
    setFriendName('');
    setFriendError('');
  }

  function startGroup() {
    setCreatingGroup(true);
    setGroupName('');
    setGroupMembers([me]);
    setGroupError('');
  }

  function createGroup(e: FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) return setGroupError('Give the group a name.');
    if (groupMembers.length < 2) return setGroupError('Pick at least 2 members.');
    dispatch({ type: 'addGroup', name: groupName.trim(), memberIds: groupMembers });
    setCreatingGroup(false);
  }

  function toggleMember(id: Id) {
    setGroupMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  const isActive = (v: View) => v.kind === view.kind && ('id' in v ? 'id' in view && v.id === view.id : true);

  return (
    <div className="app">
      <header className="topbar">
        <h1>CDSplit</h1>
        <div className="topbar-right">
          <label>
            Viewing as{' '}
            <select
              value={me}
              onChange={(e) => {
                dispatch({ type: 'setCurrentUser', id: e.target.value });
                setView({ kind: 'dashboard' });
              }}
            >
              {state.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              if (confirm('Reset all data back to the demo data?')) {
                dispatch({ type: 'reset' });
                setView({ kind: 'dashboard' });
              }
            }}
          >
            Reset demo data
          </button>
        </div>
      </header>

      <div className="layout">
        <nav className="sidebar">
          <button
            className={`nav-item ${isActive({ kind: 'dashboard' }) ? 'active' : ''}`}
            onClick={() => setView({ kind: 'dashboard' })}
          >
            Dashboard
          </button>

          <h4>Groups</h4>
          {state.groups.map((g) => (
            <button
              key={g.id}
              className={`nav-item ${isActive({ kind: 'group', id: g.id }) ? 'active' : ''}`}
              onClick={() => setView({ kind: 'group', id: g.id })}
            >
              {g.name} <span className="muted small">({g.memberIds.length})</span>
            </button>
          ))}
          {!creatingGroup && (
            <button className="link" onClick={startGroup}>
              + New group
            </button>
          )}
          {creatingGroup && (
            <form className="card mini-form" onSubmit={createGroup}>
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" autoFocus />
              {state.users.map((u) => (
                <label key={u.id} className="inline">
                  <input type="checkbox" checked={groupMembers.includes(u.id)} onChange={() => toggleMember(u.id)} />{' '}
                  {u.name}
                </label>
              ))}
              {groupError && <p className="error">{groupError}</p>}
              <div className="actions">
                <button type="submit" className="primary">
                  Create
                </button>
                <button type="button" onClick={() => setCreatingGroup(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <h4>Friends</h4>
          {friends.map((f) => {
            const balance = balanceBetween(state.expenses, me, f.id);
            return (
              <button
                key={f.id}
                className={`nav-item ${isActive({ kind: 'friend', id: f.id }) ? 'active' : ''}`}
                onClick={() => setView({ kind: 'friend', id: f.id })}
              >
                {f.name}
                {balance !== 0 && (
                  <span className={`small ${balance > 0 ? 'positive' : 'negative'}`}> {formatMoney(balance)}</span>
                )}
              </button>
            );
          })}
          <form className="mini-form" onSubmit={addFriend}>
            <input value={friendName} onChange={(e) => setFriendName(e.target.value)} placeholder="Friend's name" />
            <button type="submit">Add friend</button>
            {friendError && <p className="error">{friendError}</p>}
          </form>
        </nav>

        <main className="content">
          {view.kind === 'dashboard' && <DashboardView state={state} dispatch={dispatch} />}
          {view.kind === 'friend' && <FriendView key={view.id} state={state} dispatch={dispatch} friendId={view.id} />}
          {view.kind === 'group' && <GroupView key={view.id} state={state} dispatch={dispatch} groupId={view.id} />}
        </main>
      </div>
    </div>
  );
}
