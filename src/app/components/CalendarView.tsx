import React, { useMemo, useCallback } from 'react';
import { Pairing } from '../types';

interface CalendarViewProps {
  pairings: Pairing[];
  selectedMonth: string; // Format: YYYYMM
  selectedPairingNumbers: Set<string>; // Set of selected pairing numbers
  favoritePairings: Set<string>; // Set of favorite pairing numbers
}

// Generate a unique color based on a string
const generateColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with fixed saturation and lightness for better visibility
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 45%)`;
};

const CalendarView: React.FC<CalendarViewProps> = ({ 
  pairings, 
  selectedMonth,
  selectedPairingNumbers,
  favoritePairings
}) => {
  // Wrap parseDate in useCallback to prevent recreation on every render
  const parseDate = useCallback((dateStr: string): Date => {
    const monthMap: { [key: string]: number } = {
      'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
      'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
    };
    
    // Handle date format like "15APR 2025"
    const day = parseInt(dateStr.substring(0, 2));
    const month = monthMap[dateStr.substring(2, 5)];
    const year = parseInt(dateStr.substring(6));
    
    return new Date(year, month, day);
  }, []);

  // Get the first day of the month and total days
  const { firstDay, totalDays, monthName, year } = useMemo(() => {
    const year = parseInt(selectedMonth.substring(0, 4));
    const month = parseInt(selectedMonth.substring(4, 6)) - 1; // 0-based month
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return { firstDay, totalDays, monthName: monthNames[month], year };
  }, [selectedMonth]);

  // Group pairings by date
  const pairingsByDate = useMemo(() => {
    const map = new Map<string, Pairing[]>();
    
    // Get all pairings to display (either selected or favorites)
    const pairingsToDisplay = selectedPairingNumbers.size > 0
      ? pairings.filter(p => selectedPairingNumbers.has(p.pairingNumber))
      : pairings.filter(p => favoritePairings.has(p.pairingNumber));

    pairingsToDisplay.forEach(pairing => {
      const [startDate, endDate] = pairing.operatingDates.split(' - ');
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateKey = currentDate.toISOString().split('T')[0];
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)?.push(pairing);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return map;
  }, [pairings, selectedPairingNumbers, favoritePairings, parseDate]);

  // Generate color mapping for pairing numbers
  const pairingColors = useMemo(() => {
    const colors = new Map<string, string>();
    const pairingsToDisplay = selectedPairingNumbers.size > 0
      ? pairings.filter(p => selectedPairingNumbers.has(p.pairingNumber))
      : pairings.filter(p => favoritePairings.has(p.pairingNumber));
    
    pairingsToDisplay.forEach(pairing => {
      if (!colors.has(pairing.pairingNumber)) {
        colors.set(pairing.pairingNumber, generateColor(pairing.pairingNumber));
      }
    });
    return colors;
  }, [pairings, selectedPairingNumbers, favoritePairings]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    const totalCells = Math.ceil((firstDay + totalDays) / 7) * 7;
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, pairings: [] });
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(parseInt(selectedMonth.substring(0, 4)), 
                          parseInt(selectedMonth.substring(4, 6)) - 1, 
                          day);
      const dateKey = date.toISOString().split('T')[0];
      days.push({
        date,
        pairings: pairingsByDate.get(dateKey) || []
      });
    }
    
    // Add empty cells to complete the last week
    while (days.length < totalCells) {
      days.push({ date: null, pairings: [] });
    }
    
    return days;
  }, [firstDay, totalDays, selectedMonth, pairingsByDate]);

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 text-center">{monthName} {year}</h2>
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold p-2 bg-gray-600 rounded">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`min-h-[100px] p-2 rounded ${
              day.date ? 'bg-gray-600' : 'bg-gray-800'
            }`}
          >
            {day.date && (
              <>
                <div className="font-semibold mb-1">{day.date.getDate()}</div>
                <div className="space-y-1">
                  {day.pairings.map((pairing, idx) => (
                    <div
                      key={idx}
                      className="text-xs rounded p-1 truncate text-white"
                      style={{ backgroundColor: pairingColors.get(pairing.pairingNumber) }}
                      title={`${pairing.pairingNumber}: ${pairing.flights.map(f => 
                        `${f.departure}-${f.arrival}`
                      ).join(', ')}`}
                    >
                      {pairing.pairingNumber}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(CalendarView); 