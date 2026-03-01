import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaGithub, FaWallet, FaBars, FaTimes } from 'react-icons/fa';
import { useUnlink } from '@unlink-xyz/react';
import UnlinkWallet from './UnlinkWallet';

const Navbar = ({ account, walletType, onDisconnect, username, verified, navItems = [] }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const location = useLocation();
  const { walletExists } = useUnlink();

  // Truncate Ethereum address for display
  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className="bg-black border-b border-zinc-800 py-4 px-6 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo and site name */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center">
            <FaGithub className="text-white text-2xl mr-2" />
            <span className="text-xl font-bold text-white">ShadowBounty</span>
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
            <div className="flex items-center">
              {/* Verification badge */}
              {verified && (
                <div className="flex items-center mr-4 bg-zinc-900 border border-zinc-800 rounded-sm py-1 px-3">
                  <FaGithub className="text-gray-300 mr-2" />
                  <span className="text-sm text-gray-300">{username}</span>
                </div>
              )}

              {/* Wallet info */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-sm py-1 px-3">
                <FaWallet className="text-gray-300 mr-2" />
                <span className="text-sm text-gray-300">{truncateAddress(account)}</span>
              </div>

              {/* Private Wallet button */}
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="ml-2 flex items-center bg-zinc-900 border border-zinc-700 text-white rounded-sm py-1 px-3 text-sm hover:bg-zinc-800 transition-colors font-medium hover:border-white"
              >
                <FaWallet className="mr-1.5 h-3 w-3" />
                {walletExists ? 'Private Options' : 'Setup Private Wallet'}
              </button>

              {/* Disconnect button */}
              <button
                onClick={onDisconnect}
                className="ml-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Disconnect
              </button>
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
                onClick={onDisconnect}
                className="w-full text-sm text-center py-2 text-gray-400 border border-gray-800 rounded-md hover:text-white transition-colors"
              >
                Disconnect
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