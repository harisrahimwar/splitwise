import { useState } from 'react';
import { Chips, DateDivider, EmptyState, ExpenseRow, ScreenHeader, groupByDate } from '../components/ui';
import { isInvolved } from '../money';
import type { ScreenProps } from '../nav';

type Filter = 'all' | 'expenses' | 'payments';

export function ActivityScreen({ state, nav }: ScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const me = state.currentUserId;
  const mine = state.expenses.filter((e) => isInvolved(e, me));
  const shown = mine.filter((e) => (filter === 'all' ? true : filter === 'payments' ? e.kind === 'payment' : e.kind !== 'payment'));

  return (
    <main className="screen">
      <ScreenHeader title="Activity" />
      <Chips<Filter>
        options={[
          { id: 'all', label: 'All' },
          { id: 'expenses', label: 'Expenses', icon: 'receipt' },
          { id: 'payments', label: 'Payments', icon: 'settle' },
        ]}
        value={filter}
        onChange={setFilter}
      />
      {shown.length === 0 && <EmptyState icon="activity" title="Nothing here yet" text="Expenses and payments you're part of show up here." />}
      {groupByDate(shown, 'day').map((section) => (
        <div key={section.label}>
          <DateDivider label={section.label} />
          <div className="list">
            {section.items.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                users={state.users}
                groups={state.groups}
                me={me}
                showGroup
                onOpen={() => nav.push({ name: 'expense', id: e.id })}
              />
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
