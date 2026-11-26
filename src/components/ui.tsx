import type { ReactNode } from 'react';
import { formatMoney, formatSigned, localISODate } from '../money';
import type { Category, Expense, Group, Id, User } from '../types';

/* ------------------------------------------------------------------ */
/* Icons: 24px line icons matching the design prototype's icon set.   */
/* ------------------------------------------------------------------ */

const ICONS = {
  back: <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>,
  plus: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  settle: <><path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" /></>,
  home: <><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  user: <><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></>,
  userPlus: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6" /><path d="M22 11h-6" /></>,
  scale: <><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></>,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowIn: <><path d="M17 7 7 17" /><path d="M17 17H7V7" /></>,
  arrowOut: <><path d="M7 7h10v10" /><path d="M7 17 17 7" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  circleCheck: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>,
  pencil: <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />,
  trash: <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>,
  reset: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>,
  grid: <><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></>,
  equal: <><path d="M5 9h14" /><path d="M5 15h14" /></>,
  hash: <><path d="M4 9h16" /><path d="M4 15h16" /><path d="M10 3 8 21" /><path d="M16 3l-2 18" /></>,
  percent: <><path d="M19 5 5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></>,
  pie: <><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z" /><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /></>,
  palm: <><path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4" /><path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3" /><path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35" /><path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14" /></>,
  food: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></>,
  stay: <><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></>,
  transport: <><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></>,
  fun: <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" /></>,
  shopping: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
  bills: <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />,
  receipt: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" /></>,
  qr: <><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></>,
  phone: <><rect width="14" height="20" x="5" y="2" rx="2" /><path d="M12 18h.01" /></>,
  cash: <><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></>,
  coins: <><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" /></>,
  calendar: <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></>,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 24, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={`icon ${className ?? ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const CATEGORIES: { id: Category; label: string; icon: IconName; tone: 'yellow' | 'blue' }[] = [
  { id: 'food', label: 'Food', icon: 'food', tone: 'yellow' },
  { id: 'stay', label: 'Stay', icon: 'stay', tone: 'blue' },
  { id: 'transport', label: 'Transport', icon: 'transport', tone: 'blue' },
  { id: 'fun', label: 'Fun', icon: 'fun', tone: 'blue' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping', tone: 'blue' },
  { id: 'bills', label: 'Bills', icon: 'bills', tone: 'yellow' },
  { id: 'other', label: 'Other', icon: 'receipt', tone: 'blue' },
];

export function categoryOf(expense: Pick<Expense, 'category' | 'kind'>) {
  return CATEGORIES.find((c) => c.id === (expense.category ?? 'other'))!;
}

export function groupIcon(group: Group): IconName {
  if (/trip|holiday|travel|bali|langkawi|penang|tour/i.test(group.name)) return 'palm';
  if (/apartment|house|home|rent|condo|room/i.test(group.name)) return 'home';
  return 'users';
}

/** A rounded square with an icon in it, as used for groups, categories and settings rows. */
export function IconTile({ icon, tone = 'blue', size = 'md' }: { icon: IconName; tone?: 'yellow' | 'blue' | 'green' | 'gray' | 'solid'; size?: 'md' | 'lg' }) {
  return (
    <span className={`icon-tile icon-tile--${tone} icon-tile--${size}`}>
      <Icon name={icon} size={size === 'lg' ? 32 : 24} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Avatar({ user, isMe, size = 'md' }: { user: User | undefined; isMe?: boolean; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return (
    <span className={`avatar avatar--${size} ${isMe ? 'avatar--me' : ''}`} aria-hidden="true">
      {initials(user?.name ?? '?')}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Money pills                                                         */
/* ------------------------------------------------------------------ */

/** Balance from the viewer's side: positive = owed to them (green), negative = they owe (red). */
export function AmountPill({ amount, settledLabel = 'Settled' }: { amount: number; settledLabel?: string }) {
  if (amount === 0) {
    return (
      <span className="pill pill--zero">
        <Icon name="check" size={16} /> {settledLabel}
      </span>
    );
  }
  return (
    <span className={`pill ${amount > 0 ? 'pill--pos' : 'pill--neg'}`}>
      <Icon name={amount > 0 ? 'arrowIn' : 'arrowOut'} size={16} /> {formatSigned(amount)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Layout pieces                                                       */
/* ------------------------------------------------------------------ */

export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className={`screen-header ${onBack ? '' : 'screen-header--tab'}`}>
      {(onBack || right) && (
        <div className="screen-header__bar">
          {onBack ? (
            <button className="round-btn" type="button" onClick={onBack} aria-label="Back">
              <Icon name="back" />
            </button>
          ) : (
            <span />
          )}
          {right}
        </div>
      )}
      <h1>{title}</h1>
    </header>
  );
}

export function Hero({ title, chips, label, amount, sub }: {
  title: string;
  chips: { text: string; tone: 'green' | 'red' | 'glass'; icon?: IconName }[];
  label: string;
  amount: number;
  sub: string;
}) {
  return (
    <section className="hero">
      <h2 className="hero__title">{title}</h2>
      <div className="hero__chips">
        {chips.map((c) => (
          <span key={c.text} className={`hero-chip hero-chip--${c.tone}`}>
            {c.icon && <Icon name={c.icon} size={16} />} {c.text}
          </span>
        ))}
      </div>
      <p className="hero__label">{label}</p>
      <p className="hero__amount">{formatSigned(amount)}</p>
      <p className="hero__sub">{sub}</p>
    </section>
  );
}

export function ActionButton({ icon, label, primary, onClick, disabled }: {
  icon: IconName;
  label: string;
  primary?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={`action ${primary ? 'action--primary' : ''}`} onClick={onClick} disabled={disabled}>
      <span className="action__circle">
        <Icon name={icon} size={28} />
      </span>
      <span className="action__label">{label}</span>
    </button>
  );
}

export function SectionHeader({ title, link }: { title: string; link?: { label: string; onClick: () => void } }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {link && (
        <button type="button" className="text-link" onClick={link.onClick}>
          {link.label} <Icon name="chevronRight" size={20} />
        </button>
      )}
    </div>
  );
}

export function DateDivider({ label }: { label: string }) {
  return (
    <div className="date-divider">
      <span>{label}</span>
    </div>
  );
}

export function Chips<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="chips" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={o.id === value}
          className={`chip ${o.id === value ? 'chip--active' : ''}`}
          onClick={() => onChange(o.id)}
        >
          {o.icon && <Icon name={o.icon} size={20} />} {o.label}
        </button>
      ))}
    </div>
  );
}

export function CheckCircle({ checked }: { checked: boolean }) {
  return <span className={`check-circle ${checked ? 'check-circle--on' : ''}`}>{checked && <Icon name="check" size={18} />}</span>;
}

export function EmptyState({ icon, title, text, action }: {
  icon: IconName;
  title: string;
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="empty">
      <div className="empty__art">
        <svg className="empty__sparkle" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" fill="#ffe000" />
        </svg>
        <span className="empty__ring" />
        <Icon name={icon} size={64} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      {action && (
        <button type="button" className="btn btn--primary btn--inline" onClick={action.onClick}>
          <Icon name="plus" /> {action.label}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Expense row                                                         */
/* ------------------------------------------------------------------ */

/** How an expense changed the viewer's balance: positive = they are owed more. */
export function effectOn(expense: Expense, me: Id): number {
  const myShare = expense.shares[me] ?? 0;
  if (expense.paidById === me) return expense.amount - myShare;
  return -myShare;
}

export function ExpenseRow({ expense, users, groups, me, showGroup, onOpen }: {
  expense: Expense;
  users: User[];
  groups: Group[];
  me: Id;
  showGroup?: boolean;
  onOpen: () => void;
}) {
  const nameOf = (id: Id) => (id === me ? 'You' : users.find((u) => u.id === id)?.name ?? id);
  const group = groups.find((g) => g.id === expense.groupId);
  const effect = effectOn(expense, me);
  const groupSuffix = showGroup && group ? ` · ${group.name}` : '';

  if (expense.kind === 'payment') {
    const toId = Object.keys(expense.shares)[0];
    const label = expense.paidById === me ? 'you paid' : toId === me ? 'you received' : '';
    const title = `${nameOf(expense.paidById)} paid ${toId === me ? 'you' : nameOf(toId)}`;
    return (
      <button type="button" className="list-row" onClick={onOpen}>
        <IconTile icon="settle" tone="green" />
        <span className="list-row__main">
          <strong>{title}</strong>
          <span>
            {expense.description}
            {groupSuffix}
          </span>
        </span>
        <span className="list-row__side">
          {label && <span className="list-row__note">{label}</span>}
          {expense.paidById === me || toId === me ? (
            <span className={`pill ${toId === me ? 'pill--pos' : 'pill--zero'}`}>{formatMoney(expense.amount)}</span>
          ) : (
            <span className="pill pill--zero">{formatMoney(expense.amount)}</span>
          )}
        </span>
      </button>
    );
  }

  const cat = categoryOf(expense);
  const note = effect > 0 ? 'you lent' : effect < 0 ? 'you borrowed' : 'not involved';
  return (
    <button type="button" className="list-row" onClick={onOpen}>
      <IconTile icon={cat.icon} tone={cat.tone} />
      <span className="list-row__main">
        <strong>{expense.description}</strong>
        <span>
          {nameOf(expense.paidById)} paid {formatMoney(expense.amount)}
          {groupSuffix}
        </span>
      </span>
      <span className="list-row__side">
        <span className="list-row__note">{note}</span>
        {effect !== 0 && <AmountPill amount={effect} />}
      </span>
    </button>
  );
}

/** Groups expenses (newest first) under a heading, by month or by day. */
export function groupByDate(expenses: Expense[], by: 'month' | 'day'): { label: string; items: Expense[] }[] {
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const today = localISODate();
  const yesterday = localISODate(new Date(Date.now() - 864e5));
  const labelFor = (date: string) => {
    const d = new Date(`${date}T00:00:00`);
    if (by === 'month') return d.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
    if (date === today) return 'Today';
    if (date === yesterday) return 'Yesterday';
    return d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const out: { label: string; items: Expense[] }[] = [];
  for (const e of sorted) {
    const label = labelFor(e.date);
    const last = out[out.length - 1];
    if (last?.label === label) last.items.push(e);
    else out.push({ label, items: [e] });
  }
  return out;
}

export function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}
