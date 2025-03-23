export interface Airport {
  iata: string;
  city: string;
  name?: string;
}

export interface PairingTableProps {
  data: Pairing[];
  selectedPairingNumbers: Set<string>;
  onSelectionChange: (selectedPairingNumbers: Set<string>) => void;
}

export interface PairingTableRowData {
  items: Pairing[];
  visibleHeaders: { key: keyof Pairing; label: string }[];
  formatCellValue: (key: keyof Pairing, value: string) => string;
  handleRowClick: (pairingNumber: string) => void;
  toggleFavorite: (e: React.MouseEvent, pairingNumber: string) => void;
  selectedPairingNumbers: Set<string>;
  favoritePairings: Set<string>;
}

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

export interface Layover {
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