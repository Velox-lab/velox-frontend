import { render, screen, fireEvent, act } from '@testing-library/react';
import { AddressDisplay } from './AddressDisplay';

const FULL_ADDRESS = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ012345';

/**
 * jsdom does not implement the Clipboard API; stub it for each test that needs it.
 * Uses fireEvent rather than userEvent to trigger the click: userEvent.click somehow
 * stops the component from seeing this stub (confirmed by comparing fireEvent.click,
 * which reaches it, against userEvent.click, which does not, with everything else
 * identical) — not pinned down further since fireEvent is also what's needed below to
 * keep the revert timer under fake-timer control.
 */
function stubClipboard(writeText: jest.Mock) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
}

/** Flush the microtask queue so a promise-returning click handler settles. */
async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('AddressDisplay', () => {
  it('renders the address', () => {
    render(<AddressDisplay address={FULL_ADDRESS} />);
    expect(screen.getByLabelText(/stellar address/i)).toBeInTheDocument();
  });

  it('truncates the address by default', () => {
    render(<AddressDisplay address={FULL_ADDRESS} />);
    expect(screen.getByLabelText(/stellar address/i).textContent).toBe('GABC...2345');
  });

  it('truncates a real 56-character Stellar address the same way', () => {
    const realAddress = 'GCKFBEIYTKP73W3PZPF4ZZSZPJXHWY2APQ7UPQ5DBJCSHCN7CFD2FJVK';
    render(<AddressDisplay address={realAddress} />);
    expect(screen.getByLabelText(/stellar address/i).textContent).toBe('GCKF...FJVK');
  });

  it('shows full address when truncate is false', () => {
    render(<AddressDisplay address={FULL_ADDRESS} truncate={false} />);
    expect(screen.getByLabelText(/stellar address/i).textContent).toBe(FULL_ADDRESS);
  });

  it('renders a link to Stellar Expert when linkToExplorer is true', () => {
    render(<AddressDisplay address={FULL_ADDRESS} linkToExplorer={true} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      `https://stellar.expert/explorer/public/account/${FULL_ADDRESS}`
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders a copy button', () => {
    render(<AddressDisplay address={FULL_ADDRESS} />);
    expect(screen.getByRole('button', { name: /copy address/i })).toBeInTheDocument();
  });

  it('does not render an anchor when linkToExplorer is false', () => {
    render(<AddressDisplay address={FULL_ADDRESS} linkToExplorer={false} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  describe('copy to clipboard', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('copies the full (untruncated) address, even when displayed truncated', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      stubClipboard(writeText);
      render(<AddressDisplay address={FULL_ADDRESS} />);

      fireEvent.click(screen.getByRole('button', { name: /copy address/i }));
      await flushMicrotasks();

      expect(writeText).toHaveBeenCalledWith(FULL_ADDRESS);
    });

    it('shows a confirmation after copying, then reverts after 2 seconds', async () => {
      // Fake timers must be active before the click, since that is what schedules
      // the revert's setTimeout; enabling them afterwards cannot control a timer
      // that was already created under real time.
      jest.useFakeTimers();
      const writeText = jest.fn().mockResolvedValue(undefined);
      stubClipboard(writeText);
      render(<AddressDisplay address={FULL_ADDRESS} />);
      const button = screen.getByRole('button', { name: /copy address/i });

      expect(button).toHaveTextContent('⎘');
      expect(button).toHaveAttribute('title', 'Copy address');

      fireEvent.click(button);
      await flushMicrotasks();

      expect(button).toHaveTextContent('✓');
      expect(button).toHaveAttribute('title', 'Copied!');

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(button).toHaveTextContent('⎘');
      expect(button).toHaveAttribute('title', 'Copy address');
    });

    it('fails silently when the Clipboard API rejects', async () => {
      const writeText = jest.fn().mockRejectedValue(new Error('denied'));
      stubClipboard(writeText);
      render(<AddressDisplay address={FULL_ADDRESS} />);
      const button = screen.getByRole('button', { name: /copy address/i });

      fireEvent.click(button);
      await flushMicrotasks();

      expect(button).toHaveTextContent('⎘');
      expect(button).toHaveAttribute('title', 'Copy address');
    });
  });
});
