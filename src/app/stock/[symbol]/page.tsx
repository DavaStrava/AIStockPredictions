/**
 * Stock Detail Page Route
 *
 * Server component entry point for individual stock pages.
 * Extracts symbol from URL params and renders StockDetailPage.
 */

import { Metadata } from 'next';
import { StockDetailPage } from '@/components/stock/StockDetailPage';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

/**
 * Generate dynamic metadata for SEO.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  return {
    title: `${upperSymbol} Stock | AI Stock Predictions`,
    description: `View real-time stock data, price charts, and key metrics for ${upperSymbol}`,
  };
}

/**
 * Stock Detail Page - displays comprehensive stock information.
 */
export default async function StockPage({ params }: PageProps) {
  const { symbol } = await params;

  return <StockDetailPage symbol={symbol.toUpperCase()} />;
}
