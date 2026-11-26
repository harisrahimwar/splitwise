import type { Action } from './store';
import type { AppState, Id } from './types';

export type TabName = 'home' | 'groups' | 'activity' | 'account';

export type Screen =
  | { name: TabName }
  | { name: 'group'; id: Id }
  | { name: 'friend'; id: Id }
  | { name: 'newGroup' }
  | { name: 'addExpense'; groupId?: Id | null; friendId?: Id; editId?: Id }
  | { name: 'expense'; id: Id }
  /** Without from/to it shows a list of people to settle with. */
  | { name: 'settle'; fromId?: Id; toId?: Id; amount?: number; groupId?: Id | null }
  | { name: 'settled'; fromId: Id; toId: Id; amount: number; groupId: Id | null };

export interface Nav {
  push: (screen: Screen) => void;
  /** Swaps the current screen, so Back skips it (used after saving a form). */
  replace: (screen: Screen) => void;
  back: () => void;
  tab: (name: TabName) => void;
}

export interface ScreenProps {
  state: AppState;
  dispatch: (action: Action) => void;
  nav: Nav;
}
