import React from 'react';
import ProofBadges from '../ProofBadges';

const ScoreBreakdown = ({ profileData, zkProofs }) => {
  return (
    <div className="p-6 border-t border-zinc-800">
      <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-gray-500 mb-6">Score Breakdown</h2>

      {zkProofs.length > 0 && (
        <div className="py-3 mb-4">
          <ProofBadges proofs={zkProofs} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black border border-zinc-800 p-6 rounded-none">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-2">Profile Completeness</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-white font-sans">
              {profileData.metrics.profileCompleteness}%
            </span>
          </div>
        </div>

        <div className="bg-black border border-zinc-800 p-6 rounded-none">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-2">Followers</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-white font-sans">
              {profileData.metrics.followers}
            </span>
          </div>
        </div>

        <div className="bg-black border border-zinc-800 p-6 rounded-none">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-2">Repositories</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-white font-sans">
              {profileData.metrics.repositories}
            </span>
          </div>
        </div>

        <div className="bg-black border border-zinc-800 p-6 rounded-none">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-2">Stars</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-white font-sans">
              {profileData.metrics.stars}
            </span>
          </div>
        </div>

        <div className="bg-black border border-zinc-800 p-6 rounded-none">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-2">Language Diversity</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-white font-sans">
              {profileData.metrics.languageDiversity}
            </span>
          </div>
        </div>

        <div className="bg-black border border-zinc-800 p-6 rounded-none">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-2">Has Popular Repos</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-white font-sans">
              {profileData.metrics.hasPopularRepos}
            </span>
          </div>
        </div>

        <div className="bg-black border border-zinc-800 p-6 rounded-none">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-2">Recent Activity</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-white font-sans">
              {profileData.metrics.recentActivity}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;