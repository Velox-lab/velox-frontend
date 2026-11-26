import type { KeyboardEvent } from 'react';
import { Schedule } from '../../types';
import { AddressDisplay } from '../AddressDisplay/AddressDisplay';
import { TokenAmountDisplay } from '../TokenAmountDisplay/TokenAmountDisplay';
import { formatTimestamp, truncateStellarAddress } from '../../utils/formatters';

interface Props {
  schedules: Schedule[];
  /** Shows a loading row instead of the list (or the empty state) while true. */
  isLoading?: boolean;
  onScheduleSelect?: (scheduleId: string) => void;
  /**
   * Display code for a schedule's token, e.g. 'XLM' or 'USDC'. Resolving it
   * from schedule.token (a contract address) would need a network call this
   * component doesn't make — pass it in from wherever the token's metadata
   * is already known. Falls back to a truncated contract address per schedule.
   */
  assetCode?: string;
}

const STATUS_LABEL: Record<Schedule['status'], string> = {
  active: 'Active',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

/**
 * RecurringPaymentList — lists recurring payment schedules with their
 * recipient, amount per interval, next payment time, and status.
 *
 * Renders only. Takes the schedules it shows as a prop rather than fetching
 * them itself — pairs with useScheduleList, same split as every other list
 * in this library.
 */
export function RecurringPaymentList({
  schedules,
  isLoading = false,
  onScheduleSelect,
  assetCode,
}: Props) {
  if (isLoading) {
    return <div className="velox-schedule-list velox-schedule-list--loading">Loading schedules…</div>;
  }

  if (schedules.length === 0) {
    return <div className="velox-schedule-list velox-schedule-list--empty">No recurring payments</div>;
  }

  return (
    <ul className="velox-schedule-list">
      {schedules.map((schedule) => {
        const code = assetCode ?? truncateStellarAddress(schedule.token);
        const selectable = Boolean(onScheduleSelect);

        // A plain div with role="button", not a real <button>: AddressDisplay
        // renders its own copy-to-clipboard button, and nesting a button
        // inside a button is invalid HTML (and un-clickable in some browsers).
        return (
          <li key={schedule.scheduleId} className="velox-schedule-list__item">
            <div
              className={
                selectable
                  ? 'velox-schedule-list__row velox-schedule-list__row--selectable'
                  : 'velox-schedule-list__row'
              }
              aria-label={`Schedule ${schedule.scheduleId}`}
              {...(selectable
                ? {
                    role: 'button',
                    tabIndex: 0,
                    onClick: () => onScheduleSelect?.(schedule.scheduleId),
                    onKeyDown: (e: KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onScheduleSelect?.(schedule.scheduleId);
                      }
                    },
                  }
                : {})}
            >
              <RecurringPaymentRow schedule={schedule} code={code} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RecurringPaymentRow({ schedule, code }: { schedule: Schedule; code: string }) {
  return (
    <>
      <span
        className={`velox-schedule-list__status velox-schedule-list__status--${schedule.status}`}
      >
        {STATUS_LABEL[schedule.status]}
      </span>

      <span className="velox-schedule-list__recipient">
        <AddressDisplay address={schedule.recipient} />
      </span>

      <span className="velox-schedule-list__amount">
        <TokenAmountDisplay amount={schedule.amount} assetCode={code} /> / payment
      </span>

      <span className="velox-schedule-list__next-payment">
        {schedule.status === 'active'
          ? `Next: ${formatTimestamp(schedule.nextPaymentTime)}`
          : '—'}
      </span>
    </>
  );
}
