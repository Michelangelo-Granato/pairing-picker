import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PairingTableRow from './PairingTableRow';
import { Pairing } from '../types';

describe('PairingTableRow', () => {
  const mockPairing: Pairing = {
    pairingNumber: "T5001",
    operatingDates: "15APR - 25APR",
    flights: [],
    blockTime: "1000",
    tafb: "1300",
    totalAllowance: "80.00",
    layovers: 0
  };

  const mockProps = {
    data: {
      items: [mockPairing],
      visibleHeaders: [
        { key: 'pairingNumber' as keyof Pairing, label: 'Pairing Number' },
        { key: 'blockTime' as keyof Pairing, label: 'Block Time' }
      ],
      formatCellValue: (key: keyof Pairing, value: string) => value,
      handleRowClick: jest.fn(),
      toggleFavorite: jest.fn(),
      selectedPairingNumbers: new Set<string>(),
      favoritePairings: new Set<string>()
    },
    index: 0,
    style: { height: 100, width: '100%' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PairingTableRow {...mockProps} />);
    expect(screen.getByText('T5001')).toBeInTheDocument();
  });

  it('renders pairing information correctly', () => {
    render(<PairingTableRow {...mockProps} />);
    expect(screen.getByText('T5001')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('applies selected styling when pairing is selected', () => {
    const selectedProps = {
      ...mockProps,
      data: {
        ...mockProps.data,
        selectedPairingNumbers: new Set(['T5001'])
      }
    };
    const { container } = render(<PairingTableRow {...selectedProps} />);
    expect(container.firstChild).toHaveClass('bg-blue-800');
  });

  it('applies favorite styling when pairing is favorited', () => {
    const favoritedProps = {
      ...mockProps,
      data: {
        ...mockProps.data,
        favoritePairings: new Set(['T5001'])
      }
    };
    render(<PairingTableRow {...favoritedProps} />);
    const favoriteButton = screen.getByText('★');
    expect(favoriteButton).toHaveClass('text-yellow-400');
  });

  it('calls handleRowClick when row is clicked', () => {
    render(<PairingTableRow {...mockProps} />);
    fireEvent.click(screen.getByText('T5001'));
    expect(mockProps.data.handleRowClick).toHaveBeenCalledWith('T5001');
  });

  it('calls toggleFavorite when favorite button is clicked', () => {
    render(<PairingTableRow {...mockProps} />);
    const favoriteButton = screen.getByText('★');
    fireEvent.click(favoriteButton);
    expect(mockProps.data.toggleFavorite).toHaveBeenCalled();
  });

  it('prevents row click when favorite button is clicked', () => {
    render(<PairingTableRow {...mockProps} />);
    const favoriteButton = screen.getByText('★');
    fireEvent.click(favoriteButton);
    expect(mockProps.data.handleRowClick).not.toHaveBeenCalled();
  });

  it('renders all visible headers', () => {
    render(<PairingTableRow {...mockProps} />);
    mockProps.data.visibleHeaders.forEach(header => {
      const value = String(mockPairing[header.key]);
      expect(screen.getByText(value)).toBeInTheDocument();
    });
  });
}); 