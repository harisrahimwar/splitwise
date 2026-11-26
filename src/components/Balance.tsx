import { formatMoney } from '../money';

/** Shows a balance from the viewer's side: positive = owed to them. */
export function Balance({ amount, owesLabel = 'you owe', owedLabel = 'owes you' }: {
  amount: number;
  owesLabel?: string;
  owedLabel?: string;
}) {
  if (amount === 0) return <span className="muted">settled up</span>;
  return amount > 0 ? (
    <span className="positive">
      {owedLabel} {formatMoney(amount)}
    </span>
  ) : (
    <span className="negative">
      {owesLabel} {formatMoney(amount)}
    </span>
  );
}
