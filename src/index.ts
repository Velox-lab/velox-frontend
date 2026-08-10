// ── Components ────────────────────────────────────────────────────────────────
export { WalletConnectButton } from './components/WalletConnectButton/WalletConnectButton';
export { StreamProgressBar } from './components/StreamProgressBar/StreamProgressBar';
export { AddressDisplay } from './components/AddressDisplay/AddressDisplay';
export { NetworkBadge } from './components/NetworkBadge/NetworkBadge';

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useWallet } from './hooks/useWallet';
export { useStream } from './hooks/useStream';
export { useStreamList } from './hooks/useStreamList';
export { useClaimableBalance } from './hooks/useClaimableBalance';

// ── Client ────────────────────────────────────────────────────────────────────
export { VeloxClient } from './client/VeloxClient';

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
