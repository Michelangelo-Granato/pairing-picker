'use client';

import { useState, useEffect, useMemo, useTransition } from "react";
import { Pairing } from "../parser";
import PairingTable from "../PairingTable";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { parsePDFAction } from "../actions";

interface PairingList {
  yearMonth: string;
  pairings: Pairing[];
}

export default function PairingManager() {
  const [pairingLists, setPairingLists] = useState<PairingList[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isParsing, setIsParsing] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [selectedPairingNumbers, setSelectedPairingNumbers] = useLocalStorage<Set<string>>('selectedPairings', new Set());
  const [isPending, startTransition] = useTransition();

  // Load saved pairings on component mount
  useEffect(() => {
    const loadSavedPairings = async () => {
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
        console.error('Error loading saved pairings:', error);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('pairings');
        }
      } finally {
        setIsLoadingSaved(false);
      }
    };

    startTransition(() => {
      loadSavedPairings();
    });
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await parsePDFAction(formData);
      
      if (result.success && result.data) {
        const { yearMonth, pairings } = result.data;
        const newPairingList = { yearMonth, pairings };
        
        setPairingLists(prev => [...prev, newPairingList]);
        setSelectedMonth(yearMonth);
        
        // Save to localStorage
        const savedPairings = localStorage.getItem('pairings');
        const parsedPairings = savedPairings ? JSON.parse(savedPairings) : [];
        localStorage.setItem('pairings', JSON.stringify([...parsedPairings, newPairingList]));
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error parsing PDF:', error);
      alert('Error parsing PDF file. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <main className="flex flex-col gap-4 sm:gap-[32px] items-center sm:items-start">
      <h1 className="text-xl sm:text-2xl font-bold">Table View</h1>
      {isLoadingSaved || isPending ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-base sm:text-lg">Loading saved pairings...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <>
          {pairingLists.length > 0 ? (
            <>
              <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <label htmlFor="month-select" className="text-base sm:text-lg whitespace-nowrap">Select Month:</label>
                  <select
                    id="month-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="p-2 border rounded w-full sm:w-auto"
                  >
                    {pairingLists.map(list => (
                      <option key={list.yearMonth} value={list.yearMonth}>
                        {formatMonthDisplay(list.yearMonth)}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedPairingList && (
                  <p className="text-base sm:text-lg">
                    Showing {selectedPairingList.pairings.length} pairings for {formatMonthDisplay(selectedPairingList.yearMonth)}
                  </p>
                )}
              </div>

              <div className="w-full overflow-x-auto">
                <PairingTable
                  data={selectedPairingList?.pairings || []}
                  selectedPairingNumbers={selectedPairingNumbers}
                  onSelectionChange={setSelectedPairingNumbers}
                />
              </div>
            </>
          ) : (
            <div className="text-center w-full">
              <p className="text-base sm:text-lg mb-4">Welcome, Please upload a pairing file to get started.</p>
              {isParsing ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-lg">Parsing PDF...</p>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
                  >
                    Upload PDF
                  </label>
                </>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
} 