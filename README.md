# CDSplit

A simple expense-splitting proof of concept, built with Vite, React and TypeScript.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## What it does

- **Friends**: five demo users (Akmal, Syahmi, Hakimi, Sarah, Aina). Add more from the sidebar.
- **Expenses**: record who paid and split it equally or by exact amounts. Untick the payer to mean "the others owe the full amount".
- **Groups**: create a group with several members, add group expenses, and see each member's balance plus suggested payments to settle up.
- **Viewing as**: there is no login. The dropdown in the top bar switches whose point of view you see.

Data is saved in the browser's localStorage. "Reset demo data" puts the demo data back.

## Code layout

- `src/types.ts`: data model (amounts are stored in cents)
- `src/money.ts`: splitting, balances and debt simplification
- `src/seed.ts`: demo data
- `src/store.ts`: app state (reducer + localStorage)
- `src/views.tsx`: Dashboard, Friend and Group pages
- `src/components/`: expense form, expense list, balance label
