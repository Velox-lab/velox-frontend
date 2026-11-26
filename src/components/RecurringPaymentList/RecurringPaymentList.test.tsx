import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringPaymentList } from './RecurringPaymentList';
import { Schedule } from '../../types';

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    scheduleId: 'CSCHEDULE00000000000000000000000000000000000000000000000',
    sender: 'GSENDER0000000000000000000000000000000000000000000000000',
    recipient: 'GRECIPIENT000000000000000000000000000000000000000000000',
    token: 'CTOKEN0000000000000000000000000000000000000000000000000',
    amount: 100n,
    intervalSeconds: 604_800,
    nextPaymentTime: 1_700_000_000,
    status: 'active',
    ...overrides,
  };
}

describe('RecurringPaymentList', () => {
  it('shows a loading row and nothing else while loading', () => {
    render(<RecurringPaymentList schedules={[]} isLoading />);
    expect(screen.getByText(/loading schedules/i)).toBeInTheDocument();
  });

  it('shows an empty state when there are no schedules and not loading', () => {
    render(<RecurringPaymentList schedules={[]} />);
    expect(screen.getByText(/no recurring payments/i)).toBeInTheDocument();
  });

  it('renders one row per schedule with recipient and amount', () => {
    render(
      <RecurringPaymentList
        schedules={[makeSchedule({ scheduleId: 'a' }), makeSchedule({ scheduleId: 'b' })]}
        assetCode="USDC"
      />
    );
    expect(
      screen.getAllByText((_, el) => el?.textContent === '0.0000100 USDC / payment')
    ).toHaveLength(2);
    expect(screen.getAllByLabelText(/stellar address: GRECIPIENT/i)).toHaveLength(2);
  });

  it.each([
    ['active', 'Active'],
    ['cancelled', 'Cancelled'],
    ['completed', 'Completed'],
  ] as const)('shows the %s status label', (status, label) => {
    render(<RecurringPaymentList schedules={[makeSchedule({ status })]} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('shows the next payment time for an active schedule', () => {
    render(<RecurringPaymentList schedules={[makeSchedule({ status: 'active' })]} />);
    expect(screen.getByText(/Next: /)).toBeInTheDocument();
  });

  it('shows a dash instead of a next payment time for a non-active schedule', () => {
    render(<RecurringPaymentList schedules={[makeSchedule({ status: 'cancelled' })]} />);
    expect(screen.queryByText(/Next: /)).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('falls back to a truncated token address when no asset code is given', () => {
    render(<RecurringPaymentList schedules={[makeSchedule()]} />);
    expect(screen.getByText(/CTOK\.\.\.0000/)).toBeInTheDocument();
  });

  it('calls onScheduleSelect with the scheduleId when a row is clicked', () => {
    const onScheduleSelect = jest.fn();
    render(
      <RecurringPaymentList
        schedules={[makeSchedule({ scheduleId: 'schedule-1' })]}
        onScheduleSelect={onScheduleSelect}
      />
    );

    fireEvent.click(screen.getByLabelText('Schedule schedule-1'));

    expect(onScheduleSelect).toHaveBeenCalledWith('schedule-1');
  });

  it('does not give the row an interactive role when onScheduleSelect is not provided', () => {
    render(<RecurringPaymentList schedules={[makeSchedule({ scheduleId: 'schedule-1' })]} />);
    expect(screen.getByLabelText('Schedule schedule-1')).not.toHaveAttribute('role');
  });

  it('selects a row via the keyboard (Enter) when onScheduleSelect is provided', () => {
    const onScheduleSelect = jest.fn();
    render(
      <RecurringPaymentList
        schedules={[makeSchedule({ scheduleId: 'schedule-1' })]}
        onScheduleSelect={onScheduleSelect}
      />
    );

    fireEvent.keyDown(screen.getByLabelText('Schedule schedule-1'), { key: 'Enter' });

    expect(onScheduleSelect).toHaveBeenCalledWith('schedule-1');
  });
});
