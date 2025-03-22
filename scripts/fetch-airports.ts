import fs from 'fs';
import path from 'path';

interface AirportData {
  iata_code: string;
  city: string;
  name: string;
}

interface SimplifiedAirport {
  iata: string;
  city: string;
  name: string;
}

async function fetchAirports() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/algolia/datasets/master/airports/airports.json");
    const airports = await res.json() as AirportData[];
    
    // Create a simplified version with just what we need
    const simplifiedAirports: SimplifiedAirport[] = airports.map(airport => ({
      iata: airport.iata_code,
      city: airport.city,
      name: airport.name
    }));

    // Save to src/data/airports.json
    const outputPath = path.join(process.cwd(), 'src', 'data', 'airports.json');
    fs.writeFileSync(outputPath, JSON.stringify(simplifiedAirports, null, 2));
    
    console.log(`Successfully saved ${simplifiedAirports.length} airports to ${outputPath}`);
  } catch (error) {
    console.error('Error fetching airports:', error);
    process.exit(1);
  }
}

fetchAirports(); 