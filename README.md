# velox-frontend

> React component library for building streaming and recurring payment interfaces on Stellar.

---

## What Is This?

`velox-ui` is a production-ready React component library that gives developers everything they need to build beautiful, functional payment UIs on top of the Velox protocol.

Stop building payment dashboards from scratch. Drop in a `<StreamDashboard />`, a `<CreateStreamForm />`, or a `<PaymentHistory />` and ship in hours, not days.

Every component connects natively to the Velox contracts on Stellar, handles wallet integration, and follows accessibility and responsive design standards out of the box.

---

## Why It Exists

The Velox contracts handle the on-chain logic. The scheduler handles the timing. But every developer building on Velox still needs to build their own UI — the dashboard, the forms, the transaction status, the stream visualization.

`velox-ui` removes that burden. It is the presentation layer of the Velox protocol: a well-designed, well-tested, and easily composable set of React components that any frontend developer can integrate regardless of their blockchain experience.

---

## Components

### Stream Management

#### `<CreateStreamForm />`
A complete form for creating a new payment stream. Handles wallet connection, input validation, token selection, and contract invocation.

**Props:**
- `onSuccess(streamId)` — callback when stream is created
- `onError(error)` — callback on failure
- `defaultToken` — pre-select a token (e.g., USDC)
- `theme` — light | dark

---

#### `<StreamDashboard />`
Displays all active, completed, and cancelled streams for the connected wallet. Shows real-time claimable balance.

**Props:**
- `walletAddress` — the account to display streams for
- `onStreamSelect(streamId)` — callback when user selects a stream
- `filter` — `all` | `incoming` | `outgoing`

---

#### `<StreamCard />`
A single stream summary card. Shows rate, total amount, elapsed time, and current status with a live progress bar.

**Props:**
- `streamId` — the on-chain stream ID
- `showActions` — boolean, show withdraw/cancel buttons
- `onWithdraw(streamId)` — callback for withdraw action
- `onCancel(streamId)` — callback for cancel action

---

#### `<StreamProgressBar />`
A visual progress bar showing how much of a stream has been paid out vs. remaining.

**Props:**
- `streamed` — amount already streamed
- `total` — total stream amount
- `animated` — boolean, animate the fill in real time

---

#### `<WithdrawButton />`
A single-action button that calls `withdraw()` on a `PaymentStream` contract and handles loading, success, and error states.

**Props:**
- `streamId`
- `onSuccess(txHash)`
- `onError(error)`

---

### Recurring Payments

#### `<CreateRecurringPaymentForm />`
A form for setting up fixed-interval recurring payments. Validates intervals, amounts, and recipient addresses.

**Props:**
- `onSuccess(scheduleId)`
- `onError(error)`
- `supportedIntervals` — array of allowed intervals (e.g., `['weekly', 'monthly']`)

---

#### `<RecurringPaymentList />`
Lists all recurring payment schedules for the connected wallet, with next payment time and status.

**Props:**
- `walletAddress`
- `onScheduleSelect(scheduleId)`

---

### Wallet & Network

#### `<WalletConnectButton />`
Handles Stellar wallet connection (Freighter, LOBSTR, xBull). Shows address and disconnect option when connected.

**Props:**
- `onConnect(publicKey)`
- `onDisconnect()`
- `supportedWallets` — array of wallet names to show

---

#### `<NetworkBadge />`
Displays the current Stellar network (Mainnet / Testnet) with a color-coded badge.

**Props:**
- `network` — `mainnet` | `testnet`

---

#### `<TransactionStatus />`
Shows real-time transaction submission status — pending, submitted, confirmed, or failed — with a link to Stellar Expert.

**Props:**
- `txHash`
- `onConfirmed(txHash)`
- `onFailed(error)`

---

### Utility

#### `<TokenAmountDisplay />`
Formats and displays a Stellar token amount with the correct decimal places and asset code.

**Props:**
- `amount` — raw amount
- `assetCode` — e.g., `USDC`, `XLM`
- `decimals`

---

#### `<AddressDisplay />`
Displays a truncated Stellar public key with a copy-to-clipboard button and optional link to Stellar Expert.

**Props:**
- `address`
- `truncate` — boolean
- `linkToExplorer` — boolean

---

## Architecture

Each component follows a strict layered pattern:

```
Component (UI only)
    └── Hook (useStream, useRecurringPayment)
            └── VeloxClient (contract calls)
                    └── @stellar/stellar-sdk
```

- Components handle **rendering only** — no business logic
- Hooks handle **state and side effects** — no JSX
- `VeloxClient` handles **contract interaction** — no UI concerns

---

## Development Principles

