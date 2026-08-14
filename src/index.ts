// ── Components ────────────────────────────────────────────────────────────────
export { WalletConnectButton } from './components/WalletConnectButton/WalletConnectButton';
export { StreamProgressBar } from './components/StreamProgressBar/StreamProgressBar';
export { AddressDisplay } from './components/AddressDisplay/AddressDisplay';
export { NetworkBadge } from './components/NetworkBadge/NetworkBadge';
export { TokenAmountDisplay } from './components/TokenAmountDisplay/TokenAmountDisplay';

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useWallet } from './hooks/useWallet';
export { useStream } from './hooks/useStream';
export { useStreamList } from './hooks/useStreamList';
export { useClaimableBalance } from './hooks/useClaimableBalance';
export { useRecurringPayment } from './hooks/useRecurringPayment';

// ── Client ────────────────────────────────────────────────────────────────────
export { VeloxClient } from './client/VeloxClient';

// ── Utils ─────────────────────────────────────────────────────────────────────
export {
  formatTokenAmount,
  formatStreamRate,
  truncateStellarAddress,
  formatTimestamp,
  calculateStreamPercentage,
  formatDuration,
} from './utils/formatters';

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  Stream,
  Schedule,
  WalletState,
  Network,
  StreamStatus,
  ScheduleStatus,
  TxHash,
  CreateStreamParams,
  CreateScheduleParams,
} from './types';
