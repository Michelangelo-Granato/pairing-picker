import Navbar from "./components/Navbar";
import PairingManager from "./components/PairingManager";

// Route segment configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:max-w-[1536px] py-4 sm:py-8">
        <PairingManager />
      </div>
    </div>
  );
}
