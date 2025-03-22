"use client";
import { useState, useEffect, useMemo } from "react";
import { Pairing } from "../parser";
import CalendarView from '../CalendarView';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useLocalStorage } from "../hooks/useLocalStorage";

interface PairingList {
  yearMonth: string;
  pairings: Pairing[];
}

export default function CalendarPage() {
  const [pairingLists, setPairingLists] = useState<PairingList[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [selectedPairingNumbers] = useLocalStorage<Set<string>>('selectedPairings', new Set());
  const [favoritePairings] = useLocalStorage<Set<string>>('favoritePairings', new Set());

  // Load saved pairings on component mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        if (typeof window !== 'undefined') {
          const savedPairings = window.localStorage.getItem('pairings');
          if (savedPairings) {
            const parsedPairings = JSON.parse(savedPairings);
            if (Array.isArray(parsedPairings) && parsedPairings.length > 0 && 'yearMonth' in parsedPairings[0] && 'pairings' in parsedPairings[0]) {
              setPairingLists(parsedPairings);
              setSelectedMonth(parsedPairings[0].yearMonth);
            } else {
              window.localStorage.removeItem('pairings');
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('pairings');
        }
      } finally {
        setIsLoadingSaved(false);
      }
    };

    loadSavedData();
  }, []);

  // Get the currently selected pairing list
  const selectedPairingList = useMemo(() => {
    return pairingLists.find(list => list.yearMonth === selectedMonth);
  }, [pairingLists, selectedMonth]);

  // Format the month display (e.g., "202503" -> "March 2025")
  const formatMonthDisplay = (yearMonth: string | undefined) => {
    if (!yearMonth || yearMonth.length !== 6) return 'Invalid Month';
    
    try {
      const year = yearMonth.substring(0, 4);
      const month = parseInt(yearMonth.substring(4, 6));
      
      if (isNaN(month) || month < 1 || month > 12) {
        return 'Invalid Month';
      }

      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return `${monthNames[month - 1]} ${year}`;
    } catch (error) {
      console.error('Error formatting month:', error);
      return 'Invalid Month';
    }
  };

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const year = parseInt(selectedMonth.substring(0, 4));
    const month = parseInt(selectedMonth.substring(4, 6));
    
    let newYear = year;
    let newMonth = month;
    
    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }
    
    setSelectedMonth(`${newYear}${String(newMonth).padStart(2, '0')}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto p-8">
        <main className="flex flex-col gap-[32px] items-center sm:items-start">
          <h1 className="text-2xl font-bold">Calendar View</h1>
          {isLoadingSaved ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-lg">Loading saved pairings...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              {pairingLists.length > 0 ? (
                <>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2 border rounded hover:bg-gray-700"
                      >
                        ←
                      </button>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="p-2 border rounded"
                      >
                        {pairingLists.map(list => (
                          <option key={list.yearMonth} value={list.yearMonth}>
                            {formatMonthDisplay(list.yearMonth)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => navigateMonth('next')}
                        className="p-2 border rounded hover:bg-gray-700"
                      >
                        →
                      </button>
                    </div>
                    {selectedPairingList && (
                      <p className="text-lg">
                        Showing {selectedPairingList.pairings.length} pairings for {formatMonthDisplay(selectedPairingList.yearMonth)}
                        {favoritePairings.size > 0 && (
                          <span className="ml-2 text-yellow-400">
                            ({favoritePairings.size} favorites)
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="w-full">
                    <CalendarView
                      pairings={selectedPairingList?.pairings || []}
                      selectedMonth={selectedMonth}
                      selectedPairingNumbers={selectedPairingNumbers}
                      favoritePairings={favoritePairings}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-lg mb-4">No pairings found. Please upload a pairing file in the table view first.</p>
                  <Link 
                    href="/"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Go to Table View
                  </Link>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
} 