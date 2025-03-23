import React from 'react';
import { PairingTableRowData } from '../types';
import FlightDisplay from './FlightDisplay';

interface RowProps {
  data: PairingTableRowData;
  index: number;
  style: React.CSSProperties;
}

const Row = React.memo(({ 
  data: { 
    items, 
    visibleHeaders, 
    formatCellValue, 
    handleRowClick, 
    toggleFavorite, 
    selectedPairingNumbers,
    favoritePairings 
  }, 
  index, 
  style 
}: RowProps) => {
  const item = items[index];
  
  return (
    <div 
      style={style}
      className={`flex border-b text-center cursor-pointer hover:bg-gray-500 transition-colors ${
        selectedPairingNumbers.has(item.pairingNumber) ? 'bg-blue-800' : ''
      }`}
      onClick={() => handleRowClick(item.pairingNumber)}
    >
      <div className="p-1 w-[60px] flex-shrink-0 flex items-center justify-center h-full">
        <button
          onClick={(e) => toggleFavorite(e, item.pairingNumber)}
          className={`text-xl ${favoritePairings.has(item.pairingNumber) ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-300 transition-colors`}
        >
          ★
        </button>
      </div>
      <div className="p-1 w-[275px] flex-shrink-0 text-center">
        {item.flights.map((flight, idx) => (
          <div key={idx}>
            <FlightDisplay flight={flight} />
          </div>
        ))}
      </div>
      {visibleHeaders.map((header) => (
        <div key={header.key} className="p-1 w-[90px] flex-shrink-0 flex items-center justify-center h-full">
          {formatCellValue(header.key, String(item[header.key]))}
        </div>
      ))}
    </div>
  );
});

Row.displayName = 'PairingTableRow';

export default Row;