### Test-Driven Development (TDD)
Every component and hook is written test-first using React Testing Library and Jest. No component is merged without tests covering its key behaviors and edge cases.

```
Write a failing test → Write minimum code to pass → Refactor → Repeat
```

### SOLID Principles
- **Single Responsibility** — `<StreamCard />` renders a card. `useStream` fetches stream data. They do not cross into each other's domain.
- **Open/Closed** — Components accept `theme` and `className` props for extension without modifying internals.
- **Liskov Substitution** — Any wallet adapter can be substituted behind `WalletConnectButton` without changing its interface.
- **Interface Segregation** — Props are minimal and purposeful. No component receives props it doesn't use.
- **Dependency Inversion** — Components depend on hook abstractions, not direct SDK calls. This makes testing and mocking straightforward.

### Clean Code Standards
- Component names describe exactly what they render
- Hooks are named after what they return (`useStream`, `useClaimableBalance`)
- No business logic in JSX — handlers are extracted to hooks
- Accessibility first — all interactive elements have ARIA labels, keyboard navigation, and sufficient color contrast

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| `@stellar/stellar-sdk` | Stellar network interaction |
| `@stellar/freighter-api` | Wallet integration |
| Tailwind CSS | Styling |
| React Testing Library | Component testing |
| Jest | Test runner |
| Storybook | Component development and documentation |
| Vite | Build tooling |

---

## Getting Started

### Installation

```bash
npm install @velox-lab/velox-ui
```

### Peer Dependencies

```bash
npm install react react-dom @stellar/stellar-sdk @stellar/freighter-api
```

### Basic Usage

```tsx
import {
  WalletConnectButton,
  StreamDashboard,
  CreateStreamForm
} from '@velox-lab/velox-ui'

export function App() {
  return (
    <div>
      <WalletConnectButton
        onConnect={(publicKey) => console.log('Connected:', publicKey)}
        onDisconnect={() => console.log('Disconnected')}
      />
      <StreamDashboard
        walletAddress="G..."
        filter="incoming"
      />
      <CreateStreamForm
        defaultToken="USDC"
        onSuccess={(streamId) => console.log('Stream created:', streamId)}
        onError={(error) => console.error(error)}
      />
    </div>
  )
}
```

---

## Local Development

```bash
git clone https://github.com/Velox-lab/velox-frontend.git
cd velox-frontend
npm install
```

### Run Storybook

```bash
npm run storybook
```

### Run Tests

```bash
npm test
```

### Run Tests (single pass, no watch)

```bash
npm run test:run
```

### Build Library

```bash
npm run build
```

---

## Project Structure

```
velox-frontend/
├── src/
│   ├── components/
│   │   ├── StreamDashboard/
│   │   │   ├── StreamDashboard.tsx
│   │   │   ├── StreamDashboard.test.tsx
│   │   │   └── StreamDashboard.stories.tsx
│   │   ├── StreamCard/
│   │   ├── CreateStreamForm/
│   │   ├── WalletConnectButton/
│   │   ├── RecurringPaymentList/
│   │   └── ...
│   ├── hooks/
│   │   ├── useStream.ts
│   │   ├── useClaimableBalance.ts
│   │   ├── useRecurringPayment.ts
│   │   └── useWallet.ts
│   ├── client/
│   │   └── VeloxClient.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── .storybook/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Contributing

This repository is part of the **Velox** open-source project built on the Stellar ecosystem. Contributions are welcome.

**Before you contribute:**
1. Read the [Contributing Guide](CONTRIBUTING.md)
2. Check open issues labeled `good first issue` or `help wanted`
3. Follow the TDD workflow — write your test before your implementation
4. Ensure `npm test` passes before submitting a PR
5. One concern per PR — keep changes focused

**Good first issues include:**
- Building the `<AddressDisplay />` component with copy-to-clipboard
- Writing tests for `<StreamProgressBar />`
- Implementing the `useClaimableBalance` hook
- Adding dark mode support to `<StreamCard />`
- Writing Storybook stories for existing components

---

## Roadmap

- [x] Project scaffold and architecture design
- [ ] `WalletConnectButton` component
- [ ] `useWallet` hook
- [ ] `VeloxClient` — contract interaction layer
- [ ] `CreateStreamForm` component
- [ ] `StreamCard` component
- [ ] `StreamDashboard` component
- [ ] `StreamProgressBar` component (animated)
- [ ] `RecurringPaymentList` component
- [ ] `TransactionStatus` component
- [ ] Storybook setup and stories for all components
- [ ] Full test coverage (target: 95%+)
- [ ] npm package publish

---

## License

MIT — free to use, modify, and build upon.

---

> The face of the Velox protocol. Clean. Accessible. Ready to ship.
