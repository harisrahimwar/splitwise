# CDSplit

A simple expense-splitting proof of concept, built with Vite, React and TypeScript.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## What it does

The UI follows the designer's CD theme screens (mobile layout, bottom tab bar: Home, Groups, Add, Activity, Account).

- **Home**: your net balance, your groups and what each friend owes you or you owe them.
- **Groups**: create a group, see its expenses by month (filter by category), member balances, suggested payments, and invite members.
- **Add expense**: pick a category, date, payer and group, then split equally, by exact amounts, by percent or by shares. Untick the payer to mean "the others owe the full amount". Tap an expense to see its split, edit it or delete it.
- **Settle up**: record a full, half or custom payment made outside the app (DuitNow, e-Wallet, cash or other). Payments reduce balances like any expense.
- **Activity**: every expense and payment you're part of, by day.
- **Account**: switch "viewing as" (there is no login yet), add friends, export a CSV, or reset the demo data.

Data is saved in the browser's localStorage.

## Code layout

- `src/types.ts`: data model (amounts are stored in cents)
- `src/money.ts`: splitting, balances and debt simplification
- `src/seed.ts`: demo data
- `src/store.ts`: app state (reducer + localStorage)
- `src/nav.ts`: the screen stack used for navigation
- `src/screens/`: one file per screen
- `src/components/ui.tsx`: icons, avatars, pills, hero card and other shared pieces
- `public/hero-art.jpg`: the particle artwork from the designs, used on the balance card
