import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GitHubProfileAnalyzer } from '../services/githubAnalyzer';

const UsernameInput = ({ account, contract, verified }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a GitHub username');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const normalizedUsername = username.trim().toLowerCase();

      // Check if profile already exists on blockchain
      const existingProfile = await contract.getProfileScore(normalizedUsername);
      
      if (existingProfile.exists) {
        // Navigate to results for existing profile (no cost - just viewing)
        navigate(`/results/${normalizedUsername}`);
        return;
      }
      
      // Analyze GitHub profile (FREE - just GitHub API calls, no blockchain transaction)
      const analyzer = new GitHubProfileAnalyzer();
      const analysis = await analyzer.analyze(normalizedUsername);
      
      // Navigate to results with preview data - user can optionally "Save to Blockchain" later
      // This avoids costing Monad every time they analyze a new profile
      navigate(`/results/${normalizedUsername}`, {
        state: {
          previewAnalysis: {
            ...analysis,
            includesPrivateRepos: false,
          },
        },
      });
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h1 className="text-3xl font-bold text-white mb-6 font-sans">Analyze</h1>

      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-sm overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-6 font-sans">Analyze GitHub Profile</h2>
        
        {/* Verification banner */}
        {!verified && (
          <div className="mb-6 bg-yellow-950/30 border border-yellow-800 p-4 rounded-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-200">
                  You're analyzing public repositories only.{' '}
                  <Link to="/connect-github" className="font-medium text-yellow-400 hover:text-yellow-300 underline">
                    Verify your GitHub account
                  </Link>
                  {' '}to include private data in your score.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="username" className="block text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">
              GitHub Username
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg 
                  className="h-5 w-5 text-gray-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" 
                  />
                </svg>
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 bg-zinc-900 border border-zinc-700 rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white"
                placeholder="e.g. octocat"
                disabled={loading}
              />
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-950/30 border border-red-800 text-red-400 rounded-sm">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className={`w-full inline-flex justify-center items-center py-3 px-4 border border-white rounded-sm text-base font-medium text-white hover:bg-white hover:text-black focus:outline-none transition-colors ${
                loading ? 'opacity-75 cursor-not-allowed hover:bg-transparent hover:text-white' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg 
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Analyze Profile'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>
            Analysis is free — we fetch public data from GitHub and show your score.
            <br />
            You can optionally save to the blockchain later (requires a small gas fee).
          </p>
        </div>
      </div>
      
      <div className="mt-8 bg-zinc-950 border border-zinc-800 p-6 rounded-sm overflow-hidden">
        <h2 className="text-lg font-semibold text-white mb-4 font-sans">How It Works</h2>
        <div className="space-y-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-sm bg-white text-black font-bold text-sm">
                1
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">
                We analyze the GitHub profile using various metrics including repositories, stars, followers, and activity level.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-sm bg-white text-black font-bold text-sm">
                2
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">
                A score is calculated based on these metrics, with higher emphasis on star count, activity, and repository quality.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-sm bg-white text-black font-bold text-sm">
                3
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">
                The results are permanently stored on the blockchain, creating an immutable record of the developer's profile score.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsernameInput;