interface Airport {
  iata: string;
  city: string;
  name: string;
}

declare module "*.json" {
  const value: Airport[];
  export default value;
} 