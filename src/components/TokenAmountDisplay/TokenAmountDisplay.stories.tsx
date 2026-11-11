import type { Meta, StoryObj } from '@storybook/react';
import { TokenAmountDisplay } from './TokenAmountDisplay';

const meta: Meta<typeof TokenAmountDisplay> = {
  title: 'Components/TokenAmountDisplay',
  component: TokenAmountDisplay,
};

export default meta;
type Story = StoryObj<typeof TokenAmountDisplay>;

export const XLM: Story = {
  args: {
    amount: 1_000_0000000n, // 1000 XLM, in stroops (7 decimals)
    assetCode: 'XLM',
  },
};

export const USDC: Story = {
  args: {
    amount: 25_0000000n, // 25 USDC (7 decimals)
    assetCode: 'USDC',
  },
};

export const ZeroAmount: Story = {
  args: {
    amount: 0n,
    assetCode: 'XLM',
  },
};
