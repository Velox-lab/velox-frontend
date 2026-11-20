import type { Meta, StoryObj } from '@storybook/react';
import { TransactionStatus } from './TransactionStatus';

const TX_HASH = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

const meta: Meta<typeof TransactionStatus> = {
  title: 'Components/TransactionStatus',
  component: TransactionStatus,
};

export default meta;
type Story = StoryObj<typeof TransactionStatus>;

export const Pending: Story = {
  args: {
    status: 'pending',
  },
};

export const Submitted: Story = {
  args: {
    status: 'submitted',
    txHash: TX_HASH,
  },
};

export const Confirmed: Story = {
  args: {
    status: 'confirmed',
    txHash: TX_HASH,
  },
};

export const Failed: Story = {
  args: {
    status: 'failed',
    txHash: TX_HASH,
  },
};

export const TestnetLink: Story = {
  args: {
    status: 'confirmed',
    txHash: TX_HASH,
    network: 'testnet',
  },
};
