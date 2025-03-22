'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-white hover:text-gray-300">
          Pairing Picker
        </Link>
        <div className="flex gap-4">
          <Link 
            href="/"
            className={`px-4 py-2 rounded ${
              pathname === '/' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Table View
          </Link>
          <Link 
            href="/calendar"
            className={`px-4 py-2 rounded ${
              pathname === '/calendar' 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Calendar View
          </Link>
        </div>
      </div>
    </nav>
  );
} 