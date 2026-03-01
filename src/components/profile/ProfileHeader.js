import React from 'react';

const ProfileHeader = ({
  username,
  profileData,
  isOwnVerifiedProfile,
  recalculating,
  savingToChain,
  isPreviewMode,
  handleRefreshAnalysis,
  handleSaveToBlockchain,
  handleRecalculate,
  setShowTokenInput,
  showTokenInput
}) => {
  return (
    <div className="p-6 border-b border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center">
          <img
            src={`https://github.com/${username}.png?size=100`}
            alt={`${username} GitHub avatar`}
            className="h-16 w-16 rounded-sm border-2 border-zinc-700"
          />
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">{username}</h1>
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              github.com/{username}
            </a>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col items-center">
          <div className="flex items-center">
            <div className="text-3xl font-bold text-white font-sans">{profileData.overallScore}</div>
            <div className="ml-2 text-sm font-medium text-gray-500">/100</div>
          </div>
          <div className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-widest">Shadowbounty Score</div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        {(isOwnVerifiedProfile || isPreviewMode) && (
          <button
            onClick={() => handleRecalculate(false)}
            disabled={recalculating}
            className="inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm text-white bg-zinc-950 hover:bg-zinc-800 hover:border-white focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {recalculating ? 'Refreshing...' : 'Refresh Analysis'}
          </button>
        )}
        {isOwnVerifiedProfile && (
          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-sm text-white hover:bg-white hover:text-black focus:outline-none transition-colors"
          >
            {showTokenInput ? 'Hide Token Input' : 'Include Private Repos'}
          </button>
        )}
        {isPreviewMode && handleSaveToBlockchain && (
          <button
            onClick={handleSaveToBlockchain}
            disabled={savingToChain}
            className="inline-flex items-center px-4 py-2 border border-amber-600 text-amber-400 text-sm font-medium rounded-sm bg-amber-950/50 hover:bg-amber-900/30 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingToChain ? 'Saving...' : 'Save to Blockchain'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;