"use server";
import pdf from "pdf-parse";
interface Flight {
  aircraft: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  dutyTime: string;
  hasLayover: boolean;
  layover: string | null;
}

export interface Pairing {
  pairingNumber: string;
  operatingDates: string;
  flights: Flight[];
  layovers: string[];
  blockTime: string;
  tafb: string;
  totalAllowance: string;
}

async function parsePDF(file: File): Promise<Pairing[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const dataBuffer = Buffer.from(arrayBuffer);
    const data = await pdf(dataBuffer);
    const lines = data.text.split("\n");
    const result = parsePairingFile(lines);
    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
}

function parsePairingFile(lines: string[]): Pairing[] {
  const pairings: Pairing[] = [];
  let currentPairing: Pairing = {
    pairingNumber: "",
    operatingDates: "",
    flights: [],
    blockTime: "",
    tafb: "",
    totalAllowance: "",
    layovers: [],
  };
  const cleanedLines = lines.filter((line) => line.length > 0);

  let i = 0;
  for (const line of cleanedLines) {
    if (i <= 3) {
      i++;
      continue;
    }
    // if (i < 100) {
    //   console.log(`line: ${i}`);
    //   console.log(line);
    // }
    i++;

    const endOfPairingMatch = line.startsWith("=");
    if (endOfPairingMatch) {
      //console.log(currentPairing);
      pairings.push(currentPairing);
      currentPairing = {
        pairingNumber: "",
        operatingDates: "",
        flights: [],
        blockTime: "",
        tafb: "",
        totalAllowance: "",
        layovers: [],
      };
      continue;
    }

    const flightMatch = line.match(
      /(\d+)\s+(\w+)\s+(\d+)\s+(\w{3})\s(\d{4})\s+(\w{3})\s(\d{4})\s+(\d+)(?:\s+(\d+))?(?:\s+(\d+))?/
    );
    console.log(flightMatch);
    if (flightMatch) {
      if (flightMatch[10]) {
      }
      currentPairing.flights.push({
        aircraft: flightMatch[2],
        flightNumber: flightMatch[3],
        departure: flightMatch[4],
        departureTime: flightMatch[5],
        arrival: flightMatch[6],
        arrivalTime: flightMatch[7],
        duration: flightMatch[8],
        dutyTime: flightMatch[9],
        hasLayover: !!flightMatch[10],
        layover: flightMatch[10] ? flightMatch[10] : null,
      });
      continue;
    }

    const layoverMatch = line.match(/\s{2,}(\w+(?:\s\w+)*)\s{2,}/);
    if (layoverMatch) {
      currentPairing.layovers.push(layoverMatch[1].trim());
      currentPairing.flights[currentPairing.flights.length - 1].layover =
        currentPairing.layovers.length - 1;
      continue;
    }

    if (line.includes("BLOCK/H-VOL")) {
      const blockTimeMatch = line.match(/BLOCK\/H-VOL\s+(\d+)/);
      if (blockTimeMatch) currentPairing.blockTime = blockTimeMatch[1];
    }

    if (line.includes("TAFB/PTEB")) {
      const tafbMatch = line.match(/TAFB\/PTEB\s+(\d+)/);
      if (tafbMatch) currentPairing.tafb = tafbMatch[1];
    }

    if (line.includes("TOTAL ALLOWANCE")) {
      const allowanceMatch = line.match(/TOTAL ALLOWANCE -\$\s+(\d+.\d+)/);
      if (allowanceMatch) currentPairing.totalAllowance = allowanceMatch[1];
    }
  }

  return pairings;
}

export { parsePDF };
