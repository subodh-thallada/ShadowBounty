import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaSortAmountDown, FaFilter } from 'react-icons/fa';
import { ethers } from 'ethers';
import { formatTokenAmount, calculateEligibleAmount } from '../utils/ethersUtils';

const ExploreBounties = ({ account, contract, profileContract }) => {
  const [bounties, setBounties] = useState([]);
  const [filteredBounties, setFilteredBounties] = useState([]);
  const [profileScore, setProfileScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!contract) {
        setLoading(false);
        setError("Contract not initialized");
        return;
      }

      try {
        // Fetch all open bounties
        const allBounties = await contract.getAllOpenBounties();
        setBounties(allBounties);

        // If account is connected, get profile score
        if (account && profileContract) {
          try {
            const [username, verified] = await profileContract.getWalletGitHubInfo(account);
            if (username && verified) {
              const profile = await profileContract.getProfileScore(username);
              setProfileScore(profile.overallScore);
            }
          } catch (err) {
            console.warn("Could not get profile score:", err);
            // Continue without profile score
          }
        }

      } catch (err) {
        console.error("Error loading bounties:", err);
        setError("Failed to load bounties. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [account, contract, profileContract]);

  // Apply filters and sorting whenever they change
  useEffect(() => {
    let result = [...bounties];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(bounty =>
        bounty.issueTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bounty.projectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      result = result.filter(bounty =>
        bounty.difficultyLevel === difficultyFilter
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'highest-reward':
        // Sort by amount, handling BigNumber values
        result.sort((a, b) => {
          const amountA = a.amount && a.amount._isBigNumber
            ? parseFloat(ethers.utils.formatEther(a.amount))
            : parseFloat(a.amount) || 0;

          const amountB = b.amount && b.amount._isBigNumber
            ? parseFloat(ethers.utils.formatEther(b.amount))
            : parseFloat(b.amount) || 0;

          return amountB - amountA;
        });
        break;
      case 'easiest':
        const difficultyOrder = { 'easy': 0, 'medium': 1, 'hard': 2, 'expert': 3 };
        result.sort((a, b) => difficultyOrder[a.difficultyLevel] - difficultyOrder[b.difficultyLevel]);
        break;
      default:
        // Default to newest
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredBounties(result);
  }, [bounties, searchTerm, difficultyFilter, sortBy]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-6">Explore Bounties</h1>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search bounties by title or project name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 bg-zinc-900 border border-zinc-700 rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-0"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <FaFilter className="mr-2" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>

          <div className="flex items-center">
            <span className="text-gray-400 mr-2">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-sm py-1 pl-3 pr-8 text-sm focus:outline-none focus:border-white focus:ring-0"
            >
              <option value="newest" className="bg-zinc-900">Newest</option>
              <option value="highest-reward" className="bg-zinc-900">Highest Reward</option>
              <option value="easiest" className="bg-zinc-900">Easiest</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-sm">
            <h3 className="font-medium text-white mb-3">Filter by Difficulty</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDifficultyFilter('all')}
                className={`px-3 py-1 rounded-sm text-sm border ${difficultyFilter === 'all'
                    ? 'bg-white text-black border-white'
                    : 'bg-zinc-950 text-gray-400 border-zinc-800 hover:border-gray-500 hover:text-white'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setDifficultyFilter('easy')}
                className={`px-3 py-1 rounded-sm text-sm border ${difficultyFilter === 'easy'
                    ? 'bg-green-900/50 text-green-400 border-green-800'
                    : 'bg-zinc-950 text-green-600 border-zinc-800 hover:border-green-800 hover:text-green-500'
                  }`}
              >
                Easy
              </button>
              <button
                onClick={() => setDifficultyFilter('medium')}
                className={`px-3 py-1 rounded-sm text-sm border ${difficultyFilter === 'medium'
                    ? 'bg-yellow-900/50 text-yellow-400 border-yellow-800'
                    : 'bg-zinc-950 text-yellow-600 border-zinc-800 hover:border-yellow-800 hover:text-yellow-500'
                  }`}
              >
                Medium
              </button>
              <button
                onClick={() => setDifficultyFilter('hard')}
                className={`px-3 py-1 rounded-sm text-sm border ${difficultyFilter === 'hard'
                    ? 'bg-red-900/50 text-red-400 border-red-800'
                    : 'bg-zinc-950 text-red-600 border-zinc-800 hover:border-red-800 hover:text-red-500'
                  }`}
              >
                Hard
              </button>
              <button
                onClick={() => setDifficultyFilter('expert')}
                className={`px-3 py-1 rounded-sm text-sm border ${difficultyFilter === 'expert'
                    ? 'bg-purple-900/50 text-purple-400 border-purple-800'
                    : 'bg-zinc-950 text-purple-600 border-zinc-800 hover:border-purple-800 hover:text-purple-500'
                  }`}
              >
                Expert
              </button>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div className="bg-red-950/50 border border-red-900 text-red-400 px-4 py-3 rounded-sm mb-4">
          {error}
        </div>
      ) : (
        <>
          {/* Profile Score Notice */}
          {account && !profileScore && (
            <div className="bg-yellow-950/30 border border-yellow-900/50 text-yellow-200 px-4 py-3 rounded-sm mb-6">
              <p className="font-medium">Your GitHub profile isn't analyzed yet</p>
              <p className="mt-1 text-yellow-400">
                Complete your profile analysis to see your eligible rewards for each bounty.
              </p>
              <Link
                to="/analyze"
                className="inline-block mt-2 text-yellow-500 hover:text-yellow-400 hover:underline"
              >
                Analyze your GitHub profile →
              </Link>
            </div>
          )}

          {/* Bounties Grid */}
          {filteredBounties.length === 0 ? (
            <div className="text-center py-12 bg-zinc-950 border border-zinc-800 rounded-sm shadow-sm">
              <p className="text-gray-500">No bounties found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBounties.map(bounty => {
                const eligibleAmount = calculateEligibleAmount(profileScore, bounty.amount);

                return (
                  <div key={bounty.id} className="bg-zinc-950 border border-zinc-800 rounded-sm shadow-sm overflow-hidden hover:border-gray-500 transition-colors">
                    <div className="px-6 py-4 border-b border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">#{bounty.issueNumber}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-sm border ${bounty.difficultyLevel === 'easy' ? 'bg-green-950 text-green-400 border-green-900' :
                            bounty.difficultyLevel === 'medium' ? 'bg-yellow-950 text-yellow-400 border-yellow-900' :
                              bounty.difficultyLevel === 'hard' ? 'bg-red-950 text-red-400 border-red-900' :
                                'bg-purple-950 text-purple-400 border-purple-900'
                          }`}>
                          {bounty.difficultyLevel.charAt(0).toUpperCase() + bounty.difficultyLevel.slice(1)}
                        </span>
                      </div>
                      <h3 className="font-medium text-white truncate">{bounty.issueTitle}</h3>
                      <p className="text-sm text-gray-400 mt-1">{bounty.projectName}</p>
                    </div>

                    <div className="px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          {/* Use formatTokenAmount utility */}
                          <div className="text-xl font-bold text-white">
                            {formatTokenAmount(bounty.amount)}
                          </div>
                          {profileScore !== null && (
                            <div className="text-xs text-gray-500 mt-1">
                              You're eligible for: <span className="font-medium text-gray-300">
                                {eligibleAmount.amount} tokens ({eligibleAmount.percentage})
                              </span>
                            </div>
                          )}
                        </div>
                        <Link
                          to={`/bounties/${bounty.projectId}/${bounty.issueId}`}
                          className="inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm text-white hover:bg-zinc-800 hover:border-white focus:outline-none transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExploreBounties;