import type { Meta, StoryObj } from '@storybook/react';
import { RecurringPaymentList } from './RecurringPaymentList';
import { Schedule } from '../../types';

function makeSchedule(overrides: Partial<Schedule>): Schedule {
  return {
    scheduleId: 'CSCHEDULE000000000000000000000000000000000000000000000000',
    sender: 'GCKFBEIYTKP73W7KKWE7W5TLIWVZKBZ5I6TAWNBDWTSNUZPQOAA2VUQX',
    recipient: 'GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3',
    token: 'CTOKEN00000000000000000000000000000000000000000000000000',
    amount: 100_0000000n,
    intervalSeconds: 604_800,
    nextPaymentTime: 1_700_000_000,
    status: 'active',
    ...overrides,
  };
}

const meta: Meta<typeof RecurringPaymentList> = {
  title: 'Components/RecurringPaymentList',
  component: RecurringPaymentList,
  args: {
    assetCode: 'USDC',
  },
};

export default meta;
type Story = StoryObj<typeof RecurringPaymentList>;

export const Default: Story = {
  args: {
    schedules: [
      makeSchedule({ scheduleId: 'a', status: 'active' }),
      makeSchedule({ scheduleId: 'b', status: 'active', amount: 50_0000000n }),
      makeSchedule({ scheduleId: 'c', status: 'cancelled' }),
      makeSchedule({ scheduleId: 'd', status: 'completed' }),
    ],
  },
};

export const Loading: Story = {
  args: {
    schedules: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    schedules: [],
  },
};

export const Selectable: Story = {
  args: {
    schedules: [makeSchedule({ scheduleId: 'a' }), makeSchedule({ scheduleId: 'b' })],
    onScheduleSelect: (scheduleId: string) => console.log('selected', scheduleId),
  },
};
