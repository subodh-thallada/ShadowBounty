import React from 'react';
import { initiateGithubAuth } from '../../utils/githubauth';

const TokenInput = ({ 
  account,  // Add wallet address prop
  username,
  showZkProofSection, 
  setShowZkProofSection,
  handleRecalculate,
  recalculating,
  isVerifiedForUsername
}) => {
  // Function to start GitHub auth flow
  const startGithubAuth = () => {
    // Store current path to return here after auth
    const currentPath = `/results/${username}`;
    initiateGithubAuth(account, currentPath);
  };

  return (
    <div className="border-t border-zinc-800 p-6 bg-zinc-950">
      <h2 className="text-lg font-semibold text-white mb-2 font-sans">
        Include Private Repository Data
      </h2>

      {!isVerifiedForUsername ? (
        <div className="mb-4 p-4 bg-yellow-950/30 border border-yellow-800 text-yellow-200 rounded-sm">
          <p className="text-sm">
            <span className="font-medium">Verification required:</span> To include private repositories, 
            your wallet must be verified as the owner of this GitHub account. Please reconnect GitHub to verify.
          </p>
        </div>
      ) : (
        <p className="text-sm text-green-400 mb-4">
          ✓ Your wallet is verified for this GitHub account. You can include private repositories.
        </p>
      )}      

      <p className="text-sm text-gray-400 mb-4">
        Connect your GitHub account to include private repositories in your score calculation.
      </p>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="use-zk"
              name="use-zk"
              type="checkbox"
              checked={showZkProofSection}
              onChange={(e) => setShowZkProofSection(e.target.checked)}
              className="h-4 w-4 rounded-sm border-zinc-600 bg-zinc-900 text-white focus:ring-white focus:ring-offset-0 focus:ring-offset-black focus:border-white"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="use-zk" className="font-medium text-white cursor-pointer">
              Use zero-knowledge proofs to protect private repo data
            </label>
            <p className="text-gray-500">
              Generate ZK proofs to verify private data without exposing details.
            </p>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={startGithubAuth}
            className="inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm text-white bg-zinc-950 hover:bg-zinc-800 hover:border-white focus:outline-none transition-colors"
          >
            Reconnect GitHub
          </button>
          
          <button
            onClick={() => handleRecalculate(true)}
            disabled={recalculating}
            className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-sm text-white hover:bg-white hover:text-black focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white"
          >
            {recalculating ? 'Processing...' : 'Include Private Repos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenInput;