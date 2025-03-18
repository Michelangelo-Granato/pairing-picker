"use server";
import pdf from "pdf-parse";
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

async function parsePDF(file: File, numPairings: number): Promise<Pairing[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const dataBuffer = Buffer.from(arrayBuffer);
    const data = await pdf(dataBuffer);
    const lines = data.text.split("\n");
    const result = parsePairingFile(lines, numPairings);
    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
}
function getBasePairing() {
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

function parsePairingFile(lines: string[], numPairings: number): Pairing[] {
  const pairings: Pairing[] = [];
  let currentPairing: Pairing = getBasePairing();
  const cleanedLines = lines.filter((line) => line.length > 0);

  cleanedLines.splice(0, 3);
  for (const line of cleanedLines) {
    if (pairings.length == numPairings) {
      return pairings;
    }

    const endOfPairingMatch = line.startsWith("=");
    if (endOfPairingMatch) {
      pairings.push(currentPairing);
      currentPairing = getBasePairing();
      continue;
    }

    if (
      parseOperatingDate(line, currentPairing) &&
      parsePairingNumber(line, currentPairing)
    )
      continue;
    if (parseFlight(line, currentPairing)) continue;
    if (
      parseBlockTime(line, currentPairing) &&
      parseTotalAllowance(line, currentPairing)
    )
      continue;
    if (
      parseTAFB(line, currentPairing) &&
      parseTotalFlightTime(line, currentPairing)
    )
      continue;
    if (parseLayover(line, currentPairing)) continue;
  }

  return pairings;
}

function parseOperatingDate(line: string, pairing: Pairing): boolean {
  if (pairing.operatingDates) return false;

  if (line.includes("OPERATES/OPER-")) {
    const operatingDateMatch = line.match(/\w{5}\s+-\s+\w{5}/);
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
    const pairingNumberMatch = line.match(/T\d+/);
    if (pairingNumberMatch) {
      pairing.pairingNumber = pairingNumberMatch[0];
      return true;
    }
  }

  return false;
}

function parseBlockTime(line: string, pairing: Pairing): boolean {
  if (pairing.blockTime) return false;

  if (line.includes("BLOCK/H-VOL")) {
    const blockTimeMatch = line.match(/BLOCK\/H-VOL\s+(\d+)/);
    if (blockTimeMatch) {
      pairing.blockTime = blockTimeMatch[1];
      return true;
    }
  }
  return false;
}

function parseTotalAllowance(line: string, pairing: Pairing): boolean {
  if (pairing.totalAllowance) return false;

  if (line.includes("TOTAL ALLOWANCE")) {
    const allowanceMatch = line.match(/TOTAL ALLOWANCE -\$\s+(\d+.\d+)/);
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
    const tafbMatch = line.match(/TAFB\/PTEB\s+(\d+)/);
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
    const totalFlightTimeMatch = line.match(/TOTAL -\s+(\d+)/);
    if (totalFlightTimeMatch) {
      pairing.totalAllowance = totalFlightTimeMatch[1];
      return true;
    }
  }
  return false;
}

function parseFlight(line: string, pairing: Pairing): boolean {
  const flightMatch = line.match(
    /(\d+)\s+(\w+)\s+(\d+)\s+(\w{3})\s(\d{4})\s+(\w{3})\s(\d{4})\s+(\d+)(?:\s+(\d+))?(?:\s+(\d+))?/
  );
  if (flightMatch) {
    if (flightMatch[10]) {
      pairing.layovers++;
    }

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
    });
    return true;
  }
  return false;
}

function parseLayover(line: string, pairing: Pairing): boolean {
  const layoverMatch = line.match(/\s{2,}(\w+(?:\s\w+)*)\s{2,}/);
  if (layoverMatch) {
    const lastFlight = pairing.flights[pairing.flights.length - 1];
    if (lastFlight?.layover) {
      lastFlight.layover.hotel = layoverMatch[1].trim();
    }
    return true;
  }
  return false;
}

export { parsePDF };
