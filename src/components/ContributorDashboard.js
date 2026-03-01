import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGithub, FaStar, FaCode, FaHistory } from 'react-icons/fa';

const ContributorDashboard = ({ account, contract, profileContract }) => {
  const [profileData, setProfileData] = useState(null);
  const [activeBounties, setActiveBounties] = useState([]);
  const [completedBounties, setCompletedBounties] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!account || !contract || !profileContract) {
        setError(!account ? "WALLET_REQUIRED" : "Please connect your wallet and ensure you're on the correct network.");
        setLoading(false);
        return;
      }

      try {
        const [username, verified] = await profileContract.getWalletGitHubInfo(account);

        if (!username || !verified) {
          setError("GitHub account not connected.");
          setLoading(false);
          return;
        }

        const profile = await profileContract.getProfileScore(username);
        const activeBountiesData = await contract.getContributorActiveBounties(account);
        const completedBountiesData = await contract.getContributorCompletedBounties(account);

        const totalEarnings = completedBountiesData.reduce(
          (sum, bounty) => sum + Number(bounty.amount),
          0
        );

        setProfileData({
          username,
          score: profile.overallScore,
          followers: profile.followers,
          repoCount: profile.repoCount,
          totalStars: profile.totalStars,
          languageDiversity: profile.languageDiversity,
          recentActivity: profile.recentActivity
        });

        setActiveBounties(activeBountiesData);
        setCompletedBounties(completedBountiesData);
        setEarnings(totalEarnings);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("DATA_FETCH_FAILED");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [account, contract, profileContract]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-white text-sm font-mono uppercase tracking-widest border border-zinc-800 p-4 bg-zinc-950">
          LOADING_DASHBOARD_DATA...
        </div>
      </div>
    );
  }

  if (error) {
    const isWalletRequired = error === "WALLET_REQUIRED";
    return (
      <div className="max-w-6xl mx-auto mt-8 px-4">
        <div className="bg-black border border-white text-white px-4 py-8 mb-4">
          <h2 className="text-xl font-bold uppercase mb-2">Error</h2>
          <p className="font-mono text-sm text-gray-400 mb-6">
            {isWalletRequired ? "Please connect your wallet to view the contributor dashboard." : error}
          </p>
          <Link
            to={isWalletRequired ? "/" : "/connect-github"}
            className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors font-mono uppercase tracking-wide text-sm"
          >
            {isWalletRequired ? "CONNECT_WALLET" : "CONNECT_GITHUB"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4 font-mono">
      <div className="flex justify-between items-end mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-4xl font-bold tracking-tighter text-white uppercase font-sans">Dashboard</h1>
        <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">
          {profileData?.username} • {account.substring(0, 8)}...
        </span>
      </div>

      {/* Profile Overview - Boxy & High Contrast */}
      <div className="bg-black border border-zinc-800 mb-8 p-0 grid grid-cols-1 lg:grid-cols-4">
        <div className="p-8 border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col justify-center items-start">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 bg-white flex items-center justify-center">
              <FaGithub className="h-8 w-8 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight font-sans">{profileData?.username}</h2>
              <p className="text-sm font-mono text-gray-400 uppercase">CONTRIBUTOR</p>
            </div>
          </div>
          <div className="mt-4 w-full">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs font-mono uppercase text-gray-500 tracking-wider">SCORE</span>
              <span className="text-2xl font-bold text-white font-sans">{profileData?.score}/100</span>
            </div>
            {/* Boxy Progress Bar */}
            <div className="h-2 w-full bg-zinc-900 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-1000 ease-out"
                style={{ width: `${profileData?.score}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3">
          <div className="p-8 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col justify-center">
            <span className="text-5xl font-bold text-white mb-2 font-sans">{profileData?.followers}</span>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">FOLLOWERS</span>
          </div>
          <div className="p-8 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col justify-center">
            <span className="text-5xl font-bold text-white mb-2 font-sans">{profileData?.repoCount}</span>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">REPOSITORIES</span>
          </div>
          <div className="p-8 flex flex-col justify-center">
            <span className="text-5xl font-bold text-white mb-2 font-sans">{profileData?.totalStars}</span>
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">STARS_TOTAL</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-black border border-zinc-800 p-6 flex flex-col h-32 justify-between group hover:border-white transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest group-hover:text-gray-300">ACTIVE_BOUNTIES</span>
            <span className="text-xs font-mono text-white bg-zinc-900 border border-zinc-800 px-2 py-1">OPEN</span>
          </div>
          <span className="text-4xl font-bold text-white font-sans">{activeBounties.length}</span>
        </div>
        <div className="bg-black border border-zinc-800 p-6 flex flex-col h-32 justify-between group hover:border-white transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest group-hover:text-gray-300">COMPLETED_BOUNTIES</span>
            <span className="text-xs font-mono text-white bg-zinc-900 border border-zinc-800 px-2 py-1">DONE</span>
          </div>
          <span className="text-4xl font-bold text-white font-sans">{completedBounties.length}</span>
        </div>
        <div className="bg-black border border-zinc-800 p-6 flex flex-col h-32 justify-between group hover:border-white transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest group-hover:text-gray-300">TOTAL_EARNINGS</span>
            <span className="text-xs font-mono text-white bg-zinc-900 border border-zinc-800 px-2 py-1">ETH</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white font-sans">{earnings}</span>
          </div>
        </div>
      </div>

      {/* Bounties Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

        {/* Active Bounties */}
        <div className="border border-zinc-800 bg-black">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950">
            <h3 className="text-sm font-mono text-white uppercase tracking-widest">ACTIVE_WORK</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {activeBounties.length === 0 ? (
              <div className="p-12 pl-6 flex flex-col justify-center items-start">
                <p className="text-gray-500 font-mono text-sm mb-6">NO_ACTIVE_BOUNTIES_FOUND</p>
                <Link
                  to="/explore-bounties"
                  className="text-xs font-mono text-white uppercase tracking-wider border-b border-white hover:text-gray-300 hover:border-gray-300 pb-1"
                >
                  [ EXPLORE_BOUNTIES ]
                </Link>
              </div>
            ) : (
              activeBounties.map(bounty => (
                <div key={bounty.id} className="p-6 group hover:bg-zinc-950 transition-colors flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold font-sans text-white text-lg tracking-tight mb-2 group-hover:underline">
                      <Link to={`/bounties/${bounty.projectId}/${bounty.issueId}`}>{bounty.issueTitle}</Link>
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-500 mb-2">
                      <span className="border border-zinc-800 px-2 py-1 text-white">{bounty.projectName}</span>
                      <span>ASSIGNED: {new Date(bounty.assignedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="block text-xl font-bold font-sans text-white">{bounty.amount}</span>
                    <span className="block text-xs font-mono text-gray-500">ETH</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Bounties */}
        <div className="border border-zinc-800 bg-black">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950">
            <h3 className="text-sm font-mono text-white uppercase tracking-widest">COMPLETED_WORK</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {completedBounties.length === 0 ? (
              <div className="p-12 pl-6 flex flex-col justify-center items-start">
                <p className="text-gray-500 font-mono text-sm">NO_COMPLETED_HISTORY</p>
              </div>
            ) : (
              completedBounties.map(bounty => (
                <div key={bounty.id} className="p-6 group hover:bg-zinc-950 transition-colors flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold font-sans text-white text-lg tracking-tight mb-2 group-hover:underline">
                      <Link to={`/bounties/${bounty.projectId}/${bounty.issueId}`}>{bounty.issueTitle}</Link>
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-500 mb-2">
                      <span className="border border-zinc-800 px-2 py-1 text-white">{bounty.projectName}</span>
                      <span>COMPLETED: {new Date(bounty.completedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="block text-xl font-bold text-white font-sans">{bounty.amount}</span>
                    <span className="block text-xs font-mono text-gray-500">ETH</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContributorDashboard;