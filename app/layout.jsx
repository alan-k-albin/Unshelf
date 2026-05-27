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
} from 'lucide-react';
import { isUserVerified, logoutUser } from '@/lib/auth';
import SessionInitializer from '@/components/SessionInitializer';
import './globals.css';

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomepage = pathname === '/';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = async () => {
    const success = await logoutUser();

    if (success) {
      setIsLoggedIn(false);
      setUser(null);
      setShowProfileMenu(false);
      router.push('/login');
    }
  };

  return (
    <html lang="en">
      <body className="bg-light">
        <SessionInitializer />

        {/* Desktop Navigation */}
        <nav className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary">
              Unshelf
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-primary">
                Home
              </Link>

              <Link
                href="/search"
                className="text-gray-600 hover:text-primary"
              >
                Browse
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/create-listing"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Sell
                  </Link>

                  <Link
                    href="/chats"
                    className="text-gray-600 hover:text-primary"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowProfileMenu(!showProfileMenu)
                      }
                      className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold hover:bg-accent/90"
                    >
                      {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </button>

                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-48 py-2">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="font-medium text-primary">
                            {user?.fullName}
                          </p>

                          <p className="text-xs text-gray-600">
                            {user?.email}
                          </p>
                        </div>

                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-light"
                        >
                          <User className="w-4 h-4 inline mr-2" />
                          My Profile
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4 inline mr-2" />
                          Logout
                        </button>
                      </div>
                    )}
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

        {/* Mobile Navigation - Top */}
        <nav className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary">
              Unshelf
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="bg-light border-t border-gray-200">
              <Link
                href="/"
                className="block px-4 py-2 text-sm text-gray-700"
              >
                Home
              </Link>

              <Link
                href="/search"
                className="block px-4 py-2 text-sm text-gray-700"
              >
                Browse
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/create-listing"
                    className="block px-4 py-2 text-sm text-gray-700"
                  >
                    Create Listing
                  </Link>

                  <Link
                    href="/chats"
                    className="block px-4 py-2 text-sm text-gray-700"
                  >
                    Chats
                  </Link>

                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700"
                  >
                    Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block px-4 py-2 text-sm text-accent font-medium"
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main>{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="flex justify-around items-center">
            {/* Home */}
            <Link
              href="/"
              className={`flex-1 flex flex-col items-center justify-center py-3 ${
                pathname === '/'
                  ? 'text-accent'
                  : 'text-gray-600'
              } hover:text-accent`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </Link>

            {/* Chats */}
            <Link
              href="/chats"
              className={`flex-1 flex flex-col items-center justify-center py-3 ${
                pathname === '/chats'
                  ? 'text-accent'
                  : 'text-gray-600'
              } hover:text-accent`}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs mt-1">Chats</span>
            </Link>

            {/* Sell */}
            {isLoggedIn ? (
              <Link
                href="/create-listing"
                className={`flex-1 flex flex-col items-center justify-center py-3 ${
                  pathname === '/create-listing'
                    ? 'text-accent'
                    : 'text-gray-600'
                } hover:text-accent`}
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs mt-1">Sell</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600 hover:text-accent"
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs mt-1">Sell</span>
              </Link>
            )}

            {/* Profile */}
            <Link
              href={isLoggedIn ? '/profile' : '/login'}
              className={`flex-1 flex flex-col items-center justify-center py-3 ${
                pathname === '/profile'
                  ? 'text-accent'
                  : 'text-gray-600'
              } hover:text-accent`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">Account</span>
            </Link>
          </div>
        </nav>
      </body>
    </html>
  );
      }
