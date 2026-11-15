import type { Meta, StoryObj } from '@storybook/react';
import { WalletConnectButton } from './WalletConnectButton';

const meta: Meta<typeof WalletConnectButton> = {
  title: 'Components/WalletConnectButton',
  component: WalletConnectButton,
  args: {
    onConnect: () => {},
    onDisconnect: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof WalletConnectButton>;

export const Disconnected: Story = {
  args: {
    isConnected: false,
    publicKey: null,
    isConnecting: false,
  },
};

export const Connecting: Story = {
  args: {
    isConnected: false,
    publicKey: null,
    isConnecting: true,
  },
};

export const Connected: Story = {
  args: {
    isConnected: true,
    publicKey: 'GCKFBEIYTKP73W7KKWE7W5TLIWVZKBZ5I6TAWNBDWTSNUZPQOAA2VUQX',
    isConnecting: false,
  },
};
