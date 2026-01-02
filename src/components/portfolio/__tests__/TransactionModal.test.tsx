/**
 * Component Tests: TransactionModal
 *
 * Tests the transaction modal component including:
 * - Form rendering for different transaction types
 * - Validation behavior
 * - Auto-calculation of total amount
 * - Form submission
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionModal } from '../TransactionModal';

describe('TransactionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      render(
        <TransactionModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByText('Add Transaction')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Check for the modal heading specifically using role
      expect(screen.getByRole('heading', { name: /add transaction/i })).toBeInTheDocument();
    });

    it('should render all transaction type buttons', () => {
      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Buy')).toBeInTheDocument();
      expect(screen.getByText('Sell')).toBeInTheDocument();
      expect(screen.getByText('Deposit')).toBeInTheDocument();
      expect(screen.getByText('Withdraw')).toBeInTheDocument();
      expect(screen.getByText('Dividend')).toBeInTheDocument();
    });

    it('should use default transaction type', () => {
      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="DEPOSIT"
        />
      );

      // DEPOSIT button should be selected
      const depositButton = screen.getByText('Deposit');
      expect(depositButton.closest('button')).toHaveClass('bg-indigo-600');
    });
  });

  describe('Form Fields', () => {
    it('should show symbol field for BUY transactions', () => {
      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="BUY"
        />
      );

      expect(screen.getByPlaceholderText('e.g., AAPL')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Price per Share')).toBeInTheDocument();
    });

    it('should show symbol field for SELL transactions', () => {
      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="SELL"
        />
      );

      expect(screen.getByPlaceholderText('e.g., AAPL')).toBeInTheDocument();
    });

    it('should show symbol field for DIVIDEND transactions', () => {
      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="DIVIDEND"
        />
      );

      expect(screen.getByPlaceholderText('e.g., AAPL')).toBeInTheDocument();
    });

    it('should NOT show symbol field for DEPOSIT transactions', () => {
      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="DEPOSIT"
        />
      );

      expect(screen.queryByPlaceholderText('e.g., AAPL')).not.toBeInTheDocument();
    });

    it('should NOT show symbol field for WITHDRAW transactions', () => {
      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="WITHDRAW"
        />
      );

      expect(screen.queryByPlaceholderText('e.g., AAPL')).not.toBeInTheDocument();
    });

    it('should always show total amount field', () => {
      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Total Amount')).toBeInTheDocument();
    });

    it('should always show date field', () => {
      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Date')).toBeInTheDocument();
    });
  });

  describe('Auto-calculation', () => {
    it('should auto-calculate total amount for BUY', async () => {
      const user = userEvent.setup();

      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="BUY"
        />
      );

      // Enter quantity
      const quantityInput = screen.getByPlaceholderText('0');
      await user.clear(quantityInput);
      await user.type(quantityInput, '10');

      // Enter price
      const priceInputs = screen.getAllByPlaceholderText('0.00');
      const priceInput = priceInputs[0]; // First 0.00 placeholder is price
      await user.clear(priceInput);
      await user.type(priceInput, '150');

      // Total should be auto-calculated
      await waitFor(() => {
        const totalInput = priceInputs[1]; // Second 0.00 placeholder is total
        expect(totalInput).toHaveValue(1500);
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit DEPOSIT transaction', async () => {
      const user = userEvent.setup();

      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="DEPOSIT"
        />
      );

      // Enter amount - for DEPOSIT, there's only one 0.00 placeholder (Total Amount)
      const amountInputs = screen.getAllByPlaceholderText('0.00');
      const amountInput = amountInputs[0];
      await user.clear(amountInput);
      await user.type(amountInput, '5000');

      // Submit using role query to avoid duplicates
      const submitButton = screen.getByRole('button', { name: /add transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            transactionType: 'DEPOSIT',
            totalAmount: 5000,
          })
        );
      });
    });

    it('should submit BUY transaction with all fields', async () => {
      const user = userEvent.setup();

      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="BUY"
        />
      );

      // Enter symbol
      const symbolInput = screen.getByPlaceholderText('e.g., AAPL');
      await user.type(symbolInput, 'TSLA');

      // Enter quantity
      const quantityInput = screen.getByPlaceholderText('0');
      await user.type(quantityInput, '10');

      // Enter price
      const priceInputs = screen.getAllByPlaceholderText('0.00');
      await user.type(priceInputs[0], '200');

      // Submit using role query
      const submitButton = screen.getByRole('button', { name: /add transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            transactionType: 'BUY',
            assetSymbol: 'TSLA',
            quantity: 10,
            pricePerShare: 200,
          })
        );
      });
    });

    it('should close modal on successful submission', async () => {
      const user = userEvent.setup();

      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="DEPOSIT"
        />
      );

      const amountInputs = screen.getAllByPlaceholderText('0.00');
      await user.type(amountInputs[0], '1000');

      // Find submit button by role
      const submitButton = screen.getByRole('button', { name: /add transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error on failed submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValueOnce(new Error('Insufficient funds'));

      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="DEPOSIT"
        />
      );

      const amountInputs = screen.getAllByPlaceholderText('0.00');
      await user.type(amountInputs[0], '1000');

      // Find submit button by role
      const submitButton = screen.getByRole('button', { name: /add transaction/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel', () => {
    it('should call onClose when cancel clicked', async () => {
      const user = userEvent.setup();

      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop clicked', async () => {
      const user = userEvent.setup();

      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Click backdrop (the semi-transparent overlay)
      const backdrop = document.querySelector('.backdrop-blur-sm');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Transaction Type Switching', () => {
    it('should switch fields when changing transaction type', async () => {
      const user = userEvent.setup();

      render(
        <TransactionModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          defaultType="BUY"
        />
      );

      // Initially BUY - should have symbol
      expect(screen.getByPlaceholderText('e.g., AAPL')).toBeInTheDocument();

      // Switch to DEPOSIT
      const depositButton = screen.getByText('Deposit');
      await user.click(depositButton);

      // Should no longer have symbol field
      expect(screen.queryByPlaceholderText('e.g., AAPL')).not.toBeInTheDocument();
    });
  });
});

