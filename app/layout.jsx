'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Search, Home, Plus, User } from 'lucide-react';
import './globals.css';

export default function RootLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Unshelf - Academic Resource Exchange</title>
      </head>
      <body className="bg-light">
        {/* Desktop Navbar */}
        <nav className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary">
              Unshelf
            </Link>
            
            <div className="flex-1 mx-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search textbooks, notes, materials..."
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:bg-white"
                />
                <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="flex gap-3 items-center">
              {isLoggedIn ? (
                <>
                  <Link href="/create-listing" className="btn-primary">
                    Sell Item
                  </Link>
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                        A
                      </div>
                    </button>
                    <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg p-3 z-50">
                      <p className="text-sm font-medium mb-1">Alan K Albin</p>
                      <p className="text-xs text-gray-600 mb-3 flex items-center gap-1">
                        <span className="w-2 h-2 bg-accent rounded-full"></span>
                        Verified Student
                      </p>
                      <Link href="/my-listings" className="block text-sm text-primary hover:bg-gray-100 px-2 py-1 rounded mb-1">
                        My Listings
                      </Link>
                      <button onClick={() => setIsLoggedIn(false)} className="w-full text-left text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded">
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <Link href="/login" className="btn-primary">
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-50 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="text-xl font-bold text-primary">
              Unshelf
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b p-4 space-y-2">
            <Link href="/" className="block py-2 text-primary font-medium">
              Home
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/create-listing" className="block py-2 text-primary font-medium">
                  Create Listing
                </Link>
                <Link href="/my-listings" className="block py-2 text-primary font-medium">
                  My Listings
                </Link>
                <button onClick={() => setIsLoggedIn(false)} className="block w-full text-left py-2 text-red-600 font-medium">
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="block py-2 text-primary font-medium">
                Login
              </Link>
            )}
          </div>
        )}

        {/* Main Content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-0">
          <div className="flex justify-around">
            <Link href="/" className="flex-1 flex flex-col items-center justify-center py-3 text-primary">
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link href="/search" className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600">
              <Search className="w-6 h-6" />
              <span className="text-xs mt-1">Search</span>
            </Link>
            {isLoggedIn && (
              <Link href="/create-listing" className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600">
                <Plus className="w-6 h-6" />
                <span className="text-xs mt-1">Sell</span>
              </Link>
            )}
            <Link href={isLoggedIn ? "/profile" : "/login"} className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600">
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </nav>

        {/* Padding for mobile bottom nav */}
        <div className="md:hidden h-16"></div>
      </body>
    </html>
  );
}
