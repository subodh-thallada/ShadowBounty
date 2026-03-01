import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaGithub, FaArrowLeft, FaStar, FaCode, FaUserAlt } from 'react-icons/fa';
import { marked } from 'marked';
import { formatTokenAmount, calculateEligibleAmount } from '../utils/ethersUtils';

const BountyDetail = ({ account, contract, profileContract }) => {
  const { projectId, issueId } = useParams();
  const [bounty, setBounty] = useState(null);
  const [issue, setIssue] = useState(null);
  const [project, setProject] = useState(null);
  const [profileScore, setProfileScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contract || !projectId || !issueId) return;

    setLoading(true);
    setError('');

    try {
      // Fetch bounty details from smart contract
      const fetchBountyDetails = async () => {
        const bountyData = await contract.getBountyByProjectAndIssue(projectId, issueId);

        if (!bountyData || !bountyData.exists) {
          setError('Bounty not found');
          setLoading(false);
          return;
        }

        // Format bounty data
        const formattedBounty = {
          amount: bountyData.amount, // Keep as BigNumber for now
          status: getBountyStatusString(bountyData.status),
          assignee: bountyData.assignee,
          difficultyLevel: bountyData.difficultyLevel,
          issueTitle: bountyData.issueTitle,
          issueUrl: bountyData.issueUrl,
          createdAt: new Date(bountyData.createdAt.toNumber() * 1000).toLocaleString(),
          exists: bountyData.exists
        };

        setBounty(formattedBounty);

        // Fetch project details
        const projectData = await contract.getProject(projectId);
        setProject(projectData);

        // Fetch issue details from GitHub API
        if (formattedBounty.issueUrl) {
          try {
            const issueUrlParts = new URL(formattedBounty.issueUrl).pathname.split('/');
            const owner = issueUrlParts[1];
            const repo = issueUrlParts[2];
            const issueNumber = issueUrlParts[4];

            const token = localStorage.getItem('github_access_token');
            const headers = token ? { 'Authorization': `token ${token}` } : {};

            const response = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
              { headers }
            );

            if (response.ok) {
              const issueData = await response.json();
              setIssue(issueData);
            }
          } catch (err) {
            console.warn('Could not fetch detailed issue data from GitHub', err);
          }
        }

        // If profileContract is available and user is connected, fetch their profile score
        if (profileContract && account) {
          try {
            const userInfo = await profileContract.getWalletGitHubInfo(account);
            if (userInfo && userInfo.verified) {
              const username = userInfo.username;
              const profile = await profileContract.getProfileScore(username);

              if (profile && profile.exists) {
                setProfileScore(profile.overallScore);
              }
            }
          } catch (err) {
            console.warn('Could not fetch profile score', err);
          }
        }

        setLoading(false);
      };

      fetchBountyDetails();
    } catch (err) {
      console.error('Error fetching bounty details:', err);
      setError(`Failed to fetch bounty details: ${err.message}`);
      setLoading(false);
    }
  }, [contract, projectId, issueId, account, profileContract]);


  const applyForBounty = async () => {
    if (!contract || !account || !bounty) return;

    setApplying(true);
    try {
      const tx = await contract.applyForBounty(projectId, issueId);
      await tx.wait();

      alert('Successfully applied for bounty!');
      // Refresh bounty data to update status
      const bountyData = await contract.getBountyByProjectAndIssue(projectId, issueId);
      setBounty({
        ...bounty,
        status: getBountyStatusString(bountyData.status),
        assignee: bountyData.assignee
      });
    } catch (err) {
      console.error('Error applying for bounty:', err);
      alert(`Failed to apply for bounty: ${err.message}`);
    }
    setApplying(false);
  };

  // Helper function to convert numeric status to string
  const getBountyStatusString = (statusCode) => {
    const statuses = ['OPEN', 'ASSIGNED', 'SUBMITTED', 'COMPLETED', 'CANCELLED'];
    return statuses[statusCode] || 'UNKNOWN';
  };

  // Render markdown content safely
  const renderMarkdown = (content) => {
    if (!content) return '';
    return { __html: marked(content) };
  };

  // Calculate eligible amount based on profile score
  const eligibleAmount = bounty ? calculateEligibleAmount(profileScore, bounty.amount) : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-red-950/50 border border-red-900 text-red-500 p-4 rounded-sm">
          {error}
        </div>
        <div className="mt-4">
          <Link to="/dashboard" className="text-gray-400 hover:text-white hover:underline flex items-center transition-colors">
            <FaArrowLeft className="mr-1" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <Link
        to={`/projects/${projectId}/bounties`}
        className="inline-flex items-center text-gray-400 hover:text-white hover:underline mb-6 transition-colors"
      >
        <FaArrowLeft className="mr-2" /> Back to Bounties
      </Link>

      <div className="bg-zinc-950 border border-zinc-800 rounded-sm shadow-sm overflow-hidden">
        {/* Bounty Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">{bounty.issueTitle}</h1>
            <span
              className={`px-3 py-1 rounded-sm text-sm font-medium border
                ${bounty.status === 'OPEN' ? 'bg-green-950 text-green-400 border-green-900' :
                  bounty.status === 'ASSIGNED' ? 'bg-yellow-950 text-yellow-400 border-yellow-900' :
                    bounty.status === 'COMPLETED' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' :
                      'bg-zinc-900 text-gray-400 border-zinc-700'
                }
              `}
            >
              {bounty.status}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center text-sm text-gray-400">
            <span className="flex items-center mr-4">
              <FaGithub className="mr-1 text-white" />
              <a
                href={bounty.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                View on GitHub
              </a>
            </span>

            <span className="flex items-center mr-4">
              <FaCode className="mr-1" />
              Difficulty: {bounty.difficultyLevel.charAt(0).toUpperCase() + bounty.difficultyLevel.slice(1)}
            </span>

            <span className="flex items-center">
              <FaStar className="mr-1" />
              Created: {bounty.createdAt}
            </span>
          </div>
        </div>

        {/* Reward Section */}
        <div className="p-6 bg-zinc-900 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Bounty Reward</h2>
          <div className="mt-3 flex justify-between items-center">
            <div>
              <span className="text-3xl font-bold text-white">{formatTokenAmount(bounty.amount)}</span>

              {profileScore !== null && (
                <div className="mt-1 text-sm text-gray-400">
                  Your profile score: <span className="font-semibold text-white">{profileScore}/100</span>
                  <div className="mt-1">
                    You're eligible for <span className="font-semibold text-white">{eligibleAmount.percentage}</span> of the bounty
                    (<span className="font-semibold text-white">{eligibleAmount.amount} tokens</span>)
                  </div>
                </div>
              )}
            </div>

            {bounty.status === 'OPEN' && account && (
              <button
                onClick={applyForBounty}
                disabled={applying}
                className={`inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm shadow-sm text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-white transition-colors ${applying ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
              >
                {applying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </>
                ) : (
                  'Apply for Bounty'
                )}
              </button>
            )}

            {bounty.status === 'ASSIGNED' && bounty.assignee.toLowerCase() === account?.toLowerCase() && (
              <div className="text-yellow-400 font-medium">
                You are working on this bounty
              </div>
            )}

            {bounty.status === 'ASSIGNED' && bounty.assignee.toLowerCase() !== account?.toLowerCase() && (
              <div className="text-amber-500/80 bg-amber-950/30 border border-amber-900/30 px-3 py-2 rounded-sm text-sm">
                <FaUserAlt className="inline mr-2 opacity-70" />
                Assigned to another contributor
              </div>
            )}
          </div>
        </div>

        {/* Issue Description */}
        {issue && (
          <div className="p-6 border-b border-zinc-800 bg-zinc-950">
            <h2 className="text-lg font-semibold text-white mb-4">Issue Description</h2>
            <div className="prose prose-invert max-w-none text-gray-300">
              <div dangerouslySetInnerHTML={renderMarkdown(issue.body)} />
            </div>
          </div>
        )}

        {/* Requirements */}
        <div className="p-6 bg-zinc-950">
          <h2 className="text-lg font-semibold text-white mb-3">Requirements</h2>
          <ul className="list-disc pl-5 text-gray-400 space-y-2 text-sm">
            <li>Review the full issue on GitHub before applying</li>
            <li>Submit a pull request that addresses all issue requirements</li>
            <li>Include comprehensive test coverage for your changes</li>
            <li>Your submission will be reviewed by the project maintainers</li>
            <li>Payment is released after your pull request is approved and merged</li>
          </ul>

          {!account && (
            <div className="mt-6 bg-yellow-950/30 border border-yellow-900/50 rounded-sm p-4 text-sm">
              <p className="text-yellow-200">
                Connect your wallet to apply for this bounty.
              </p>
            </div>
          )}

          {account && profileScore === null && (
            <div className="mt-6 bg-yellow-950/30 border border-yellow-900/50 rounded-sm p-4 text-sm">
              <p className="text-yellow-200 mb-2">
                Complete your GitHub profile analysis to see your eligibility for this bounty.
              </p>
              <Link
                to="/analyze"
                className="inline-block text-yellow-400 font-medium hover:text-yellow-300 hover:underline transition-colors"
              >
                Analyze your GitHub profile →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BountyDetail;