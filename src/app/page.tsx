"use client";
import { useState, useEffect, useMemo } from "react";
import { Pairing, parsePDF } from "./parser";
import PairingTable from "./PairingTable";

interface PairingWithMetadata extends Pairing {
  yearMonth: string;
}

export default function Home() {
  const [allPairings, setAllPairings] = useState<PairingWithMetadata[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);

  // Load saved pairings on component mount
  useEffect(() => {
    const savedPairings = localStorage.getItem('pairings');
    if (savedPairings) {
      try {
        const parsedPairings = JSON.parse(savedPairings);
        // Validate that the parsed data has the correct structure
        if (Array.isArray(parsedPairings) && parsedPairings.length > 0 && 'yearMonth' in parsedPairings[0]) {
          setAllPairings(parsedPairings);
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
      // Validate filename format (e.g., "march_yyz2025.pdf")
      const filename = file.name.toLowerCase();
      const match = filename.match(/^([a-z]+)_yyz(\d{4})\.pdf$/);
      
      if (!match) {
        alert('Invalid filename format. Expected format: month_yyzYYYY.pdf (e.g., march_yyz2025.pdf)');
        return;
      }

      const monthName = match[1];
      const year = match[2];

      // Convert month name to number (1-12)
      const monthNames = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
      ];
      const monthIndex = monthNames.indexOf(monthName);
      
      if (monthIndex === -1) {
        alert('Invalid month name in filename');
        return;
      }

      // Create yearMonth in YYYYMM format
      const yearMonth = `${year}${String(monthIndex + 1).padStart(2, '0')}`;

      setIsParsing(true);
      const parsedPairings = await parsePDF(file);
      setIsParsing(false);
      
      // Add yearMonth to each pairing
      const pairingsWithMetadata = parsedPairings.map(pairing => ({
        ...pairing,
        yearMonth
      }));
      
      setAllPairings(pairingsWithMetadata);
      setSelectedMonth(yearMonth);
      
      // Save to localStorage
      localStorage.setItem('pairings', JSON.stringify(pairingsWithMetadata));
    }
  };

  // Get unique months from all pairings
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allPairings.forEach(pairing => {
      if (pairing.yearMonth) {
        months.add(pairing.yearMonth);
      }
    });
    return Array.from(months).sort();
  }, [allPairings]);

  // Filter pairings based on selected month
  const filteredPairings = useMemo(() => {
    if (!selectedMonth) return allPairings;
    return allPairings.filter(pairing => 
      pairing.yearMonth === selectedMonth
    );
  }, [allPairings, selectedMonth]);

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
          Welcome Fauve, please upload your pairing file to get started.
        </p>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          className="mb-4"
        />
        {isParsing && <p className="text-lg">Loading...</p>}
        {!isParsing && allPairings.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-lg">
              {allPairings.length} Pairings loaded successfully!
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="month-select" className="text-lg">Select Month:</label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-2 border rounded"
              >
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {formatMonthDisplay(month)}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-lg">
              Showing {filteredPairings.length} pairings for {formatMonthDisplay(selectedMonth)}
            </p>
          </div>
        )}
        <PairingTable data={filteredPairings} />
      </main>
    </div>
  );
}
