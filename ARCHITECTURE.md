# Architecture — velox-frontend

This document describes the architectural design of the `velox-frontend` repository: the React component library and UI layer of the Velox protocol.

---

## Overview

`velox-frontend` is a layered React component library. It provides developers with ready-made, accessible, and fully-tested UI components for building streaming and recurring payment interfaces on Stellar.

The library is organized into three strict layers. Each layer has a single responsibility and depends only on the layer below it. No layer reaches upward or sideways.

```
┌──────────────────────────────────────┐
│         Components (UI Layer)        │  ← Renders JSX only
├──────────────────────────────────────┤
│          Hooks (Logic Layer)         │  ← State, effects, data
├──────────────────────────────────────┤
│       VeloxClient (Data Layer)       │  ← Contract & network calls
├──────────────────────────────────────┤
│      @stellar/stellar-sdk            │  ← External dependency
└──────────────────────────────────────┘
```

---

## System Context

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser / dApp                          │
│                                                             │
│   Developer's App                                           │
│       └── velox-frontend components                         │
│               └── Hooks (useStream, useWallet, ...)         │
│                       └── VeloxClient                       │
│                               ├── Stellar Horizon RPC       │
│                               ├── Soroban RPC               │
│                               └── Freighter Wallet API      │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### Layer 1: Components (UI Layer)

**Responsibility:** Render UI. Handle user interactions. Nothing else.

Components are pure presentational units. They receive data and callbacks as props, render JSX, and call callbacks when the user acts. They contain no business logic, no direct SDK calls, and no async operations.

**Rules for this layer:**
- No direct calls to `VeloxClient`
- No `useEffect` for data fetching — delegate to hooks
- No business logic in event handlers — call the hook's action instead
- All interactive elements must have ARIA labels

```tsx
// ✅ Correct — component delegates to hook
function StreamCard({ streamId }: Props) {
  const { stream, withdraw, isWithdrawing } = useStream(streamId)
  return (
    <div>
      <span>{stream.claimableBalance}</span>
      <button onClick={withdraw} disabled={isWithdrawing}>Withdraw</button>
    </div>
  )
}

// ❌ Wrong — component doing its own data fetching
function StreamCard({ streamId }: Props) {
  const [stream, setStream] = useState(null)
  useEffect(() => {
    VeloxClient.getStream(streamId).then(setStream) // violation
  }, [streamId])
}
```

---

### Layer 2: Hooks (Logic Layer)

**Responsibility:** Manage state, side effects, and data flow. No JSX.

Hooks are the bridge between components and the data layer. They handle:
- Fetching and caching contract data
- Exposing actions (withdraw, cancel, create) that components can call
- Managing loading and error states
- Formatting raw contract data for display

**Rules for this layer:**
- No JSX returned — only data and callbacks
- No direct `fetch()` or SDK calls — delegate to `VeloxClient`
- Each hook manages one domain (`useStream`, `useWallet`, `useRecurringPayment`)

```typescript
// useStream — manages one stream's full state
function useStream(streamId: string) {
  const [stream, setStream] = useState<Stream | null>(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const fetchStream = async () => {
    const data = await VeloxClient.getStream(streamId)
    setStream(data)
  }

  const withdraw = async () => {
    setIsWithdrawing(true)
    await VeloxClient.withdrawFromStream(streamId)
    await fetchStream() // refresh after action
    setIsWithdrawing(false)
  }

  useEffect(() => { fetchStream() }, [streamId])

  return { stream, withdraw, isWithdrawing }
}
```

---

### Layer 3: VeloxClient (Data Layer)

**Responsibility:** All communication with the Stellar network and Velox contracts.

`VeloxClient` is a single module that encapsulates every external call. It translates between the application domain (streams, schedules, wallets) and the Stellar SDK domain (transactions, XDR, contract invocations).

**Rules for this layer:**
- No UI imports — zero React dependencies
- Returns typed domain objects — never raw SDK types to upper layers
- Throws typed errors — no raw SDK error objects bubble up
- One method per action

```typescript
class VeloxClient {
  getStream(streamId: string): Promise<Stream>
  getClaimableBalance(streamId: string): Promise<bigint>
  createStream(params: CreateStreamParams): Promise<string>
  withdrawFromStream(streamId: string): Promise<TxHash>
  cancelStream(streamId: string): Promise<TxHash>
  getSchedule(scheduleId: string): Promise<Schedule>
  createRecurringPayment(params: CreateScheduleParams): Promise<string>
  cancelSchedule(scheduleId: string): Promise<TxHash>
}
```

---

## Component Tree

```
velox-frontend/src/components/

Stream Management
├── StreamDashboard/           # Full dashboard — lists all streams
│   ├── StreamDashboard.tsx
│   ├── StreamDashboard.test.tsx
│   └── StreamDashboard.stories.tsx
│
├── StreamCard/                # Single stream summary card
├── StreamProgressBar/         # Animated progress bar
├── CreateStreamForm/          # Form to create a new stream
└── WithdrawButton/            # Single-action withdraw button

Recurring Payments
├── RecurringPaymentList/      # List of all recurring schedules
└── CreateRecurringPaymentForm/

Wallet & Network
├── WalletConnectButton/       # Wallet connect/disconnect
├── NetworkBadge/              # Mainnet / Testnet indicator
└── TransactionStatus/         # Live tx submission status

Utility
├── TokenAmountDisplay/        # Formats token amounts
└── AddressDisplay/            # Truncated address + copy button
```

