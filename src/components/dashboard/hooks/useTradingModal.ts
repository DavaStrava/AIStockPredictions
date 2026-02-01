/**
 * useTradingModal Hook
 *
 * Manages trade entry modal state and trade submission.
 * Integrates with usePortfolioStats for trade creation.
 */

import { useState, useCallback } from 'react';
import { CreateTradeRequest } from '@/types/models';
import { usePortfolioStats } from '@/components/trading-journal/hooks/usePortfolioStats';

export interface UseTradingModalReturn {
  /** Whether the trade modal is currently open */
  isTradeModalOpen: boolean;
  /** Symbol prefilled in the modal */
  tradeModalSymbol: string | undefined;
  /** Prediction ID prefilled in the modal */
  tradeModalPredictionId: string | undefined;
  /** Opens the trade modal with optional prefilled data */
  openTradeModal: (symbol: string, predictionId?: string) => void;
  /** Closes the trade modal and clears prefilled data */
  closeTradeModal: () => void;
  /** Handles trade submission from the modal */
  handleTradeSubmit: (data: Omit<CreateTradeRequest, 'userId'>) => Promise<void>;
}

/**
 * Custom hook for managing trade entry modal state.
 */
export function useTradingModal(): UseTradingModalReturn {
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeModalSymbol, setTradeModalSymbol] = useState<string | undefined>();
  const [tradeModalPredictionId, setTradeModalPredictionId] = useState<string | undefined>();

  const { createTrade } = usePortfolioStats();

  /**
   * Opens the trade entry modal with prefilled symbol and prediction ID.
   */
  const openTradeModal = useCallback((symbol: string, predictionId?: string) => {
    setTradeModalSymbol(symbol);
    setTradeModalPredictionId(predictionId);
    setIsTradeModalOpen(true);
  }, []);

  /**
   * Closes the trade entry modal and clears prefilled data.
   */
  const closeTradeModal = useCallback(() => {
    setIsTradeModalOpen(false);
    setTradeModalSymbol(undefined);
    setTradeModalPredictionId(undefined);
  }, []);

  /**
   * Handles trade submission from the modal.
   */
  const handleTradeSubmit = useCallback(async (data: Omit<CreateTradeRequest, 'userId'>) => {
    await createTrade(data);
  }, [createTrade]);

  return {
    isTradeModalOpen,
    tradeModalSymbol,
    tradeModalPredictionId,
    openTradeModal,
    closeTradeModal,
    handleTradeSubmit,
  };
}
