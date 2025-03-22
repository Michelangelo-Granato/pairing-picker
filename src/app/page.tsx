"use client";
import { useState, useEffect, useMemo } from "react";
import { Pairing } from "./parser";
import PairingTable from "./PairingTable";
import Navbar from "./components/Navbar";
import { useLocalStorage } from "./hooks/useLocalStorage";

interface PairingList {
  yearMonth: string;
  pairings: Pairing[];
}

export default function Home() {
  const [pairingLists, setPairingLists] = useState<PairingList[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isParsing, setIsParsing] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [selectedPairingNumbers, setSelectedPairingNumbers] = useLocalStorage<Set<string>>('selectedPairings', new Set());

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

    loadSavedPairings();
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto p-8">
        <main className="flex flex-col gap-[32px] items-center sm:items-start">
          <h1 className="text-2xl font-bold">Table View</h1>
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
                      <label htmlFor="month-select" className="text-lg">Select Month:</label>
                      <select
                        id="month-select"
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
                    </div>
                    {selectedPairingList && (
                      <p className="text-lg">
                        Showing {selectedPairingList.pairings.length} pairings for {formatMonthDisplay(selectedPairingList.yearMonth)}
                      </p>
                    )}
                  </div>

                  <div className="w-full">
                    <PairingTable
                      data={selectedPairingList?.pairings || []}
                      selectedPairingNumbers={selectedPairingNumbers}
                      onSelectionChange={setSelectedPairingNumbers}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-lg mb-4">No pairings found. Please upload a pairing file.</p>
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
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setIsParsing(true);
                          try {
                            const { parsePDF } = await import('./parser');
                            const pairings = await parsePDF(file);
                            
                            // Extract month and year from filename (e.g., "202503.pdf")
                            const filename = file.name;
                            const yearMonth = filename.split('.')[0];
                            
                            const newPairingList = {
                              yearMonth,
                              pairings
                            };
                            
                            setPairingLists(prev => [...prev, newPairingList]);
                            setSelectedMonth(yearMonth);
                            
                            // Save to localStorage
                            const savedPairings = localStorage.getItem('pairings');
                            const parsedPairings = savedPairings ? JSON.parse(savedPairings) : [];
                            localStorage.setItem('pairings', JSON.stringify([...parsedPairings, newPairingList]));
                          } catch (error) {
                            console.error('Error parsing PDF:', error);
                            alert('Error parsing PDF file. Please try again.');
                          } finally {
                            setIsParsing(false);
                          }
                        }}
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
      </div>
    </div>
  );
}
