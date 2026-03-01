import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaGithub, FaArrowLeft, FaStar, FaCode, FaUserAlt } from 'react-icons/fa';
import { marked } from 'marked';
import { formatTokenAmount, calculateEligibleAmount } from '../utils/ethersUtils';
import { ethers } from 'ethers';

import { MOCK_BOUNTIES } from '../constants/mockBounties';


const BountyDetail = ({ account, contract, profileContract }) => {
  const { projectId, issueId } = useParams();
  const [bounty, setBounty] = useState(null);
  const [issue, setIssue] = useState(null);
  const [project, setProject] = useState(null);
  const [profileScore, setProfileScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [completingBounty, setCompletingBounty] = useState(false);
  const [pullRequestUrl, setPullRequestUrl] = useState('');
  const [submission, setSubmission] = useState(null);
  const [githubUsername, setGithubUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId || !issueId) return;

    setLoading(true);
    setError('');

    const fetchIssueDetails = async (issueUrl) => {
      if (!issueUrl) return;
      try {
        const urlObj = new URL(issueUrl);
        const issueUrlParts = urlObj.pathname.split('/');
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
    };

    const fetchBountyDetails = async () => {
      let bountyData = null;
      let foundInContract = false;

      // 1. Try fetching from contract
      if (contract) {
        try {
          const data = await contract.getBountyByProjectAndIssue(projectId, issueId);
          if (data && data.exists) {
            bountyData = {
              amount: data.amount,
              status: getBountyStatusString(data.status),
              assignee: data.assignee,
              difficultyLevel: data.difficultyLevel,
              issueTitle: data.issueTitle,
              issueUrl: data.issueUrl,
              createdAt: new Date(data.createdAt.toNumber() * 1000).toLocaleString(),
              exists: true,
              id: data.id,
              isMock: false
            };
            foundInContract = true;
          }
        } catch (err) {
          console.warn('Contract fetch failed, will check mocks', err);
        }
      }

      // 2. Try fetching from mocks if not found in contract
      if (!foundInContract) {
        const mockBounty = MOCK_BOUNTIES.find(b => String(b.projectId) === String(projectId) && String(b.issueId) === String(issueId));
        if (mockBounty) {
          bountyData = {
            amount: mockBounty.amount,
            status: 'OPEN',
            assignee: '0x0000000000000000000000000000000000000000',
            difficultyLevel: mockBounty.difficultyLevel,
            issueTitle: mockBounty.issueTitle,
            issueUrl: mockBounty.issueUrl,
            createdAt: new Date(mockBounty.createdAt).toLocaleString(),
            exists: true,
            id: 'mock',
            isMock: true,
            projectOwner: mockBounty.projectOwner
          };

          // Also set a mock project for the UI
          setProject({
            id: mockBounty.projectId,
            owner: mockBounty.projectOwner || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            name: mockBounty.projectName,
            exists: true
          });
        }
      }

      if (!bountyData) {
        setError('Bounty not found');
        setLoading(false);
        return;
      }

      setBounty(bountyData);

      // Fetch project details if not mock
      if (contract && !bountyData.isMock) {
        try {
          const projectData = await contract.getProject(projectId);
          setProject(projectData);
        } catch (err) {
          console.warn('Could not fetch project data', err);
        }
      }

      // Fetch issue details from GitHub
      await fetchIssueDetails(bountyData.issueUrl);

      // Fetch submission details if SUBMITTED
      if (contract && bountyData.status === 'SUBMITTED') {
        try {
          const submissionData = await contract.submissions(bountyData.id);
          setSubmission({
            pullRequestUrl: submissionData.pullRequestUrl,
            submittedAt: new Date(submissionData.submittedAt.toNumber() * 1000).toLocaleString(),
            githubUsername: submissionData.githubUsername
          });
        } catch (err) {
          console.warn('Could not fetch submission details', err);
        }
      }

      // Fetch profile score if available
      if (profileContract && account) {
        try {
          // getWalletGitHubInfo returns [username, verified, timestamp]
          const [username, verified] = await profileContract.getWalletGitHubInfo(account);

          if (verified && username) {
            const profile = await profileContract.getProfileScore(username);

            if (profile && profile.exists) {
              setProfileScore(profile.overallScore);
              setGithubUsername(username);
            }
          }
        } catch (err) {
          console.warn('Could not fetch profile score', err);
        }
      }

      setLoading(false);
    };

    fetchBountyDetails();
  }, [contract, projectId, issueId, account, profileContract]);


  const applyForBounty = async () => {
    if (!contract || !account || !bounty || !githubUsername) {
      alert("Please link and analyze your GitHub profile first!");
      return;
    }
    setApplying(true);
    if (bounty.isMock) {
      // Simulate transaction for demo
      setTimeout(() => {
        setApplying(false);
        setBounty({
          ...bounty,
          status: 'ASSIGNED',
          assignee: account
        });
        alert('Successfully applied for bounty (Demo Mode)!');
      }, 1500);
      return;
    }

    try {
      console.log("[BOUNTY_DETAIL] Applying for bounty ID:", bounty.id, "with username:", githubUsername);
      const tx = await contract.applyForBounty(bounty.id, githubUsername);
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

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!contract || !account || !bounty || !pullRequestUrl || !githubUsername) {
      alert("Missing required information for submission");
      return;
    }

    setSubmittingWork(true);
    if (bounty.isMock) {
      // Simulate submission for demo
      setTimeout(() => {
        setSubmittingWork(false);
        setBounty({
          ...bounty,
          status: 'SUBMITTED'
        });
        setSubmission({
          pullRequestUrl: pullRequestUrl,
          submittedAt: new Date().toLocaleString(),
          githubUsername: githubUsername
        });
        alert('Work submitted successfully (Demo Mode)!');
      }, 1500);
      return;
    }

    try {
      const tx = await contract.submitWork(bounty.id, pullRequestUrl, githubUsername);
      await tx.wait();

      alert('Work submitted successfully!');

      // Refresh data
      const bountyData = await contract.getBountyByProjectAndIssue(projectId, issueId);
      setBounty({
        ...bounty,
        status: getBountyStatusString(bountyData.status)
      });

      const submissionData = await contract.submissions(bounty.id);
      setSubmission({
        pullRequestUrl: submissionData.pullRequestUrl,
        submittedAt: new Date(submissionData.submittedAt.toNumber() * 1000).toLocaleString(),
        githubUsername: submissionData.githubUsername
      });
    } catch (err) {
      console.error('Error submitting work:', err);
      alert(`Failed to submit work: ${err.message}`);
    }
    setSubmittingWork(false);
  };

  const handleCompleteBounty = async () => {
    if (!contract || !account || !bounty) return;

    if (!window.confirm("Are you sure you want to approve this work and release the payment? This action cannot be undone.")) {
      return;
    }

    setCompletingBounty(true);

    if (bounty.isMock) {
      // Simulate transaction for demo
      setTimeout(() => {
        setCompletingBounty(false);
        setBounty({
          ...bounty,
          status: 'COMPLETED'
        });
        alert('Bounty successfully completed and payment released (Demo Mode)!');
      }, 2000);
      return;
    }

    try {
      console.log("[BOUNTY_DETAIL] Completing bounty ID:", bounty.id);
      const tx = await contract.completeBounty(bounty.id);
      await tx.wait();

      alert('Bounty completed successfully! Payment has been released.');

      // Refresh data
      const bountyData = await contract.getBountyByProjectAndIssue(projectId, issueId);
      setBounty({
        ...bounty,
        status: getBountyStatusString(bountyData.status)
      });
    } catch (err) {
      console.error('Error completing bounty:', err);
      alert(`Failed to complete bounty: ${err.message}`);
    }
    setCompletingBounty(false);
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
          <Link to="/explore-bounties" className="text-gray-400 hover:text-white hover:underline flex items-center transition-colors">
            <FaArrowLeft className="mr-1" /> Back to Explore Bounties
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
        to="/explore-bounties"
        className="inline-flex items-center text-gray-400 hover:text-white hover:underline mb-6 transition-colors"
      >
        <FaArrowLeft className="mr-2" /> Back to Explore Bounties
      </Link>

      <div className="bg-zinc-950 border border-zinc-800 rounded-sm shadow-sm overflow-hidden">
        {/* Bounty Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white uppercase tracking-tight">{bounty.issueTitle}</h1>
              {bounty.isMock && (
                <span className="bg-amber-900/30 text-amber-500 border border-amber-900/50 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest">
                  Demo
                </span>
              )}
            </div>
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
              <div className="flex flex-col items-end">
                <button
                  onClick={applyForBounty}
                  disabled={applying}
                  className={`inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm shadow-sm text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-white transition-colors ${applying ? 'opacity-50 cursor-not-allowed' : ''
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
              </div>
            )}

            {bounty.status === 'ASSIGNED' && bounty.assignee.toLowerCase() === account?.toLowerCase() && (
              <div className="w-full mt-6 p-4 bg-zinc-950 border border-zinc-800 rounded-none shadow-lg">
                <h3 className="text-white font-mono uppercase tracking-widest text-sm mb-4">Submit Your Solution</h3>
                <form onSubmit={handleSubmitWork} className="space-y-4">
                  <div>
                    <label htmlFor="prUrl" className="block text-xs font-mono text-zinc-500 uppercase mb-1">Pull Request URL</label>
                    <input
                      id="prUrl"
                      type="url"
                      placeholder="https://github.com/owner/repo/pull/123"
                      value={pullRequestUrl}
                      onChange={(e) => setPullRequestUrl(e.target.value)}
                      required
                      className="w-full bg-black border border-zinc-800 rounded-none px-3 py-2 text-white font-mono text-sm focus:border-white outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingWork}
                    className="w-full bg-white text-black font-mono uppercase tracking-widest text-xs py-3 rounded-none hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {submittingWork ? 'Processing Submission...' : 'Submit Solution'}
                  </button>
                </form>
              </div>
            )}

            {bounty.status === 'SUBMITTED' && submission && (
              <div className="w-full mt-6 p-4 bg-zinc-950 border border-zinc-800 rounded-none">
                <h3 className="text-white font-mono uppercase tracking-widest text-sm mb-2">Work Submitted</h3>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">PR URL:</span>
                    <a href={submission.pullRequestUrl} target="_blank" rel="noopener noreferrer" className="text-white underline truncate ml-4">{submission.pullRequestUrl}</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Submitted By:</span>
                    <span className="text-white">@{submission.githubUsername}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Timestamp:</span>
                    <span className="text-white">{submission.submittedAt}</span>
                  </div>
                </div>
                <div className="mt-4 p-2 bg-blue-950/20 border border-blue-900/30 text-blue-400 text-center text-[10px] uppercase tracking-tighter">
                  Wait for project owner (@{project?.owner?.slice(0, 6)}...{project?.owner?.slice(-4)}) to review and approve
                </div>
              </div>
            )}

            {bounty.status === 'COMPLETED' && (
              <div className="w-full mt-6 p-6 bg-zinc-950 border border-green-900/30 rounded-none bg-gradient-to-b from-green-950/10 to-transparent">
                <div className="flex items-center text-green-400 font-mono uppercase tracking-widest text-sm mb-4">
                  <FaStar className="mr-2" />
                  Bounty Completed
                </div>
                <p className="text-zinc-400 text-sm mb-4">
                  The work has been approved and the payment has been released to the contributor.
                </p>
                {submission && (
                  <div className="space-y-2 font-mono text-xs border-t border-zinc-800 pt-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">PR URL:</span>
                      <a href={submission.pullRequestUrl} target="_blank" rel="noopener noreferrer" className="text-white underline truncate ml-4">{submission.pullRequestUrl}</a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Contributor:</span>
                      <span className="text-white">@{submission.githubUsername}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Payout Address:</span>
                      <span className="text-white truncate ml-4">{bounty.payoutAddress}</span>
                    </div>
                  </div>
                )}
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