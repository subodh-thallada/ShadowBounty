import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

// Components
import LoadingState from './common/LoadingState';
import ErrorState from './common/ErrorState';
import ProfileHeader from './profile/ProfileHeader';
import TokenInput from './profile/TokenInput';
import ZKDashboard from './ZKDashboard';
import ScoreBreakdown from './profile/ScoreBreakdown';
import BlockchainInfo from './profile/BlockchainInfo';
import ProfileActions from './profile/ProfileActions';

// Services
import { GitHubProfileAnalyzer } from '../services/githubAnalyzer';
const OAUTH_SERVER_URL = process.env.REACT_APP_OAUTH_SERVER_URL;

const ProfileResults = ({ account, contract, isVerified, verifiedUsername }) => {
  const { username } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [recalculating, setRecalculating] = useState(false);
  const [savingToChain, setSavingToChain] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [githubToken, setGithubToken] = useState(null);
  const [zkProofs, setZkProofs] = useState([]);
  const [showZkProofSection, setShowZkProofSection] = useState(false);
  const [privateRepoData, setPrivateRepoData] = useState(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [storing, setStoring] = useState(false);
  const [storingError, setStoringError] = useState('');
  const [storageComplete, setStorageComplete] = useState(false);

  const normalizedUsername = username ? username.toLowerCase() : "";

  // Check if this is the verified user's own profile
  const isOwnVerifiedProfile = isVerified && verifiedUsername === username;

  const analysisToProfileData = (analysis, includesPrivateRepos = false) => ({
    username: analysis.username,
    analyzedAt: new Date().toISOString(),
    overallScore: analysis.overallScore,
    exists: true,
    hasZkVerification: false,
    metrics: {
      profileCompleteness: analysis.metrics.profileCompleteness,
      followers: analysis.metrics.followers,
      repositories: analysis.metrics.repositories,
      stars: analysis.metrics.stars,
      languageDiversity: analysis.metrics.languageDiversity,
      hasPopularRepos: analysis.metrics.hasPopularRepos,
      recentActivity: analysis.metrics.recentActivity
    },
    analyzedBy: account,
    includesPrivateRepos: includesPrivateRepos ?? analysis.includesPrivateRepos ?? false
  });

  useEffect(() => {
    if (contract) {
      console.log("[CONTRACT_CHECK] Contract ready:", contract.address);
      console.log("[CONTRACT_CHECK] Available methods:",
        Object.keys(contract.functions)
          .filter(key => !key.includes('('))
          .sort()
      );
    } else {
      console.log("[CONTRACT_CHECK] Contract not ready");
    }
  }, [contract]);

  // Fetch profile data when component mounts or contract/username changes
  useEffect(() => {
    if (!username) return;
    const previewAnalysis = location.state?.previewAnalysis;
    if (previewAnalysis) {
      setProfileData(analysisToProfileData(previewAnalysis));
      setIsPreviewMode(true);
      setLoading(false);
      return;
    }
    if (contract) {
      fetchProfileData();
    }
  }, [contract, username]);

  const checkNetwork = async () => {
    try {
      const provider = contract.provider;
      const network = await provider.getNetwork();
      console.log("[NETWORK] Connected to network:", {
        chainId: network.chainId,
        name: network.name
      });

      // Check the target contract
      const code = await provider.getCode(contract.address);
      const isContract = code !== '0x';
      console.log("[NETWORK] Contract exists at address:", isContract);

      return { network, isContract };
    } catch (error) {
      console.error("[NETWORK] Error checking network:", error);
      return { error };
    }
  };

  const fetchProfileData = async () => {
    console.log("[PROFILE_RESULTS] Fetching profile data for:", normalizedUsername);
    if (!contract || !normalizedUsername) return;

    try {
      setLoading(true);
      setError('');

      await checkNetwork();

      console.log("[PROFILE_RESULTS] Contract instance obtained:", !!contract);
      console.log("[PROFILE_RESULTS] Contract address:", contract.address);

      // Get profile data from blockchain
      console.log("[PROFILE_RESULTS] Calling getProfileScore for:", normalizedUsername);
      const data = await contract.getProfileScore(normalizedUsername);
      console.log("[PROFILE_RESULTS] Profile exists:", data.exists);
      console.log("[PROFILE_RESULTS] Profile data raw:", {
        username: data.username,
        timestamp: data.timestamp?.toString(),
        overallScore: data.overallScore,
        exists: data.exists,
        hasZkVerification: data.hasZkVerification
      });

      if (!data.exists) {
        setError(`No data found for GitHub user ${username}`);
        setLoading(false);
        return;
      }

      // Format the data
      const formattedData = {
        username: data.username,
        analyzedAt: new Date(data.timestamp.toNumber() * 1000).toISOString(),
        overallScore: data.overallScore,
        exists: data.exists,
        hasZkVerification: data.hasZkVerification || false,
        metrics: {
          profileCompleteness: data.profileCompleteness,
          followers: data.followers,
          repositories: data.repoCount,
          stars: data.totalStars,
          languageDiversity: data.languageDiversity,
          hasPopularRepos: data.hasPopularRepos ? 'Yes' : 'No',
          recentActivity: data.recentActivity
        },
        analyzedBy: data.analyzedBy,
        includesPrivateRepos: data.includesPrivateRepos
      };

      console.log("[PROFILE_RESULTS] Formatted profile data:", formattedData);
      setProfileData(formattedData);
    } catch (error) {
      console.error('[PROFILE_RESULTS] Error fetching profile data:', error);
      setError(`Error fetching data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProofGenerated = (proofs, verificationResult) => {
    // Store proofs in state with updated format
    setZkProofs(
      verificationResult.results.map(result => ({
        proofType: result.proofType,
        verificationId: result.verificationId,
        txHash: result.txHash,
        verifiedAt: result.verifiedAt
      }))
    );

    // Update profile data to indicate it has ZK verification
    setProfileData(prev => ({
      ...prev,
      hasZkVerification: true
    }));

    // Optionally refresh data from blockchain
    fetchProfileData();
  };

  const storeProofsOnBlockchain = async (proofs) => {
    if (!contract || !username) return;

    try {
      setStoring(true); // Add a state variable for this

      // For each proof, call the smart contract
      for (const proof of proofs) {
        const tx = await contract.addZKProofVerification(
          normalizedUsername,
          proof.proofType,
          proof.verificationId,
          proof.txHash
        );

        await tx.wait();
        console.log(`Stored ${proof.proofType} proof verification for ${normalizedUsername}`);
      }

      // Update UI to show success
      setStoring(false);
      setStorageComplete(true);

      // Refresh data
      fetchProfileData();
    } catch (error) {
      console.error('Error storing proof verifications:', error);
      setStoringError(error.message);
      setStoring(false);
    }
  };

  // FREE: Refresh analysis from GitHub API only - no blockchain transaction
  const handleRefreshAnalysis = async (includePrivateRepos = false) => {
    if (!normalizedUsername) return;

    try {
      setRecalculating(true);
      setError('');

      if (includePrivateRepos && contract) {
        const [verifiedUsername, isVerified] = await contract.getWalletGitHubInfo(account);
        const normalizedVerifiedUsername = verifiedUsername.toLowerCase();
        if (!isVerified || normalizedVerifiedUsername !== normalizedUsername) {
          setError(
            `Your wallet must be verified as the owner of GitHub account "${normalizedUsername}" to include private repositories. ` +
            `Please complete the verification process first.`
          );
          setRecalculating(false);
          return;
        }
      }

      let privateRepoData = null;
      if (includePrivateRepos) {
        try {
          const response = await axios.get(
            `${OAUTH_SERVER_URL}/api/github/repos/${normalizedUsername}/authenticated`,
            { withCredentials: true }
          );
          privateRepoData = response.data;
          setPrivateRepoData(privateRepoData);
        } catch (err) {
          if (err.response?.status === 401) {
            setError('GitHub authentication required. Please reconnect your GitHub account.');
            setShowTokenInput(true);
          } else {
            setError('Failed to fetch private repository data.');
          }
          setRecalculating(false);
          return;
        }
      }

      const analyzer = new GitHubProfileAnalyzer();
      const analysis = await analyzer.analyze(normalizedUsername, privateRepoData);
      setProfileData(analysisToProfileData(analysis, includePrivateRepos));
      setIsPreviewMode(true); // Mark as unsaved so user can optionally save
      if (includePrivateRepos) {
        setGithubToken(null);
        setShowTokenInput(false);
      }
    } catch (err) {
      console.error('Error refreshing analysis:', err);
      setError(`Error refreshing analysis: ${err.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  // COSTS MONAD: Save current profile data to blockchain (gas fee)
  const handleSaveToBlockchain = async () => {
    if (!contract || !profileData) return;

    try {
      setSavingToChain(true);
      setError('');
      const tx = await contract.addProfileScore(
        profileData.username,
        Math.round(profileData.overallScore),
        profileData.metrics.profileCompleteness,
        profileData.metrics.followers,
        profileData.metrics.repositories,
        profileData.metrics.stars,
        profileData.metrics.languageDiversity,
        profileData.metrics.hasPopularRepos === 'Yes',
        profileData.metrics.recentActivity,
        profileData.includesPrivateRepos ?? false
      );
      await tx.wait();
      setIsPreviewMode(false);
      fetchProfileData();
    } catch (err) {
      console.error('Error saving to blockchain:', err);
      setError(`Error saving to blockchain: ${err.message}`);
    } finally {
      setSavingToChain(false);
    }
  };

  // Alias for TokenInput / existing UI - still does refresh only (free)
  const handleRecalculate = handleRefreshAnalysis;

  if (loading) {
    return <LoadingState message="Loading profile data..." />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-3xl font-bold text-white mb-6 font-sans">Profile</h1>
      <div className="bg-zinc-950 border border-zinc-800 rounded-sm shadow-sm overflow-hidden">
        <ProfileHeader
          username={normalizedUsername}
          profileData={profileData}
          isOwnVerifiedProfile={isOwnVerifiedProfile}
          recalculating={recalculating}
          savingToChain={savingToChain}
          isPreviewMode={isPreviewMode}
          handleRefreshAnalysis={handleRefreshAnalysis}
          handleSaveToBlockchain={handleSaveToBlockchain}
          handleRecalculate={handleRecalculate}
          setShowTokenInput={setShowTokenInput}
          showTokenInput={showTokenInput}
        />

        {showTokenInput && (
          <TokenInput
            account={account} // Pass the wallet address
            username={normalizedUsername} // Pass the username
            showZkProofSection={showZkProofSection}
            setShowZkProofSection={setShowZkProofSection}
            handleRecalculate={handleRecalculate}
            recalculating={recalculating}
            isVerifiedForUsername={isVerified}
          />
        )}

        {showZkProofSection && privateRepoData && (
          <ZKDashboard
            privateRepoData={privateRepoData}
            contract={contract}
            account={account}
            username={normalizedUsername}
            onProofsGenerated={handleProofGenerated} // Note the slight rename
          />
        )}

        <ScoreBreakdown
          profileData={profileData}
          zkProofs={zkProofs}
        />

        <BlockchainInfo
          profileData={profileData}
          account={account}
          isPreviewMode={isPreviewMode}
        />
      </div>

      <ProfileActions
        isVerified={isVerified}
        username={username}
      />
    </div>
  );
};

export default ProfileResults;