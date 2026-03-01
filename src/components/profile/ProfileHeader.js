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
            className="h-16 w-16 rounded-none border-2 border-white"
          />
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">{username}</h1>
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white text-xs font-mono transition-colors"
            >
              GITHUB.COM/{username.toUpperCase()}
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
            className="inline-flex items-center px-4 py-2 border border-white text-xs font-mono uppercase tracking-widest text-white bg-black hover:bg-white hover:text-black focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
          >
            {recalculating ? 'Refreshing...' : 'Refresh Analysis'}
          </button>
        )}
        {isOwnVerifiedProfile && (
          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="inline-flex items-center px-4 py-2 border border-zinc-700 text-xs font-mono uppercase tracking-widest text-white hover:bg-white hover:text-black focus:outline-none transition-colors rounded-none"
          >
            {showTokenInput ? 'Hide Settings' : 'Include Private Repos'}
          </button>
        )}
        {isPreviewMode && handleSaveToBlockchain && (
          <button
            onClick={handleSaveToBlockchain}
            disabled={savingToChain}
            className="inline-flex items-center px-4 py-2 border border-white text-xs font-mono uppercase tracking-widest text-black bg-white hover:bg-black hover:text-white focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
          >
            {savingToChain ? 'Saving...' : 'Save to Blockchain'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;