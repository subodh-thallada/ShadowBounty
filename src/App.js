import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ExploreBounties from './components/ExploreBounties';
import { ethers } from 'ethers';
import { UnlinkProvider } from '@unlink-xyz/react';

import OpenSourceBountyABI from './abis/OpenSourceBounty.json';
import GitHubProfileScoreOAuthABI from './abis/GitHubProfileScoreOAuth.json';
import { CONTRACT_ABI } from './constants/contractAbi';

// Lazy-loaded Components
const ConnectWallet = lazy(() => import('./components/ConnectWallet'));
const ConnectGitHub = lazy(() => import('./components/ConnectGithub'));
const UsernameInput = lazy(() => import('./components/UsernameInput'));
const ProfileResults = lazy(() => import('./components/ProfileResults'));
const VerificationSuccess = lazy(() => import('./components/VerificationSuccess'));
const VerificationFailed = lazy(() => import('./components/VerificationFailed'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const Docs = lazy(() => import('./components/Docs'));
const ContributorDashboard = lazy(() => import('./components/ContributorDashboard'));
const BountyDetail = lazy(() => import('./components/BountyDetail'));
const ProjectOnboarding = lazy(() => import('./components/ProjectOnboarding'));
const BountyList = lazy(() => import('./components/BountyList'));
const ProjectsList = lazy(() => import('./components/ProjectsList'));
const ProjectIssues = lazy(() => import('./components/ProjectIssues'));

// Loading Fallback Component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-black text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
  </div>
);

function App() {
  // State for wallet connection
  const [account, setAccount] = useState(null);
  const [walletType, setWalletType] = useState('ethereum'); // Default to 'ethereum' for compatibility
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for GitHub verification
  const [verifiedUsername, setVerifiedUsername] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({
    verified: false,
    checking: false  // Changed from true to false to prevent loading screen hanging
  });

  const [bountyContract, setBountyContract] = useState(null);
  const [profileContract, setProfileContract] = useState(null);

  // Contract config
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const bountyContractAddress = process.env.REACT_APP_BOUNTY_CONTRACT_ADDRESS || process.env.BOUNTY_CONTRACT_ADDRESS;
  const profileContractAddress = process.env.REACT_APP_ZK_CONTRACT_ADDRESS;

  // Initialize provider and check if wallet is already connected
  useEffect(() => {
    const init = async () => {
      try {
        // Check if user explicitly logged out (for demo reset)
        if (localStorage.getItem('explicitLogout') === 'true') {
          setLoading(false);
          return;
        }

        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(provider);

          // Check if we have accounts without requesting new access
          const accounts = await provider.listAccounts();

          if (accounts.length > 0) {
            const currentAccount = accounts[0];
            setAccount(currentAccount);
            const signer = provider.getSigner();
            setSigner(signer);

            // Initialize contracts in parallel where possible
            // Note: ethers.Contract creation is synchronous, but we can organize it better

            // 1. Profile/Main Contract
            if (contractAddress) {
              try {
                const mainContract = new ethers.Contract(
                  contractAddress,
                  GitHubProfileScoreOAuthABI.abi || GitHubProfileScoreOAuthABI,
                  signer
                );
                setContract(mainContract);

                // Fire and forget verification check to not block initial render
                checkGitHubVerification(mainContract, currentAccount);
              } catch (e) { console.error("Main contract error:", e); }
            }

            // 2. Bounty Contract
            if (bountyContractAddress) {
              try {
                const bContract = new ethers.Contract(
                  bountyContractAddress,
                  OpenSourceBountyABI.abi || OpenSourceBountyABI,
                  signer
                );
                setBountyContract(bContract);
              } catch (e) { console.error("Bounty contract error:", e); }
            }

            // 3. Profile Contract (Mainly for ZK checks/OAuth)
            if (profileContractAddress) {
              try {
                const pContract = new ethers.Contract(
                  profileContractAddress,
                  GitHubProfileScoreOAuthABI.abi || GitHubProfileScoreOAuthABI,
                  signer
                );
                setProfileContract(pContract);
              } catch (e) { console.error("Profile contract error:", e); }
            }
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [contractAddress, bountyContractAddress, profileContractAddress]);

  // Function to check GitHub verification status
  const checkGitHubVerification = async (contract, address) => {
    try {
      setVerificationStatus({ ...verificationStatus, checking: true });

      // Call contract to get GitHub username and verification status
      const [username, verified, timestamp] = await contract.getWalletGitHubInfo(address);

      if (verified && username) {
        setVerifiedUsername(username);
        setVerificationStatus({ verified: true, checking: false });
      } else {
        setVerifiedUsername(null);
        setVerificationStatus({ verified: false, checking: false });
      }
    } catch (error) {
      console.error("Error checking GitHub verification:", error);
      setVerificationStatus({ verified: false, checking: false });
    }
  };

  // Function to connect wallet
  const connectWallet = async (address, walletType, walletProvider) => {
    if (!address || !walletProvider) {
      console.error("Invalid connect wallet parameters");
      return;
    }

    try {
      setLoading(true);

      // Clear explicit logout flag when user intentionally connects
      localStorage.removeItem('explicitLogout');

      if (walletType === 'ethereum' || !walletType) {
        // Default to Ethereum if type is not specified
        const provider = new ethers.providers.Web3Provider(walletProvider);
        setProvider(provider);
        setAccount(address);
        setWalletType('ethereum');

        // Get signer
        const signer = provider.getSigner();
        setSigner(signer);

        // Initialize main contract
        if (contractAddress) {
          try {
            const contract = new ethers.Contract(
              contractAddress,
              GitHubProfileScoreOAuthABI.abi || GitHubProfileScoreOAuthABI,
              signer
            );
            setContract(contract);

            // Check GitHub verification status
            await checkGitHubVerification(contract, address);
          } catch (contractError) {
            console.error("Contract initialization error:", contractError);
            // Continue without contract
          }
        }

        // Initialize bounty contract
        if (bountyContractAddress) {
          try {
            const bContract = new ethers.Contract(
              bountyContractAddress,
              OpenSourceBountyABI.abi || OpenSourceBountyABI,
              signer
            );
            setBountyContract(bContract);
            console.log("Bounty contract initialized");
          } catch (error) {
            console.error("Bounty contract initialization error:", error);
          }
        }

        // Initialize profile contract
        if (profileContractAddress) {
          try {
            const pContract = new ethers.Contract(
              profileContractAddress,
              GitHubProfileScoreOAuthABI.abi || GitHubProfileScoreOAuthABI,
              signer
            );
            setProfileContract(pContract);
            console.log("Profile contract initialized");
          } catch (error) {
            console.error("Profile contract initialization error:", error);
          }
        }

        // Redirect to home after successful connection
        window.location.href = '/';

      } else if (walletType === 'polkadot') {
        // Basic Polkadot wallet handling for now
        setAccount(address);
        setWalletType('polkadot');
        // We'll implement the rest of Polkadot integration later
        setVerificationStatus({ verified: false, checking: false });

        // Redirect to home after successful connection
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Failed to connect to wallet:", error);
      setVerificationStatus({ verified: false, checking: false });
    } finally {
      setLoading(false);
    }
  };

  // Function to disconnect wallet (log out)
  // Function to disconnect wallet (log out)
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setBountyContract(null);
    setProfileContract(null);
    setVerifiedUsername(null);
    setVerificationStatus({ verified: false, checking: false });
    setWalletType('ethereum'); // Reset to default

    // Clear saved connection info
    localStorage.removeItem('connectedAccount');
    localStorage.removeItem('walletType');
  };

  // Function to handle global demo reset (GitHub cookies + Wallet)
  const handleDemoReset = async () => {
    try {
      // Clear GitHub server-side session
      const oauthServerUrl = process.env.REACT_APP_OAUTH_SERVER_URL || 'http://localhost:3001';
      await fetch(`${oauthServerUrl}/api/auth/unlink`, { method: 'GET', credentials: 'include' });
    } catch (error) {
      console.error("Failed to unlink GitHub session:", error);
    }

    // Disconnect wallet/local state
    disconnectWallet();

    // Set flag to prevent auto-connect on reload (important for demo reset)
    localStorage.setItem('explicitLogout', 'true');

    // Force redirect to home
    window.location.href = '/';
  };

  // Function to handle successful GitHub verification
  const handleVerificationSuccess = (username) => {
    setVerifiedUsername(username);
    setVerificationStatus({ verified: true, checking: false });
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum && walletType === 'ethereum') {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);

          if (provider) {
            const ethSigner = provider.getSigner();
            setSigner(ethSigner);

            // Reinitialize contract with new signer
            if (contractAddress) {
              try {
                const ethContract = new ethers.Contract(
                  contractAddress,
                  CONTRACT_ABI,
                  ethSigner
                );
                setContract(ethContract);

                // Check GitHub verification status for the new account
                await checkGitHubVerification(ethContract, accounts[0]);
              } catch (error) {
                console.error("Contract reinitialization error:", error);
              }
            }

            // Reinitialize bounty contract
            if (bountyContractAddress) {
              try {
                const bContract = new ethers.Contract(
                  bountyContractAddress,
                  OpenSourceBountyABI.abi || OpenSourceBountyABI,
                  ethSigner
                );
                setBountyContract(bContract);
              } catch (error) {
                console.error("Bounty contract reinitialization error:", error);
              }
            }

            // Reinitialize profile contract
            if (profileContractAddress) {
              try {
                const pContract = new ethers.Contract(
                  profileContractAddress,
                  GitHubProfileScoreOAuthABI.abi || GitHubProfileScoreOAuthABI,
                  ethSigner
                );
                setProfileContract(pContract);
              } catch (error) {
                console.error("Profile contract reinitialization error:", error);
              }
            }
          }
        } else {
          // User disconnected all accounts
          disconnectWallet();
        }
      };

      const handleChainChanged = () => {
        // Reload the page on chain change
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        // Clean up listeners
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [contractAddress, bountyContractAddress, profileContractAddress, provider, walletType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading application...</p>
          <p className="mt-2 text-sm text-gray-500">
            If loading takes too long, try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <UnlinkProvider chain="monad-testnet" autoSync={true}>
      <Router>
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
          <Suspense fallback={<LoadingFallback />}>
            <Navbar
              account={account}
              walletType={walletType}
              onDisconnect={handleDemoReset} // Using handleDemoReset instead of just disconnectWallet
              username={verifiedUsername}
              verified={verificationStatus.verified}
              navItems={[
                { label: 'Explore Bounties', path: '/explore-bounties' },
                { label: 'Contributor Dashboard', path: '/contributor-dashboard' },
                { label: 'Create Project', path: '/project-onboarding' },
                { label: 'Projects', path: '/projects' },
                { label: 'Profile', path: `/results/${verifiedUsername}` },
              ]}
            />

            <main className="container mx-auto px-4 py-8">
              <Routes>
                {/* Home route - show homepage */}
                <Route path="/" element={<HomePage account={account} verifiedUsername={verifiedUsername} verified={verificationStatus.verified} onConnect={connectWallet} />} />

                {/* Connection route */}
                <Route path="/connect" element={<ConnectWallet onConnect={connectWallet} />} />

                {/* GitHub connection route */}
                <Route
                  path="/connect-github"
                  element={
                    account ? (
                      <ConnectGitHub
                        account={account}
                        contract={contract}
                        walletType={walletType}
                        onVerificationSuccess={handleVerificationSuccess}
                      />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                {/* Manual username input (for public data only) */}
                <Route
                  path="/analyze"
                  element={
                    account ? (
                      <UsernameInput
                        account={account}
                        contract={contract}
                        walletType={walletType}
                        verified={verificationStatus.verified}
                      />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                {/* Profile results page */}
                <Route
                  path="/results/:username"
                  element={
                    account ? (
                      <ProfileResults
                        account={account}
                        contract={contract}
                        walletType={walletType}
                        isVerified={verificationStatus.verified}
                        verifiedUsername={verifiedUsername}
                      />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route path="/contributor-dashboard" element={
                  <ContributorDashboard
                    account={account}
                    contract={bountyContract}
                    profileContract={contract}
                  />
                } />

                <Route path="/explore-bounties" element={
                  <ExploreBounties
                    account={account}
                    contract={bountyContract}
                    profileContract={contract}
                  />
                } />

                <Route path="/bounties/:projectId/:issueId" element={
                  <BountyDetail
                    account={account}
                    contract={bountyContract}
                    profileContract={contract} // Use main contract for profile checks
                  />
                } />

                <Route path="/projects/:projectId/bounties" element={
                  <BountyList
                    account={account}
                    contract={bountyContract}
                  />
                } />

                <Route path="/project-onboarding" element={
                  <ProjectOnboarding
                    account={account}
                    contract={bountyContract}
                    profileContract={contract}
                  />
                } />

                {/* GitHub OAuth callback routes */}
                <Route
                  path="/verification-success"
                  element={
                    account ? (
                      <VerificationSuccess
                        onVerificationComplete={handleVerificationSuccess}
                      />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                <Route
                  path="/verification-failed"
                  element={
                    account ? (
                      <VerificationFailed />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />

                <Route path="/projects" element={
                  <ProjectsList account={account} />
                } />

                <Route path="/projects/:projectId" element={
                  <ProjectIssues account={account} />
                } />

              </Routes>

            </main>
          </Suspense>
        </div>
      </Router>
    </UnlinkProvider>
  );
}

export default App;