---

## Hook Map

```
velox-frontend/src/hooks/

├── useWallet.ts               # Wallet connection state and actions
├── useStream.ts               # Single stream state and actions
├── useStreamList.ts           # List of streams for an address
├── useClaimableBalance.ts     # Real-time claimable balance for a stream
├── useRecurringPayment.ts     # Single schedule state and actions
└── useTransactionStatus.ts    # Poll tx hash for confirmation status
```

---

## Data Flow: Withdrawing from a Stream

```
User clicks "Withdraw" on StreamCard
        │
        ▼
StreamCard calls withdraw() from useStream(streamId)
        │
        ▼
useStream sets isWithdrawing = true
        │
        ▼
useStream calls VeloxClient.withdrawFromStream(streamId)
        │
        ▼
VeloxClient builds Soroban invocation transaction
        │
        ▼
VeloxClient requests signature from Freighter wallet
        │
        ▼
VeloxClient submits signed transaction to Horizon
        │
        ▼
VeloxClient returns txHash
        │
        ▼
useStream calls VeloxClient.getStream() to refresh state
        │
        ▼
useStream sets isWithdrawing = false, updates stream state
        │
        ▼
StreamCard re-renders with updated balance
```

---

## Data Flow: Connecting a Wallet

```
User clicks WalletConnectButton
        │
        ▼
WalletConnectButton calls connect() from useWallet()
        │
        ▼
useWallet calls VeloxClient.connectWallet()
        │
        ▼
VeloxClient calls @stellar/freighter-api.requestAccess()
        │
        ▼
Freighter browser extension prompts user for approval
        │
        ▼
VeloxClient returns { publicKey, network }
        │
        ▼
useWallet stores wallet state in React context
        │
        ▼
All components using useWallet() re-render with connected state
```

---

## State Management

There is no global state management library (no Redux, no Zustand). State is managed at three levels:

| Level | Tool | What lives here |
|-------|------|----------------|
| Global | React Context | Wallet connection state, network config |
| Feature | Custom hooks | Stream data, schedule data, tx status |
| Local | useState | UI state (form values, loading, modals) |

The wallet context is the only global state. Everything else is local to the component tree that needs it.

```typescript
// WalletContext — the only global state
const WalletContext = createContext<WalletState | null>(null)

interface WalletState {
  publicKey: string | null
  network: 'mainnet' | 'testnet'
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
}
```

---

## Testing Strategy

Following strict TDD — every component and hook test is written before the implementation.

| Layer | Test tool | Approach |
|-------|-----------|---------|
| Components | React Testing Library | Render → interact → assert DOM |
| Hooks | `renderHook` (RTL) | Call hook → trigger actions → assert state |
| VeloxClient | Jest mocks | Mock Stellar SDK, assert correct calls |

**Component test pattern:**
```typescript
it('shows withdraw button only when balance > 0', () => {
  // Arrange
  mockUseStream.mockReturnValue({ claimableBalance: 100n, withdraw: jest.fn() })
  // Act
  render(<StreamCard streamId="abc" />)
  // Assert
  expect(screen.getByRole('button', { name: /withdraw/i })).toBeInTheDocument()
})
```

**Hook test pattern:**
```typescript
it('calls VeloxClient.withdrawFromStream with correct streamId', async () => {
  const mockWithdraw = jest.fn().mockResolvedValue('txhash')
  VeloxClient.withdrawFromStream = mockWithdraw
  const { result } = renderHook(() => useStream('stream-1'))
  await act(() => result.current.withdraw())
  expect(mockWithdraw).toHaveBeenCalledWith('stream-1')
})
```

Target coverage: **95%+**

---

## Accessibility Standards

All components must meet WCAG 2.1 AA:

- Interactive elements have descriptive ARIA labels
- Focus is managed correctly on modal open/close
- Color contrast ratio meets minimum 4.5:1 for normal text
- All actions are keyboard accessible
- Loading states are announced to screen readers via `aria-live`
- Form inputs have associated `<label>` elements

---

## Theming

Components accept a `theme` prop (`light` | `dark`) and use CSS custom properties for all color values. This allows consumer apps to override the design tokens without forking the component.

```css
/* Default light theme */
:root {
  --velox-primary: #6c47ff;
  --velox-bg: #ffffff;
  --velox-text: #111111;
  --velox-border: #e2e8f0;
}

/* Dark theme override */
[data-theme='dark'] {
  --velox-bg: #0f0f0f;
  --velox-text: #f5f5f5;
  --velox-border: #2a2a2a;
}
```

---

## Storybook

Every component has a corresponding Storybook story that documents:
- All prop variations
- Loading states
- Error states
- Dark and light themes

Storybook serves as the living documentation and design review environment.

---

> Components render. Hooks think. VeloxClient talks to the network. The layers never mix.
