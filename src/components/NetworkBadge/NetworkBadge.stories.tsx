import type { Meta, StoryObj } from '@storybook/react';
import { NetworkBadge } from './NetworkBadge';

const meta: Meta<typeof NetworkBadge> = {
  title: 'Components/NetworkBadge',
  component: NetworkBadge,
};

export default meta;
type Story = StoryObj<typeof NetworkBadge>;

export const Mainnet: Story = {
  args: {
    network: 'mainnet',
  },
};

export const Testnet: Story = {
  args: {
    network: 'testnet',
  },
};
