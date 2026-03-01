import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BountyModal from './BountyModal';
import { ethers } from 'ethers';
import { useUnlink, useWithdraw } from '@unlink-xyz/react';

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

const BOUNTY_CONTRACT_ADDRESS = process.env.REACT_APP_BOUNTY_CONTRACT_ADDRESS || "0x959DBbfd4a4c07b74c6C62bA72e65a63A55d615f";
const BOUNTY_ABI = ["function paymentToken() external view returns (address)"];


const ProjectIssues = ({ account }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bountyMap, setBountyMap] = useState({});

  // Bounty creation state
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showBountyModal, setShowBountyModal] = useState(false);
  const [creatingBounty, setCreatingBounty] = useState(false);

  // Unlink integration
  const [useUnlinkForBounty, setUseUnlinkForBounty] = useState(false);
  const { walletExists, balances, ready: unlinkReady } = useUnlink();
  const { withdraw } = useWithdraw();

  const OAUTH_SERVER_URL = process.env.REACT_APP_OAUTH_SERVER_URL || 'http://localhost:3001';

  const fetchProject = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${OAUTH_SERVER_URL}/api/projects/${projectId}`,
        { withCredentials: true }
      );

      if (response.data && response.data.success) {
        setProject(response.data.project);
        // After loading project, fetch issues
        fetchIssues(response.data.project);
        // Also fetch bounties for the project
        fetchBounties(projectId);
      } else {
        throw new Error('Failed to fetch project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError(error.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async (projectData) => {
    if (!projectData) return;

    setIssuesLoading(true);

    try {
      const repoFullName = `${projectData.repositoryOwner}/${projectData.repositoryName}`;

      const response = await axios.get(
        `${OAUTH_SERVER_URL}/api/github/issues/${projectData.repositoryOwner}/${projectData.repositoryName}`,
        {
          withCredentials: true,
          params: { state: 'open' }
        }
      );

      if (response.data && response.data.issues) {
        setIssues(response.data.issues);
      } else {
        console.warn('No issues found or unexpected response format');
        setIssues([]);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      // Don't set main error, just log it
    } finally {
      setIssuesLoading(false);
    }
  };


  const fetchBounties = async (projectId) => {
    try {
      const response = await axios.get(
        `${OAUTH_SERVER_URL}/api/bounties/project/${projectId}`,
        { withCredentials: true }
      );

      if (response.data && response.data.success) {
        // Create a map of issue number to bounty
        const map = {};
        response.data.bounties.forEach(bounty => {
          map[bounty.issueNumber] = bounty;
        });
        setBountyMap(map);
      }
    } catch (error) {
      console.error('Error fetching bounties:', error);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleRefreshIssues = () => {
    if (project) {
      fetchIssues(project);
      fetchBounties(projectId);
    }
  };

  const handleCreateBounty = (issue) => {
    if (!account) {
      alert("Please connect your wallet to create a bounty");
      return;
    }

    // Check if this issue already has a bounty
    if (bountyMap[issue.number]) {
      alert(`Bounty already exists for issue #${issue.number}`);
      return;
    }

    setSelectedIssue(issue);
    setUseUnlinkForBounty(walletExists); // Default to true if wallet exists
    setShowBountyModal(true);
  };

  const handleBountySubmit = async (bountyData) => {
    if (!selectedIssue || !project || !account) {
      alert("Please connect your wallet before creating a bounty");
      return;
    }

    setCreatingBounty(true);

    try {
      // 1. Get web3 provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Get current network information
      const network = await provider.getNetwork();
      console.log("Creating bounty on chain ID:", network.chainId);

      // 2. Connect to bounty contract
      const bountyContract = new ethers.Contract(
        BOUNTY_CONTRACT_ADDRESS,
        BOUNTY_ABI,
        signer
      );

      // 3. Get the payment token address
      const tokenAddress = await bountyContract.paymentToken();
      console.log("Payment token address:", tokenAddress);

      // Check if the token address is valid
      const code = await provider.getCode(tokenAddress);
      if (code === '0x') {
        console.warn("Token address doesn't contain code. This might be using native ETH instead.");

        // Check native balance instead of token balance
        const balance = await provider.getBalance(account);

        if (balance.lt(ethers.utils.parseEther(bountyData.amount))) {
          throw new Error(`Insufficient ETH balance. You need at least ${bountyData.amount} ETH`);
        }

        // Skip token approval since we're using native ETH
        console.log("Creating bounty using native ETH...");
      } else {
        // 4. Create token contract instance with safer fallbacks
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          signer
        );

        // 5. Get token info with fallbacks for non-standard tokens
        let tokenSymbol = 'TOKENS';
        let tokenDecimals = 18; // Default to 18 decimals like ETH

        try {
          tokenSymbol = await tokenContract.symbol();
          console.log(`Using token: ${tokenSymbol} (${tokenAddress})`);

          // Try to get token decimals
          try {
            tokenDecimals = await tokenContract.decimals();
            console.log(`Token decimals: ${tokenDecimals}`);
          } catch (decimalError) {
            console.warn("Could not get token decimals, using default (18):", decimalError.message);
          }
        } catch (error) {
          console.warn("Could not get token symbol, using generic name instead:", error.message);
        }

        // Parse amount with the correct number of decimals
        // If we couldn't get decimals, use parseEther (which is parseUnits with 18 decimals)
        const parsedAmount = ethers.utils.parseUnits(bountyData.amount, tokenDecimals);
        console.log(`Parsed amount with ${tokenDecimals} decimals: ${parsedAmount.toString()}`);

        if (useUnlinkForBounty) {
          // --- UNLINK PRIVATE FUNDING FLOW ---
          if (!unlinkReady || !walletExists) {
            throw new Error("Unlink private wallet is not ready or doesn't exist. Please create one first.");
          }

          // Check Unlink private balance (ignoring case for token checks)
          const privateBalance = balances ? balances[tokenAddress] : null;

          if (!privateBalance || privateBalance < parsedAmount.toBigInt()) {
            throw new Error(`Insufficient private ${tokenSymbol} balance in your Unlink wallet. You need at least ${bountyData.amount} ${tokenSymbol}. Please deposit funds first.`);
          }

          console.log(`Sending ${bountyData.amount} ${tokenSymbol} from Unlink private wallet to Bounty Contract...`);
          alert('Preparing private funding transaction. Please wait while we generate the zero-knowledge proof...');

          try {
            // Withdraw tokens from Unlink directly to the bounty contract
            await withdraw([{
              token: tokenAddress,
              amount: parsedAmount.toBigInt(),
              recipient: BOUNTY_CONTRACT_ADDRESS
            }]);

            console.log("Private funding successful!");
          } catch (unlinkError) {
            console.error("Unlink private funding failed:", unlinkError);
            throw new Error(`Private funding failed: ${unlinkError.message}`);
          }
        } else {
          // --- METAMASK PUBLIC FUNDING FLOW ---
          // 6. Check user's token balance with fallback for non-standard tokens
          try {
            const balance = await tokenContract.balanceOf(account);

            if (balance.lt(parsedAmount)) {
              throw new Error(`Insufficient ${tokenSymbol} balance. You need at least ${bountyData.amount} ${tokenSymbol}`);
            }

            // 7. Check allowance with fallback
            try {
              const allowance = await tokenContract.allowance(account, BOUNTY_CONTRACT_ADDRESS);

              if (allowance.lt(parsedAmount)) {
                // 8. Need to approve tokens first
                console.log(`Approving ${bountyData.amount} ${tokenSymbol} for the bounty contract...`);

                try {
                  const approveTx = await tokenContract.approve(
                    BOUNTY_CONTRACT_ADDRESS,
                    ethers.constants.MaxUint256 // Approve max amount to avoid future approvals
                  );

                  // Show approval progress
                  alert(`Please confirm the approval transaction in your wallet. This lets the contract use your ${tokenSymbol} tokens.`);
                  await approveTx.wait();
                  console.log("Approval successful!");
                } catch (approvalError) {
                  console.error("Approval failed:", approvalError);
                  throw new Error(`Failed to approve tokens: ${approvalError.message}`);
                }
              }
            } catch (allowanceError) {
              console.warn("Could not check allowance, proceeding anyway:", allowanceError.message);
            }
          } catch (balanceError) {
            console.warn("Could not check token balance:", balanceError.message);
            alert("Warning: Could not verify your token balance. The transaction might fail if you don't have enough tokens.");
          }
        }
      }

      // 9. Now create the bounty
      console.log("Creating bounty with amount:", bountyData.amount, "and difficulty:", bountyData.difficultyLevel);

      // Pass the Wei amount as a string to ensure it's handled correctly
      const response = await axios.post(
        `${OAUTH_SERVER_URL}/api/bounties/create`,
        {
          projectId,
          issueNumber: selectedIssue.number,
          issueTitle: selectedIssue.title,
          issueUrl: selectedIssue.html_url,
          amount: bountyData.amount,
          amountEth: bountyData.amount, // Also send the original ETH amount for reference
          difficultyLevel: bountyData.difficultyLevel,
          deadline: Math.floor(new Date(bountyData.deadline).getTime() / 1000),
          ownerAddress: account
        },
        { withCredentials: true }
      );

      if (response.data && response.data.success) {
        alert(`Bounty created successfully! Transaction: ${response.data.txHash}`);
        setShowBountyModal(false);
        setSelectedIssue(null);

        // Refresh bounties
        fetchBounties(projectId);
      } else {
        throw new Error(response.data?.error || 'Failed to create bounty');
      }
    } catch (error) {
      console.error('Error creating bounty:', error);
      alert(`Failed to create bounty: ${error.message}`);
    } finally {
      setCreatingBounty(false);
    }
  };
  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format ETH amounts
  const formatEth = (wei) => {
    if (!wei) return '0 ETH';
    return `${ethers.utils.formatEther(wei)} ETH`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-950/50 border border-red-900 rounded-sm p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-3 text-lg font-medium text-red-500">{error}</h3>
          <div className="mt-6">
            <Link
              to="/projects"
              className="inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm text-gray-300 bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null; // Should never happen due to loading/error states
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Project Header */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-sm shadow-sm p-6 mb-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-400">{project.description || "No description available"}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/projects"
              className="inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm text-gray-300 bg-zinc-900 hover:bg-zinc-800 mr-3 transition-colors"
            >
              Back to Projects
            </Link>
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm text-black bg-white hover:bg-gray-200 transition-colors"
            >
              <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        {/* Project Info */}
        <div className="mt-6 border-t border-zinc-800 pt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Repository</h3>
            <p className="mt-1 text-sm text-white">{project.repositoryName}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Owner</h3>
            <p className="mt-1 text-sm text-white">{project.repositoryOwner}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Project ID</h3>
            <p className="mt-1 text-sm text-white">{project.id}</p>
          </div>
        </div>
      </div>

      {/* Issues Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Open Issues</h2>
        <button
          onClick={handleRefreshIssues}
          disabled={issuesLoading}
          className={`inline-flex items-center px-3 py-1.5 border border-zinc-700 text-sm font-medium rounded-sm bg-zinc-900 text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors ${issuesLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {issuesLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Issues
            </>
          )}
        </button>
      </div>

      {/* Issues List */}
      <div className="bg-zinc-950 border border-zinc-800 shadow-sm rounded-sm overflow-hidden">
        {issuesLoading && issues.length === 0 ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto"></div>
            <p className="mt-3 text-sm text-gray-400">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">No open issues</h3>
            <p className="mt-1 text-sm text-gray-400">This project doesn't have any open issues at the moment.</p>
            <div className="mt-6">
              <a
                href={`${project.githubUrl}/issues/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm shadow-sm text-black bg-white hover:bg-gray-200 transition-colors"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create New Issue
              </a>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {issues.map(issue => {
              const hasBounty = bountyMap[issue.number];

              return (
                <div key={issue.id} className="p-6 hover:bg-zinc-900 transition-colors">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      {/* Issue open icon */}
                      <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <a
                          href={issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-semibold text-white hover:underline transition-colors"
                        >
                          {issue.title}
                        </a>

                        {hasBounty ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium border bg-green-950/50 text-green-400 border-green-900">
                            <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-3.5-8v2h7v-2h-7zm0-3v2h7v-2h-7zm0-3v2h7V8h-7z" />
                            </svg>
                            Bounty: {formatEth(hasBounty.amount)}
                          </span>
                        ) : (
                          account && account.toLowerCase() === project.ownerAddress.toLowerCase() && (
                            <button
                              onClick={() => handleCreateBounty(issue)}
                              className="inline-flex items-center px-2.5 py-1 border border-zinc-700 text-xs font-medium rounded-sm text-white bg-zinc-900 hover:bg-zinc-800 hover:border-gray-500 transition-colors"
                            >
                              <svg className="-ml-0.5 mr-1.5 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                              </svg>
                              Add Bounty
                            </button>
                          )
                        )}
                      </div>

                      <div className="mt-1 text-sm text-gray-400 line-clamp-2">
                        {issue.body ? issue.body.substring(0, 150) + (issue.body.length > 150 ? '...' : '') : 'No description'}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center text-xs text-gray-500">
                        <span className="mr-3">#{issue.number}</span>
                        <span className="mr-3">Opened {formatDate(issue.created_at)}</span>
                        <span className="mr-3">by {issue.user.login}</span>

                        {issue.labels && issue.labels.length > 0 && (
                          <div className="flex flex-wrap mt-2">
                            {issue.labels.map(label => (
                              <span
                                key={label.id}
                                className="mr-2 mb-2 px-2 py-0.5 rounded-sm text-xs border"
                                style={{
                                  backgroundColor: `#${label.color}15`,
                                  color: `#${label.color}`,
                                  borderColor: `#${label.color}40`
                                }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {hasBounty && (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                          <div className="text-xs font-medium text-gray-400">
                            <span className="mr-4">Bounty Status: <span className={`font-semibold ${hasBounty.status === 'OPEN' ? 'text-green-500' : 'text-blue-500'}`}>{hasBounty.status}</span></span>
                            <span>Deadline: {new Date(parseInt(hasBounty.deadline) * 1000).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bounty Creation Modal */}
      {showBountyModal && selectedIssue && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowBountyModal(false)}>
              <div className="absolute inset-0 bg-black opacity-80 backdrop-blur-sm shadow-xl"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block relative overflow-hidden text-left align-bottom transition-all transform bg-zinc-950 border border-zinc-800 rounded-sm shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowBountyModal(false)}
                  className="text-gray-500 hover:text-white focus:outline-none transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-white mb-4">
                      Create Bounty for #{selectedIssue.number}
                    </h3>

                    {walletExists && (
                      <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-sm p-4 shadow-sm">
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={useUnlinkForBounty}
                              onChange={() => setUseUnlinkForBounty(!useUnlinkForBounty)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${useUnlinkForBounty ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useUnlinkForBounty ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                          <div className="ml-3 text-sm font-medium text-white">
                            Fund Privately (via Unlink)
                          </div>
                        </label>
                        <p className="mt-2 text-xs text-gray-400 ml-13">
                          {useUnlinkForBounty
                            ? "Your funding source will remain entirely private. The tokens will be withdrawn from your Unlink wallet into the bounty contract."
                            : "Your funding source will be public on the blockchain via MetaMask."}
                        </p>
                      </div>
                    )}

                    <BountyModal
                      issue={selectedIssue}
                      isOpen={true}
                      onClose={() => setShowBountyModal(false)}
                      onSubmit={handleBountySubmit}
                      isSubmitting={creatingBounty}
                      projectId={projectId}
                      isInline={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectIssues;