"use client";
import { useState, useEffect, useMemo } from "react";
import { Pairing, parsePDF } from "./parser";
import PairingTable from "./PairingTable";

interface PairingList {
  yearMonth: string;
  pairings: Pairing[];
}

export default function Home() {
  const [pairingLists, setPairingLists] = useState<PairingList[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);

  // Load saved pairings on component mount
  useEffect(() => {
    const savedPairings = localStorage.getItem('pairings');
    if (savedPairings) {
      try {
        const parsedPairings = JSON.parse(savedPairings);
        // Validate that the parsed data has the correct structure
        if (Array.isArray(parsedPairings) && parsedPairings.length > 0 && 'yearMonth' in parsedPairings[0] && 'pairings' in parsedPairings[0]) {
          setPairingLists(parsedPairings);
          // Set initial selected month if there are pairings
          setSelectedMonth(parsedPairings[0].yearMonth);
        } else {
          // If the data structure is invalid, clear localStorage
          localStorage.removeItem('pairings');
        }
      } catch (error) {
        console.error('Error loading saved pairings:', error);
        localStorage.removeItem('pairings');
      }
    }
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Show loading state
      setIsParsing(true);

      const filename = file.name.toLowerCase();
      let yearMonth: string;

      // Try to match the new format (month_yyzYYYY.pdf)
      const newFormatMatch = filename.match(/^([a-z]+)_yyz(\d{4})\.pdf$/);
      if (newFormatMatch) {
        const monthName = newFormatMatch[1];
        const year = newFormatMatch[2];

        // Convert month name to number (1-12)
        const monthNames = [
          "january", "february", "march", "april", "may", "june",
          "july", "august", "september", "october", "november", "december"
        ];
        const monthIndex = monthNames.indexOf(monthName);
        
        if (monthIndex === -1) {
          alert('Invalid month name in filename');
          setIsParsing(false);
          return;
        }

        // Create yearMonth in YYYYMM format
        yearMonth = `${year}${String(monthIndex + 1).padStart(2, '0')}`;
      } 
      // Try to match the old format (YYYYMM-YYZ-PairingFile.pdf)
      else {
        const oldFormatMatch = filename.match(/^(\d{6})-yyz-pairingfile\.pdf$/);
        if (oldFormatMatch) {
          yearMonth = oldFormatMatch[1];
        } else {
          alert('Invalid filename format. Expected format:\n- month_yyzYYYY.pdf (e.g., march_yyz2025.pdf)\n- YYYYMM-YYZ-PairingFile.pdf (e.g., 202503-YYZ-PairingFile.pdf)');
          setIsParsing(false);
          return;
        }
      }

      try {
        const parsedPairings = await parsePDF(file);
        
        // Create new pairing list
        const newPairingList: PairingList = {
          yearMonth,
          pairings: parsedPairings
        };

        // Update pairing lists, replacing existing month if it exists
        setPairingLists(prevLists => {
          // Remove any existing list for this month
          const filteredLists = prevLists.filter(list => list.yearMonth !== yearMonth);
          // Add the new list and sort by month (newest first)
          const updatedLists = [...filteredLists, newPairingList].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
          
          // Save to localStorage with the updated lists
          localStorage.setItem('pairings', JSON.stringify(updatedLists));
          
          return updatedLists;
        });

        // Set the selected month to the newly uploaded one
        setSelectedMonth(yearMonth);
      } catch (error) {
        console.error('Error parsing PDF:', error);
        alert('Error parsing the PDF file. Please try again.');
      } finally {
        setIsParsing(false);
      }
    }
  };

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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-2xl font-bold">Pairing Picker</h1>
        <p className="text-lg text-center">
          Welcome, please upload your pairing file to get started.
        </p>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          className="mb-4 p-2 border rounded bg-gray-600 text-white cursor-pointer hover:bg-gray-500 transition-colors"
        />
        {isParsing && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-lg">Loading...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        {!isParsing && pairingLists.length > 0 && (
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
        )}
        {selectedPairingList && (
          <PairingTable data={selectedPairingList.pairings} />
        )}
      </main>
    </div>
  );
}
