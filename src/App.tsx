import { useEffect, useState } from 'react';
import { Icon, type IconName } from './components/ui';
import type { Nav, Screen, TabName } from './nav';
import { AccountScreen } from './screens/Account';
import { ActivityScreen } from './screens/Activity';
import { AddExpenseScreen } from './screens/AddExpense';
import { ExpenseScreen } from './screens/ExpenseDetail';
import { FriendScreen } from './screens/Friend';
import { GroupScreen } from './screens/Group';
import { GroupsScreen, NewGroupScreen } from './screens/Groups';
import { HomeScreen } from './screens/Home';
import { SettledScreen, SettleScreen } from './screens/Settle';
import { useAppState } from './store';

const TABS: { name: TabName | 'add'; label: string; icon: IconName }[] = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'groups', label: 'Groups', icon: 'users' },
  { name: 'add', label: 'Add', icon: 'plus' },
  { name: 'activity', label: 'Activity', icon: 'activity' },
  { name: 'account', label: 'Account', icon: 'user' },
];

export default function App() {
  const [state, dispatch] = useAppState();
  // A simple screen stack: the first entry is always a tab, later entries are pushed screens.
  const [stack, setStack] = useState<Screen[]>([{ name: 'home' }]);
  const screen = stack[stack.length - 1];

  const nav: Nav = {
    push: (s) => setStack((prev) => [...prev, s]),
    replace: (s) => setStack((prev) => [...prev.slice(0, -1), s]),
    back: () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev)),
    tab: (name) => setStack([{ name }]),
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stack.length, screen.name]);

  const props = { state, dispatch, nav };
  const isTab = stack.length === 1;

  return (
    <div className={`app ${isTab ? 'app--tabs' : ''}`}>
      {screen.name === 'home' && <HomeScreen {...props} />}
      {screen.name === 'groups' && <GroupsScreen {...props} />}
      {screen.name === 'activity' && <ActivityScreen {...props} />}
      {screen.name === 'account' && <AccountScreen {...props} />}
      {screen.name === 'group' && <GroupScreen key={screen.id} {...props} groupId={screen.id} />}
      {screen.name === 'friend' && <FriendScreen key={screen.id} {...props} friendId={screen.id} />}
      {screen.name === 'newGroup' && <NewGroupScreen {...props} />}
      {screen.name === 'addExpense' && <AddExpenseScreen {...props} {...screen} />}
      {screen.name === 'expense' && <ExpenseScreen key={screen.id} {...props} expenseId={screen.id} />}
      {screen.name === 'settle' && <SettleScreen key={`${screen.fromId}-${screen.toId}`} {...props} {...screen} />}
      {screen.name === 'settled' && <SettledScreen {...props} {...screen} />}

      {isTab && (
        <nav className="tabbar" aria-label="Main">
          {TABS.map((t) => {
            const active = t.name === screen.name;
            return (
              <button
                key={t.name}
                type="button"
                className={`tabbar__item ${active ? 'tabbar__item--active' : ''} ${t.name === 'add' ? 'tabbar__item--add' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => (t.name === 'add' ? nav.push({ name: 'addExpense' }) : nav.tab(t.name))}
              >
                <span className="tabbar__icon">
                  <Icon name={t.icon} size={28} />
                </span>
                {t.label}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
