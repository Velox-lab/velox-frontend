// ── Core domain types for velox-frontend ─────────────────────────────────────

export type StreamStatus = 'active' | 'cancelled' | 'completed';
export type ScheduleStatus = 'active' | 'cancelled' | 'completed';
export type Network = 'mainnet' | 'testnet';

export interface Stream {
  streamId: string;
  sender: string;
  recipient: string;
  token: string;
  ratePerSecond: bigint;
  startTime: number;
  endTime: number;
  totalFunded: bigint;
  totalWithdrawn: bigint;
  status: StreamStatus;
}

export interface Schedule {
  scheduleId: string;
  sender: string;
  recipient: string;
  token: string;
  amount: bigint;
  intervalSeconds: number;
  nextPaymentTime: number;
  status: ScheduleStatus;
}

export interface WalletState {
  publicKey: string | null;
  network: Network;
  isConnected: boolean;
}

export type TxHash = string;

export interface CreateStreamParams {
  recipient: string;
  token: string;
  ratePerSecond: bigint;
  startTime: number;
  endTime: number;
  totalFunded: bigint;
}

export interface CreateScheduleParams {
  recipient: string;
  token: string;
  amount: bigint;
  intervalSeconds: number;
  firstPaymentTime: number;
}
