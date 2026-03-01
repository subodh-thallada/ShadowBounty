import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaSortAmountDown, FaFilter } from 'react-icons/fa';
import { ethers } from 'ethers';
import { formatTokenAmount, calculateEligibleAmount } from '../utils/ethersUtils';

// GitHub configuration for dynamically sourcing issues as bounties
const GITHUB_OWNER = 'subodh-thallada';
const GITHUB_REPO = 'US-Elections-2024';

// helper: map GitHub issue labels to difficulty levels
function getDifficultyFromLabels(labels) {
  const names = labels.map(l => l.name.toLowerCase());
  if (names.includes('easy')) return 'easy';
  if (names.includes('medium')) return 'medium';
  if (names.includes('hard')) return 'hard';
  if (names.includes('expert')) return 'expert';
  return 'medium';
}

// (GitHub fetch helper is no longer used, but kept for reference)
async function fetchGitHubBounties() {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`GitHub API error ${resp.status}`);
  const issues = await resp.json();
  return issues.map(issue => ({
    id: `gh-${issue.id}`,
    projectId: `${GITHUB_OWNER}/${GITHUB_REPO}`,
    issueId: issue.number.toString(),
    issueNumber: issue.number.toString(),
    issueTitle: issue.title,
    projectName: GITHUB_REPO,
    amount: ethers.utils.parseUnits('500', 18),
    difficultyLevel: getDifficultyFromLabels(issue.labels || []),
    createdAt: new Date(issue.created_at).getTime(),
    issueUrl: issue.html_url,
  }));
}

// Mock bounties for demo/development when contract returns no data
const MOCK_BOUNTIES = [
  {
    id: 'mock-1',
    projectId: '1',
    issueId: '2',
    issueNumber: '2',
    issueUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/2`,
    // more challenging task: analyze intermittent memory leaks in WebSocket connection pooling,
    // implement monitoring, fix underlying issue, and add regression tests
    issueTitle: 'Resolve intermittent memory leak in WebSocket connection pool',
    projectName: 'openmuster-core',
    amount: ethers.utils.parseUnits('400', 18),
    // bumped difficulty from medium to hard
    difficultyLevel: 'hard',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'mock-2',
    projectId: '1',
    issueId: '3',
    issueNumber: '3',
    issueUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/3`,
    issueTitle: 'Write comprehensive unit and integration tests for auth middleware',
    projectName: 'openmuster-core',
    amount: ethers.utils.parseUnits('250', 18),
    // initially medium, now marked easy per request
    difficultyLevel: 'easy',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'mock-3',
    projectId: '2',
    issueId: '4',
    issueNumber: '4',
    issueUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/4`,
    issueTitle: 'Design and implement accessible dark mode with theme persistence',
    projectName: 'shadowbounty-ui',
    amount: ethers.utils.parseUnits('450', 18),
    // increased from medium to hard
    difficultyLevel: 'hard',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'mock-4',
    projectId: '2',
    issueId: '5',
    issueNumber: '5',
    issueUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/5`,
    // now an expert-level rewrite supporting multi-chain and performance optimization
    issueTitle: 'Rewrite blockchain integration for multi-chain support and performance',
    projectName: 'shadowbounty-ui',
    amount: ethers.utils.parseUnits('800', 18),
    // upgraded from hard to expert
    difficultyLevel: 'expert',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'mock-5',
    projectId: '3',
    issueId: '6',
    issueNumber: '6',
    issueUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/6`,
    issueTitle: 'Update and expand documentation with examples and fix outdated instructions',
    projectName: 'ethereum-smart-contracts',
    amount: ethers.utils.parseUnits('120', 18),
    // bumped from easy to medium
    difficultyLevel: 'medium',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'mock-6',
    projectId: '3',
    issueId: '7',
    issueNumber: '7',
    issueUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/7`,
    issueTitle: 'Implement advanced gas optimizations with custom assembly and benchmarks',
    projectName: 'ethereum-smart-contracts',
    amount: ethers.utils.parseUnits('900', 18),
    // remains expert
    difficultyLevel: 'expert',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'mock-7',
    projectId: '4',
    issueId: '8',
    issueNumber: '8',
    issueUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/8`,
    issueTitle: 'Enhance GitHub OAuth flow with better error recovery and user feedback',
    projectName: 'oauth-server',
    amount: ethers.utils.parseUnits('300', 18),
    // raised from medium to hard
    difficultyLevel: 'hard',
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'mock-8',
    projectId: '4',
    issueId: '9',
    issueNumber: '9',
    issueUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/9`,
    issueTitle: 'Implement robust API rate limit error handling with retry/backoff',
    projectName: 'oauth-server',
    amount: ethers.utils.parseUnits('220', 18),
    // raised from easy to medium
    difficultyLevel: 'medium',
    createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'mock-9',
    projectId: '5',
    issueId: '10',
    issueNumber: '10',
    issueUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/10`,
    issueTitle: 'Create responsive bounty card with animations and accessibility support',
    projectName: 'contributor-dashboard',
    amount: ethers.utils.parseUnits('200', 18),
    // raised from easy to medium
    difficultyLevel: 'medium',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];

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
        // no contract available – just show the mock list (links already point at repo)
        setBounties(MOCK_BOUNTIES);
        setLoading(false);
        return;
      }

      try {
        // Fetch all open bounties from contract
        const allBounties = await contract.getAllOpenBounties();
        const formattedBounties = (allBounties || []).map((b, i) => ({
          id: b.id?.toString() ?? `contract-${i}`,
          projectId: b.projectId?.toString() ?? '0',
          issueId: b.issueId?.toString() ?? b.issueNumber?.toString() ?? '0',
          issueNumber: b.issueNumber?.toString() ?? '0',
          issueTitle: b.issueTitle || 'Untitled',
          projectName: b.projectName || `Project ${b.projectId || ''}`,
          amount: b.amount,
          difficultyLevel: b.difficultyLevel || 'medium',
          createdAt: b.createdAt ? (typeof b.createdAt === 'object' && b.createdAt._isBigNumber ? b.createdAt.toNumber() * 1000 : Number(b.createdAt) * 1000) : Date.now(),
        }));
        if (formattedBounties.length > 0) {
          setBounties(formattedBounties);
        } else {
          // no on-chain bounties; fall back to mock list
          setBounties(MOCK_BOUNTIES);
        }

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
          }
        }
      } catch (err) {
        console.error("Error loading bounties:", err);
        // Fall back to mock bounties on error
        setBounties(MOCK_BOUNTIES);
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
                        {bounty.issueUrl ? (
                          <a
                            href={bounty.issueUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm text-white hover:bg-zinc-800 hover:border-white focus:outline-none transition-colors"
                          >
                            Open Issue
                          </a>
                        ) : (
                          <Link
                            to={`/bounties/${bounty.projectId}/${bounty.issueId}`}
                            className="inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm text-white hover:bg-zinc-800 hover:border-white focus:outline-none transition-colors"
                          >
                            View
                          </Link>
                        )}
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