# Requirements Document

## Introduction

The `SimpleStockChart` component file has been accidentally overwritten with the `MarketIndicesSidebar` component code. This has broken the "Quick Price Overview" section in the Stock Dashboard, which is supposed to display a simplified price chart for the currently selected stock. This spec defines the requirements for restoring and implementing a proper `SimpleStockChart` component that provides a lightweight, at-a-glance price visualization as an alternative to the more complex `AdvancedStockChart`.

## Glossary

- **Simple_Stock_Chart**: A React component that displays a basic price chart with key metrics for a selected stock
- **Price_Data**: Historical stock price information including open, high, low, close, and volume (OHLCV format)
- **Technical_Analysis_Result**: Analysis data containing technical indicators and signals for a stock
- **Quick_Price_Overview**: A collapsible dashboard section that contains the Simple_Stock_Chart component
- **Key_Metrics**: Essential stock statistics including current price, daily change, high, low, and volume

## Requirements

### Requirement 1: Component Interface Compatibility

**User Story:** As a developer, I want the SimpleStockChart component to accept the same props as expected by the StockDashboard, so that it integrates seamlessly without code changes to the parent component.

#### Acceptance Criteria

1. THE Simple_Stock_Chart SHALL accept a `symbol` prop of type string representing the stock ticker
2. THE Simple_Stock_Chart SHALL accept a `priceData` prop of type PriceData array containing historical price data
3. THE Simple_Stock_Chart SHALL accept an optional `analysis` prop of type TechnicalAnalysisResult
4. WHEN priceData is undefined or null, THE Simple_Stock_Chart SHALL handle it gracefully without crashing

### Requirement 2: Price Chart Visualization

**User Story:** As a user, I want to see a simple price chart for the selected stock, so that I can quickly understand the price trend without complex technical details.

#### Acceptance Criteria

1. WHEN priceData contains valid data, THE Simple_Stock_Chart SHALL display an area chart showing closing prices over time
2. THE Simple_Stock_Chart SHALL use a responsive container that adapts to the parent container width
3. THE Simple_Stock_Chart SHALL display the X-axis with formatted date labels
4. THE Simple_Stock_Chart SHALL display the Y-axis with price values
5. WHEN the user hovers over the chart, THE Simple_Stock_Chart SHALL display a tooltip with the date and price

### Requirement 3: Key Metrics Display

**User Story:** As a user, I want to see key price metrics at a glance, so that I can quickly assess the stock's current status.

#### Acceptance Criteria

1. THE Simple_Stock_Chart SHALL display the current price prominently
2. THE Simple_Stock_Chart SHALL display the price change (absolute and percentage) from the first data point
3. WHEN the price change is positive, THE Simple_Stock_Chart SHALL display it in green
4. WHEN the price change is negative, THE Simple_Stock_Chart SHALL display it in red
5. THE Simple_Stock_Chart SHALL display the daily high and low prices
6. THE Simple_Stock_Chart SHALL display the trading volume formatted in a readable way (e.g., "1.5M")

### Requirement 4: Empty State Handling

**User Story:** As a user, I want to see a helpful message when no stock is selected or no data is available, so that I understand why the chart is empty.

#### Acceptance Criteria

1. WHEN priceData is empty or undefined, THE Simple_Stock_Chart SHALL display an empty state message
2. WHEN symbol is empty, THE Simple_Stock_Chart SHALL display a message prompting the user to select a stock
3. THE Simple_Stock_Chart SHALL NOT crash or throw errors when receiving invalid or missing data

### Requirement 5: Visual Design Consistency

**User Story:** As a user, I want the SimpleStockChart to match the visual style of the rest of the dashboard, so that the interface feels cohesive.

#### Acceptance Criteria

1. THE Simple_Stock_Chart SHALL support dark mode using Tailwind CSS dark: variants
2. THE Simple_Stock_Chart SHALL use consistent color schemes with the AdvancedStockChart (blue for price line/area)
3. THE Simple_Stock_Chart SHALL use appropriate spacing and typography consistent with other dashboard components
4. THE Simple_Stock_Chart SHALL have a minimum height to prevent layout shifts

### Requirement 6: Lightweight Implementation

**User Story:** As a user, I want the Quick Price Overview to load quickly and not duplicate the complexity of the Advanced Chart, so that I have a fast, simple alternative view.

#### Acceptance Criteria

1. THE Simple_Stock_Chart SHALL NOT include time range selectors (uses all provided data)
2. THE Simple_Stock_Chart SHALL NOT include chart type toggles (always shows area chart)
3. THE Simple_Stock_Chart SHALL NOT include technical indicator overlays
4. THE Simple_Stock_Chart SHALL render without additional API calls (uses provided priceData prop)
