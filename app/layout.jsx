'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  MessageCircle,
  Plus,
  User,
  LogOut,
  Menu,
  X,
  AlertCircle,
} from 'lucide-react';
import { logoutUser } from '@/lib/auth';
import SessionInitializer from '@/components/SessionInitializer';
import './globals.css';

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isHomepage = pathname === '/';

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setIsLoggedIn(true);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const success = await logoutUser();
      if (success) {
        setIsLoggedIn(false);
        setUser(null);
        setShowProfileMenu(false);
        setError(null);
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    }
  };

  const closeMenus = () => {
    setShowProfileMenu(false);
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <html lang="en">
        <body className="bg-light">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1B2A4A" />
      </head>
      <body className="bg-light">
        <SessionInitializer />

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b-2 border-red-500 px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800 font-semibold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Desktop Navigation */}
        <nav className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold"
              style={{ color: '#1B2A4A' }}
            >
              Unshelf
            </Link>

            <div className="flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition">
                Home
              </Link>

              <Link
                href="/search"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Browse
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/create-listing"
                    className="px-4 py-2 rounded-lg font-semibold text-white transition"
                    style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Sell
                  </Link>

                  <Link
                    href="/chats"
                    className="text-gray-600 hover:text-gray-900 transition relative"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold hover:shadow-lg transition"
                      style={{ background: '#27AE60' }}
                    >
                      {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </button>

                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 w-56 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold" style={{ color: '#1B2A4A' }}>
                            {user?.fullName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {user?.email}
                          </p>
                        </div>

                        <Link
                          href="/profile"
                          onClick={closeMenus}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <User className="w-4 h-4 inline mr-2" />
                          My Profile
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                        >
                          <LogOut className="w-4 h-4 inline mr-2" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg font-semibold text-white transition"
                  style={{ background: 'linear-gradient(135deg, #1877F2, #166FE5)' }}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile Navigation - Top */}
        <nav className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold" style={{ color: '#1B2A4A' }}>
              Unshelf
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="bg-gray-50 border-t border-gray-200">
              <Link
                href="/"
                onClick={closeMenus}
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-white transition"
              >
                Home
              </Link>

              <Link
                href="/search"
                onClick={closeMenus}
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-white transition"
              >
                Browse
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/create-listing"
                    onClick={closeMenus}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-white transition"
                  >
                    Create Listing
                  </Link>

                  <Link
                    href="/chats"
                    onClick={closeMenus}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-white transition"
                  >
                    Chats
                  </Link>

                  <Link
                    href="/profile"
                    onClick={closeMenus}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-white transition"
                  >
                    Profile
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout();
                      closeMenus();
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="block px-4 py-3 text-sm font-semibold transition"
                  style={{ color: '#1877F2' }}
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="pb-20 md:pb-0">{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
          <div className="flex justify-around items-center">
            {/* Home */}
            <Link
              href="/"
              className={`flex-1 flex flex-col items-center justify-center py-3 transition ${
                pathname === '/'
                  ? 'text-accent'
                  : 'text-gray-600'
              } hover:text-accent`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">Home</span>
            </Link>

            {/* Chats */}
            <Link
              href="/chats"
              className={`flex-1 flex flex-col items-center justify-center py-3 transition ${
                pathname === '/chats'
                  ? 'text-accent'
                  : 'text-gray-600'
              } hover:text-accent`}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">Chats</span>
            </Link>

            {/* Sell */}
            {isLoggedIn ? (
              <Link
                href="/create-listing"
                className={`flex-1 flex flex-col items-center justify-center py-3 transition ${
                  pathname === '/create-listing'
                    ? 'text-accent'
                    : 'text-gray-600'
                } hover:text-accent`}
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs mt-1 font-medium">Sell</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600 hover:text-accent transition"
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs mt-1 font-medium">Sell</span>
              </Link>
            )}

            {/* Account */}
            <Link
              href={isLoggedIn ? '/profile' : '/login'}
              className={`flex-1 flex flex-col items-center justify-center py-3 transition ${
                pathname === '/profile'
                  ? 'text-accent'
                  : 'text-gray-600'
              } hover:text-accent`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">Account</span>
            </Link>
          </div>
        </nav>
      </body>
    </html>
  );
    }
