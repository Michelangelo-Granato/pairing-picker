"use server";
import pdf from "pdf-parse";

// Cache for parsed PDFs
const pdfCache = new Map<string, Promise<Pairing[]>>();

export interface Flight {
  aircraft: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  flightTime: string;
  dutyTime: string;
  hasLayover: boolean;
  layover: Layover | null;
  daysOfWeek: number[];  // Array of days (1=Monday, 7=Sunday)
}

interface Layover {
  hotel: string;
  duration: string;
}

export interface Pairing {
  pairingNumber: string;
  operatingDates: string;
  flights: Flight[];
  layovers: number;
  blockTime: string;
  tafb: string;
  totalAllowance: string;
}

// Pre-compile regex patterns for better performance
const OPERATING_DATE_REGEX = /\w{5}\s+-\s+\w{5}/;
const PAIRING_NUMBER_REGEX = /T\d+/;
const BLOCK_TIME_REGEX = /BLOCK\/H-VOL\s+(\d+)/;
const ALLOWANCE_REGEX = /TOTAL ALLOWANCE -\$\s+(\d+.\d+)/;
const TAFB_REGEX = /TAFB\/PTEB\s+(\d+)/;
const TOTAL_FLIGHT_TIME_REGEX = /TOTAL -\s+(\d+)/;
const FLIGHT_REGEX = /(\d+)\s+(\w+)\s+(\d+)\s+(\w{3})\s(\d{4})\s+(\w{3})\s(\d{4})\s+(\d+)(?:\s+(\d+))?(?:\s+(\d+))?/;
const LAYOVER_REGEX = /\s{2,}(\w+(?:\s\w+)*)\s{2,}/;

function getBasePairing(): Pairing {
  return {
    pairingNumber: "",
    operatingDates: "",
    flights: [],
    blockTime: "",
    tafb: "",
    totalAllowance: "",
    layovers: 0,
  };
}

function parseFirstLine(line: string, currentPairing: Pairing) {
  return parseOperatingDate(line, currentPairing) && parsePairingNumber(line, currentPairing)
}

function parseOperatingDate(line: string, pairing: Pairing): boolean {
  if (pairing.operatingDates) return false;

  if (line.includes("OPERATES/OPER-")) {
    const operatingDateMatch = OPERATING_DATE_REGEX.exec(line);
    if (operatingDateMatch) {
      pairing.operatingDates = operatingDateMatch[0];
      return true;
    }
  }

  return false;
}

function parsePairingNumber(line: string, pairing: Pairing): boolean {
  if (pairing.pairingNumber) return false;

  if (line.includes("OPERATES/OPER-")) {
    const pairingNumberMatch = PAIRING_NUMBER_REGEX.exec(line);
    if (pairingNumberMatch) {
      pairing.pairingNumber = pairingNumberMatch[0];
      return true;
    }
  }

  return false;
}

function parseSecondLine(line: string, currentPairing: Pairing) {
  return parseBlockTime(line, currentPairing) && parseTotalAllowance(line, currentPairing)
 }

function parseBlockTime(line: string, pairing: Pairing): boolean {
  if (pairing.blockTime) return false;

  if (line.includes("BLOCK/H-VOL")) {
    const blockTimeMatch = BLOCK_TIME_REGEX.exec(line);
    if (blockTimeMatch) {
      pairing.blockTime = blockTimeMatch[1];
      return true;
    }
  }
  return false;
}

function parseThirdLine(line: string, currentPairing: Pairing) {
  return parseTAFB(line, currentPairing) && parseTotalFlightTime(line, currentPairing)
 }

function parseTotalAllowance(line: string, pairing: Pairing): boolean {
  if (pairing.totalAllowance) return false;

  if (line.includes("TOTAL ALLOWANCE")) {
    const allowanceMatch = ALLOWANCE_REGEX.exec(line);
    if (allowanceMatch) {
      pairing.totalAllowance = allowanceMatch[1];
      return true;
    }
  }
  return false;
}

