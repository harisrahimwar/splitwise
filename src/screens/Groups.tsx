import { useState, type FormEvent } from 'react';
import { Avatar, CheckCircle, EmptyState, Icon, ScreenHeader } from '../components/ui';
import type { ScreenProps } from '../nav';
import type { Id } from '../types';
import { GroupCard } from './Home';

export function GroupsScreen({ state, nav }: ScreenProps) {
  const myGroups = state.groups.filter((g) => g.memberIds.includes(state.currentUserId));

  if (myGroups.length === 0) {
    return (
      <main className="screen">
        <ScreenHeader title="Groups" />
        <EmptyState
          icon="users"
          title="No groups yet"
          text="Create a group for a trip, your home or a night out, then add expenses as you go."
          action={{ label: 'Create a group', onClick: () => nav.push({ name: 'newGroup' }) }}
        />
      </main>
    );
  }

  return (
    <main className="screen">
      <ScreenHeader title="Groups" />
      <div className="group-grid">
        {myGroups.map((g) => (
          <GroupCard key={g.id} state={state} group={g} onOpen={() => nav.push({ name: 'group', id: g.id })} />
        ))}
      </div>
      <button type="button" className="btn btn--secondary" onClick={() => nav.push({ name: 'newGroup' })}>
        <Icon name="plus" /> Create a group
      </button>
    </main>
  );
}

export function NewGroupScreen({ state, dispatch, nav }: ScreenProps) {
  const me = state.currentUserId;
  const [name, setName] = useState('');
  const [members, setMembers] = useState<Id[]>([me]);
  const [error, setError] = useState('');

  function toggle(id: Id) {
    setMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Give the group a name.');
    if (members.length < 2) return setError('Pick at least 2 members.');
    dispatch({ type: 'addGroup', name: name.trim(), memberIds: members });
    nav.back();
  }

  return (
    <form className="screen screen--sticky" onSubmit={create}>
      <ScreenHeader title="New group" onBack={nav.back} />
      <label className="field">
        <span className="field__label">Group name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bali Trip" autoFocus />
      </label>

      <h2 className="subheading">Members</h2>
      <div className="list">
        {state.users.map((u) => (
          <button key={u.id} type="button" className="list-row" onClick={() => toggle(u.id)} aria-pressed={members.includes(u.id)}>
            <Avatar user={u} isMe={u.id === me} />
            <span className="list-row__main">
              <strong>{u.id === me ? 'You' : u.name}</strong>
            </span>
            <CheckCircle checked={members.includes(u.id)} />
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      <div className="sticky-footer">
        <button type="submit" className="btn btn--primary">
          Create group
        </button>
      </div>
    </form>
  );
}
