import type { Meta, StoryObj } from '@storybook/react';
import { StreamCard } from './StreamCard';
import { Stream } from '../../types';

const BASE_STREAM: Stream = {
  streamId: 'CSTREAM0000000000000000000000000000000000000000000000000',
  sender: 'GCKFBEIYTKP73W7KKWE7W5TLIWVZKBZ5I6TAWNBDWTSNUZPQOAA2VUQX',
  recipient: 'GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3',
  token: 'CTOKEN00000000000000000000000000000000000000000000000000',
  ratePerSecond: 10n,
  startTime: 1_000,
  endTime: 1_100,
  totalFunded: 1_000_0000000n,
  totalWithdrawn: 250_0000000n,
  status: 'active',
};

const meta: Meta<typeof StreamCard> = {
  title: 'Components/StreamCard',
  component: StreamCard,
  args: {
    assetCode: 'USDC',
  },
};

export default meta;
type Story = StoryObj<typeof StreamCard>;

export const Active: Story = {
  args: {
    stream: { ...BASE_STREAM, status: 'active' },
  },
};

export const Paused: Story = {
  args: {
    stream: { ...BASE_STREAM, status: 'paused' },
  },
};

export const Cancelled: Story = {
  args: {
    stream: { ...BASE_STREAM, status: 'cancelled', totalWithdrawn: 400_0000000n },
  },
};

export const Completed: Story = {
  args: {
    stream: { ...BASE_STREAM, status: 'completed', totalWithdrawn: BASE_STREAM.totalFunded },
  },
};

export const NoAssetCodeProvided: Story = {
  args: {
    stream: { ...BASE_STREAM, status: 'active' },
    assetCode: undefined,
  },
};
