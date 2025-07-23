'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              start.gg Analytics
            </Link>
            <div className="flex space-x-6">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/'
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Match History
              </Link>
              <Link
                href="/head-to-head"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/head-to-head'
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Head-to-Head
              </Link>
              <Link
                href="/tournaments"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/tournaments'
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tournaments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}