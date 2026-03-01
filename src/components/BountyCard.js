import React from 'react';
import { Link } from 'react-router-dom';
import { FaCodeBranch, FaTag } from 'react-icons/fa';
import { formatTokenAmount, calculateEligibleAmount } from '../utils/ethersUtils';

const BountyCard = ({ bounty, profileScore, isApplied = false }) => {
  // Format difficulty level with proper capitalization
  const formatDifficulty = (level) => {
    if (!level) return '';
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  // Get eligible amount based on profile score
  const eligibleAmount = calculateEligibleAmount(profileScore, bounty.amount);

  // Format the bounty amount to display
  const displayAmount = formatTokenAmount(bounty.amount);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-sm shadow-sm hover:border-gray-500 transition-colors duration-200">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
              {bounty.title}
            </h3>
            <div className="text-sm text-gray-400 mb-3 flex items-center">
              <FaCodeBranch className="mr-1 text-gray-500" />
              {bounty.projectName}

              {bounty.difficultyLevel && (
                <>
                  <span className="mx-2">•</span>
                  <FaTag className="mr-1 text-gray-500" />
                  {formatDifficulty(bounty.difficultyLevel)}
                </>
              )}
            </div>
          </div>

          <div className="ml-4 flex flex-col items-end">
            <div className="text-2xl font-semibold text-white">{displayAmount}</div>
          </div>
        </div>

        {profileScore !== null && (
          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-sm p-3 text-sm text-gray-300">
            {isApplied ? (
              <div className="font-medium">
                You've applied for this bounty
              </div>
            ) : (
              <>
                <span className="font-medium text-white">You're eligible for: </span>
                {eligibleAmount.percentage} ({eligibleAmount.amount} tokens)
              </>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <div>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium border
                ${bounty.status === 'OPEN' ? 'bg-green-950/50 text-green-400 border-green-900' :
                  bounty.status === 'ASSIGNED' ? 'bg-yellow-950/50 text-yellow-400 border-yellow-900' :
                    bounty.status === 'COMPLETED' ? 'bg-blue-950/50 text-blue-400 border-blue-900' :
                      'bg-zinc-900 text-gray-400 border-zinc-800'
                }
              `}
            >
              {bounty.status}
            </span>
          </div>

          <Link
            to={`/bounties/${bounty.projectId}/${bounty.issueId}`}
            className="inline-flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BountyCard;