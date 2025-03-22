declare module 'airport-codes' {
  interface Airport {
    iata?: string;
    city?: string;
  }
  
  const airports: Airport[];
  export default airports;
} 