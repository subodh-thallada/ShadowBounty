import React from 'react';
import ProofBadges from '../ProofBadges';

const ScoreBreakdown = ({ profileData, zkProofs }) => {
  return (
    <div className="p-6 border-t border-zinc-800">
      <h2 className="text-lg font-semibold text-white mb-4 font-sans">Score Breakdown</h2>

      {zkProofs.length > 0 && (
        <div className="py-3 mb-4">
          <ProofBadges proofs={zkProofs} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">Profile Completeness</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-semibold text-white font-sans">
              {profileData.metrics.profileCompleteness}%
            </span>
            <span className="ml-2 text-sm text-gray-500">
              Personal details & bio
            </span>
          </div>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">Followers</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-semibold text-white font-sans">
              {profileData.metrics.followers}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              GitHub followers
            </span>
          </div>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">Repositories</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-semibold text-white font-sans">
              {profileData.metrics.repositories}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              {profileData.includesPrivateRepos ? 'All repos' : 'Public repos'}
            </span>
          </div>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">Stars</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-semibold text-white font-sans">
              {profileData.metrics.stars}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              Total across all repos
            </span>
          </div>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">Language Diversity</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-semibold text-white font-sans">
              {profileData.metrics.languageDiversity}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              Different languages used
            </span>
          </div>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">Has Popular Repos</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-semibold text-white font-sans">
              {profileData.metrics.hasPopularRepos}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              Repos with 10+ stars
            </span>
          </div>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">Recent Activity</div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-semibold text-white font-sans">
              {profileData.metrics.recentActivity}/100
            </span>
            <span className="ml-2 text-sm text-gray-500">
              Based on recent events
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;