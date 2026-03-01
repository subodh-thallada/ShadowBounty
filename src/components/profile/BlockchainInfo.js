import React from 'react';

const BlockchainInfo = ({ profileData, account, isPreviewMode }) => {
  // Helper function to format addresses
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div className="border-t border-zinc-800 p-6 bg-black">
      <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-gray-500 mb-6 font-sans">Blockchain Information</h2>

      {isPreviewMode ? (
        <div className="rounded-none bg-zinc-900 border border-zinc-700 p-4">
          <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">
            Analysis Not Saved On-Chain
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Analyzed On</span>
            <p className="mt-1 text-white">{formatDate(profileData.analyzedAt)}</p>
          </div>

          <div>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Analyzed By</span>
            <p className="mt-1">
              <a
                href={`https://testnet.monadexplorer.com/address/${profileData.analyzedBy}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors flex items-center"
              >
                {formatAddress(profileData.analyzedBy)}
                {account.toLowerCase() === profileData.analyzedBy.toLowerCase() &&
                  <span className="ml-2 text-[10px] font-mono bg-white text-black py-0.5 px-2 rounded-none">YOU</span>
                }
              </a>
            </p>
          </div>

          <div>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Data Privacy</span>
            <p className="mt-1">
              {profileData.includesPrivateRepos ? (
                <span className="text-green-400 font-medium">
                  {profileData.hasZkVerification
                    ? "Includes private repositories (ZK verified)"
                    : "Includes private repositories"}
                </span>
              ) : (
                <span className="text-gray-500">Public repositories only</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainInfo;