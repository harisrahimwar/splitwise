import { ActionButton, Hero, Icon, ScreenHeader, SectionHeader } from '../components/ui';
import { balanceBetween, isInvolved } from '../money';
import type { ScreenProps } from '../nav';
import { ExpenseFeed } from './Group';

export function FriendScreen({ state, nav, friendId }: ScreenProps & { friendId: string }) {
  const me = state.currentUserId;
  const friend = state.users.find((u) => u.id === friendId);
  if (!friend) return <main className="screen"><ScreenHeader title="Friend not found" onBack={nav.back} /></main>;

  const shared = state.expenses.filter((e) => isInvolved(e, me) && isInvolved(e, friendId));
  const balance = balanceBetween(state.expenses, me, friendId);
  const count = shared.filter((e) => e.kind !== 'payment').length;

  return (
    <main className="screen screen--sticky">
      <ScreenHeader title={friend.name} onBack={nav.back} />

      <Hero
        title={friend.name}
        chips={[
          balance > 0
            ? { text: 'Owes you', tone: 'green' }
            : balance < 0
              ? { text: 'You owe', tone: 'red' }
              : { text: 'All square', tone: 'glass' },
        ]}
        label={balance > 0 ? `${friend.name} owes you` : balance < 0 ? `You owe ${friend.name}` : 'Settled up'}
        amount={balance}
        sub={`${count} shared ${count === 1 ? 'expense' : 'expenses'} · includes groups`}
      />

      <div className="actions-row actions-row--2">
        <ActionButton
          icon="settle"
          label="Settle"
          primary
          disabled={balance === 0}
          onClick={() =>
            nav.push({
              name: 'settle',
              fromId: balance < 0 ? me : friendId,
              toId: balance < 0 ? friendId : me,
              amount: Math.abs(balance),
              groupId: null,
            })
          }
        />
        <ActionButton icon="plus" label="Add" onClick={() => nav.push({ name: 'addExpense', friendId })} />
      </div>

      <SectionHeader title="Shared expenses" />
      <ExpenseFeed state={state} expenses={shared} nav={nav} emptyText="Nothing shared with this friend yet." />

      <div className="sticky-footer">
        <button type="button" className="btn btn--primary" onClick={() => nav.push({ name: 'addExpense', friendId })}>
          <Icon name="plus" /> Add expense
        </button>
      </div>
    </main>
  );
}
