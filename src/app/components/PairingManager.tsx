'use client';

import { useState, useEffect, useMemo, useTransition } from "react";
import { Pairing } from "../types";
import PairingTable from "./PairingTable";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { parsePDFAction } from "../actions";

interface PairingList {
  yearMonth: string;
  pairings: Pairing[];
}

const MAX_STORED_MONTHS = 12; // Maximum number of months to store

export default function PairingManager() {
  const [pairingLists, setPairingLists] = useState<PairingList[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isParsing, setIsParsing] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPairingNumbers, setSelectedPairingNumbers] = useLocalStorage<Set<string>>('selectedPairings', new Set());
  const [isPending, startTransition] = useTransition();

  // Load saved pairings and data folder files on component mount
  useEffect(() => {
    const loadPairings = async () => {
      try {
        setLoadError(null);
        if (typeof window !== 'undefined') {
          // First try to load from localStorage
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

          // Then try to load from data folder
          try {
            const response = await fetch('/api/load-data-files');
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.details || errorData.error || 'Failed to load data files');
            }
            
            const files = await response.json();
            if (!Array.isArray(files)) {
              throw new Error('Invalid response format from server');
            }

            let loadedAnyFiles = false;
            const newPairingLists: PairingList[] = [];

            for (const file of files) {
              try {
                const formData = new FormData();
                formData.append('file', file.path);
                const result = await parsePDFAction(formData);
                
                if (result.success && result.data) {
                  const { yearMonth, pairings } = result.data;
                  newPairingLists.push({ yearMonth, pairings });
                  loadedAnyFiles = true;
                }
              } catch (error) {
                console.error(`Error loading file ${file.name}:`, error);
              }
            }

            if (loadedAnyFiles) {
              // Update state with all loaded pairings
              setPairingLists(prev => {
                const existingMonths = new Set(prev.map(list => list.yearMonth));
                const filteredNew = newPairingLists.filter(list => !existingMonths.has(list.yearMonth));
                const combined = [...prev, ...filteredNew]
                  .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
                  .slice(0, MAX_STORED_MONTHS);
                
                // Update localStorage
                localStorage.setItem('pairings', JSON.stringify(combined));
                
                // Set selected month to the most recent one if not already set
                if (!selectedMonth || !combined.some(list => list.yearMonth === selectedMonth)) {
                  setSelectedMonth(combined[0].yearMonth);
                }
                
                return combined;
              });
            } else if (files.length > 0) {
              setLoadError('No pairing files could be loaded from the data folder');
            }
          } catch (error) {
            console.error('Error loading data files:', error);
            setLoadError(error instanceof Error ? error.message : 'Failed to load data files');
          }
        }
      } catch (error) {
        console.error('Error loading saved pairings:', error);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('pairings');
        }
        setLoadError(error instanceof Error ? error.message : 'Failed to load saved pairings');
      } finally {
        setIsLoadingSaved(false);
      }
    };

    startTransition(() => {
      loadPairings();
    });
  }, []);

  // Get the currently selected pairing list
  const selectedPairingList = useMemo(() => {
    return pairingLists.find(list => list.yearMonth === selectedMonth);
  }, [pairingLists, selectedMonth]);

  // Format the month display (e.g., "202503" -> "March 2025")
  const formatMonthDisplay = (yearMonth: string | undefined) => {
    if (!yearMonth) return 'Invalid Month';
    
    try {
      // Handle different filename formats:
      // 1. "202504" or "202504-YYZ-PairingFile.pdf"
      // 2. "april_yyz2025.pdf"
      let yearMonthStr = yearMonth;
      
      if (yearMonth.includes('_')) {
        // Handle "april_yyz2025.pdf" format
        const [month, yearPart] = yearMonth.split('_');
        const year = yearPart.replace('yyz', '').split('.')[0];
        
        const monthMap: { [key: string]: number } = {
          'january': 1, 'february': 2, 'march': 3, 'april': 4,
          'may': 5, 'june': 6, 'july': 7, 'august': 8,
          'september': 9, 'october': 10, 'november': 11, 'december': 12
        };
        
        const monthNum = monthMap[month.toLowerCase()];
        if (!monthNum) return 'Invalid Month';
        
        yearMonthStr = `${year}${String(monthNum).padStart(2, '0')}`;
      } else {
        // Handle "202504" format
        yearMonthStr = yearMonth.split('-')[0];
      }

      if (yearMonthStr.length !== 6) return 'Invalid Month';
      
      const year = yearMonthStr.substring(0, 4);
      const month = parseInt(yearMonthStr.substring(4, 6));
      
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
        
        // Update state by replacing existing pairing with same yearMonth or adding new one
        setPairingLists(prev => {
          const filtered = prev.filter((list: PairingList) => list.yearMonth !== yearMonth);
          return [...filtered, newPairingList];
        });
        setSelectedMonth(yearMonth);
        
        try {
          // Get existing pairings
          const savedPairings = localStorage.getItem('pairings');
          const parsedPairings = savedPairings ? JSON.parse(savedPairings) : [];
          
          // Replace existing pairing with same yearMonth or add new one
          const filteredPairings = parsedPairings.filter((list: PairingList) => list.yearMonth !== yearMonth);
          const updatedPairings = [...filteredPairings, newPairingList]
            .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
            .slice(0, MAX_STORED_MONTHS); // Keep only the most recent months
          
          // Try to save to localStorage
          localStorage.setItem('pairings', JSON.stringify(updatedPairings));
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // If storage fails, try to save with reduced data
          try {
            // Keep only the most recent month
            localStorage.setItem('pairings', JSON.stringify([newPairingList]));
            // Update state to match
            setPairingLists([newPairingList]);
          } catch (retryError) {
            console.error('Failed to save even with reduced data:', retryError);
            alert('Unable to save pairing data. Please free up some storage space and try again.');
          }
        }
      } else {
        throw new Error(result.error ?? 'Unknown error');
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
      ) : loadError ? (
        <div className="flex flex-col items-center gap-2 text-red-500">
          <p className="text-base sm:text-lg">{loadError}</p>
          <p className="text-sm">Please check if the data folder exists and contains valid PDF files.</p>
        </div>
      ) : (
        <>
          {pairingLists.length > 0 ? (
            <>
              <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
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
                  {isParsing ? (
                    <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
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