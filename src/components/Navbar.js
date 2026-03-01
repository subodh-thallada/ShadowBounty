import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaGithub, FaWallet, FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { useUnlink } from '@unlink-xyz/react';
import UnlinkWallet from './UnlinkWallet';

const Navbar = ({ account, walletType, onDisconnect, username, verified, navItems = [] }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const location = useLocation();
  const { walletExists } = useUnlink();

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Truncate Ethereum address for display
  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className="bg-black border-b border-zinc-800 py-4 px-6 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="inline-block border border-white py-1.5 px-3 text-lg font-bold text-white font-sans uppercase tracking-tighter hover:bg-white hover:text-black transition-colors">
            ShadowBounty
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`text-sm font-medium transition-colors 
            ${location.pathname === item.path
                  ? 'text-white border-b-2 border-white pb-1'
                  : 'text-gray-400 hover:text-white'}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Wallet Status */}
        <div className="hidden md:flex items-center space-x-4">
          {account ? (
            <div className="flex items-center" ref={accountMenuRef}>
              {/* Verification badge */}
              {verified && (
                <div className="flex items-center mr-4 bg-zinc-900 border border-zinc-800 rounded-sm py-1 px-3">
                  <FaGithub className="text-gray-300 mr-2" />
                  <span className="text-sm text-gray-300">{username}</span>
                </div>
              )}

              {/* Account dropdown trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center bg-zinc-900 border border-zinc-800 rounded-sm py-2 px-3 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  <FaWallet className="text-gray-300 mr-2" />
                  <span className="text-sm text-white font-medium">{truncateAddress(account)}</span>
                  <svg className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Account dropdown menu */}
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-sm shadow-lg py-1 z-50">
                    <button
                      onClick={() => { setIsWalletModalOpen(true); setIsAccountMenuOpen(false); }}
                      className="w-full flex items-center px-4 py-2 text-sm text-left text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <FaWallet className="mr-3 h-4 w-4 text-gray-400" />
                      {walletExists ? 'Private Wallet Options' : 'Setup Private Wallet'}
                    </button>
                    <hr className="my-1 border-zinc-800" />
                    <button
                      onClick={() => { onDisconnect(); setIsAccountMenuOpen(false); }}
                      className="w-full flex items-center px-4 py-2 text-sm text-left text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
                    >
                      <FaSignOutAlt className="mr-3 h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              to="/"
              className="bg-white text-black font-medium border border-transparent rounded-sm py-2 px-4 hover:bg-gray-200 transition-colors"
            >
              Connect Wallet
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none"
          >
            {isMenuOpen ? (
              <FaTimes className="h-6 w-6" />
            ) : (
              <FaBars className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black border-t border-gray-800 mt-4 pt-2 pb-4 px-6">
          {/* Nav Links */}
          <div className="space-y-4 mb-6">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`block text-base font-medium
                  ${location.pathname === item.path
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Wallet Status on Mobile */}
          {account ? (
            <div className="space-y-3">
              {verified && (
                <div className="flex items-center bg-gray-800 rounded-md p-2">
                  <FaGithub className="text-white mr-2" />
                  <span className="text-sm text-white">{username}</span>
                </div>
              )}

              <div className="flex items-center bg-gray-800 rounded-md p-2">
                <FaWallet className="text-white mr-2" />
                <span className="text-sm text-white">{truncateAddress(account)}</span>
              </div>

              <button
                onClick={() => { onDisconnect(); setIsMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-400 border border-red-900/50 rounded-md hover:bg-red-950/30 hover:text-red-300 transition-colors"
              >
                <FaSignOutAlt className="h-4 w-4" />
                Log out
              </button>
            </div>
          ) : (
            <Link
              to="/"
              className="block w-full text-center bg-white text-black font-medium rounded-md py-2 hover:bg-gray-200 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Connect Wallet
            </Link>
          )}
        </div>
      )}

      {/* Unlink Wallet Modal */}
      <UnlinkWallet
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        userAddress={account}
      />
    </nav>
  );
};

export default Navbar;