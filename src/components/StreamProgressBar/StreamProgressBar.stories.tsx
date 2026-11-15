import type { Meta, StoryObj } from '@storybook/react';
import { StreamProgressBar } from './StreamProgressBar';

const meta: Meta<typeof StreamProgressBar> = {
  title: 'Components/StreamProgressBar',
  component: StreamProgressBar,
};

export default meta;
type Story = StoryObj<typeof StreamProgressBar>;

export const ZeroPercent: Story = {
  args: {
    streamed: 0n,
    total: 1000n,
  },
};

export const FiftyPercent: Story = {
  args: {
    streamed: 500n,
    total: 1000n,
  },
};

export const HundredPercent: Story = {
  args: {
    streamed: 1000n,
    total: 1000n,
  },
};

export const Animated: Story = {
  args: {
    streamed: 500n,
    total: 1000n,
    animated: true,
  },
};