function parseTAFB(line: string, pairing: Pairing): boolean {
  if (pairing.tafb) return false;

  if (line.includes("TAFB/PTEB")) {
    const tafbMatch = TAFB_REGEX.exec(line);
    if (tafbMatch) {
      pairing.tafb = tafbMatch[1];
      return true;
    }
  }
  return false;
}

function parseTotalFlightTime(line: string, pairing: Pairing): boolean {
  if (pairing.totalAllowance) return false;

  if (line.includes("TOTAL -")) {
    const totalFlightTimeMatch = TOTAL_FLIGHT_TIME_REGEX.exec(line);
    if (totalFlightTimeMatch) {
      pairing.totalAllowance = totalFlightTimeMatch[1];
      return true;
    }
  }
  return false;
}

function parseFlight(line: string, pairing: Pairing): boolean {
  const flightMatch = FLIGHT_REGEX.exec(line);
  if (flightMatch) {
    if (flightMatch[10]) {
      pairing.layovers++;
    }

    // Parse days of week into array of numbers
    const daysStr = flightMatch[1];
    const daysOfWeek = daysStr.split('').map(Number);

    pairing.flights.push({
      aircraft: flightMatch[2],
      flightNumber: flightMatch[3],
      departure: flightMatch[4],
      departureTime: flightMatch[5],
      arrival: flightMatch[6],
      arrivalTime: flightMatch[7],
      flightTime: flightMatch[8],
      dutyTime: flightMatch[9],
      hasLayover: !!flightMatch[10],
      layover: flightMatch[10]
        ? { hotel: "", duration: flightMatch[10] }
        : null,
      daysOfWeek
    });
    return true;
  }
  return false;
}

function parseLayover(line: string, pairing: Pairing): boolean {
  const layoverMatch = LAYOVER_REGEX.exec(line);
  if (layoverMatch) {
    const lastFlight = pairing.flights[pairing.flights.length - 1];
    if (lastFlight?.layover) {
      lastFlight.layover.hotel = layoverMatch[1].trim();
    }
    return true;
  }
  return false;
}

function parsePairingFile(lines: string[], numPairings?: number): Pairing[] {
  const pairings: Pairing[] = [];
  let currentPairing: Pairing = getBasePairing();
  const cleanedLines = lines.filter((line) => line.length > 0);

  // Skip header lines
  cleanedLines.splice(0, 3);

  for (const line of cleanedLines) {
    if (numPairings && pairings.length === numPairings) {
      return pairings;
    }

    const endOfPairingMatch = line.startsWith("=");
    if (endOfPairingMatch) {
      pairings.push(currentPairing);
      currentPairing = getBasePairing();
      continue;
    }

    // Try to parse each field in order of most common occurrence
    if (parseFirstLine(line, currentPairing)) continue;
    if (parseFlight(line, currentPairing)) continue;
    if (parseSecondLine(line, currentPairing)) continue;
    if (parseThirdLine(line, currentPairing)) continue;
    if (parseLayover(line, currentPairing)) continue;
  }

  return pairings;
}

async function parsePDF(file: File, numPairings?: number): Promise<Pairing[]> {
  try {
    // Create a cache key based on file name and size
    const cacheKey = `${file.name}-${file.size}`;
    
    // Check if we have a cached result
    if (pdfCache.has(cacheKey)) {
      return pdfCache.get(cacheKey)!;
    }

    // Create a new promise for parsing
    const parsePromise = (async () => {
      const arrayBuffer = await file.arrayBuffer();
      const dataBuffer = Buffer.from(arrayBuffer);
      const data = await pdf(dataBuffer);
      const lines = data.text.split("\n");
      return parsePairingFile(lines, numPairings);
    })();

    // Cache the promise
    pdfCache.set(cacheKey, parsePromise);

    // Return the result
    return await parsePromise;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export { parsePDF };
