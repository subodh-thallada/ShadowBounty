import React, { useState } from 'react';
import BountyCreationModal from './BountyCreationModal';

const IssueList = ({ issues, bounties, onCreateBounty, isProjectOwner }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filter, setFilter] = useState('all');

  // Check if an issue already has a bounty
  const hasBounty = (issueNumber) => {
    return bounties.some(bounty => bounty.issueNumber === issueNumber);
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    if (filter === 'withBounty') return hasBounty(issue.number);
    if (filter === 'withoutBounty') return !hasBounty(issue.number);
    return true; // 'all'
  });

  const handleCreateBounty = (issue) => {
    setSelectedIssue(issue);
    setShowModal(true);
  };

  const submitBounty = (bountyAmount, difficultyLevel) => {
    onCreateBounty(selectedIssue.id, bountyAmount, difficultyLevel);
    setShowModal(false);
  };

  return (
    <div>
      {/* Filter Controls */}
      <div className="flex justify-between mb-4">
        <div className="flex">
          <button
            className={`px-4 py-2 text-sm font-medium !rounded-none rounded-l-sm ${filter === 'all'
                ? 'bg-zinc-800 text-white border-zinc-700'
                : 'bg-zinc-950 text-gray-400 hover:bg-zinc-900 border-zinc-800'
              } border`}
            onClick={() => setFilter('all')}
          >
            All Issues
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium !rounded-none ${filter === 'withBounty'
                ? 'bg-zinc-800 text-white'
                : 'bg-zinc-950 text-gray-400 hover:bg-zinc-900'
              } border-t border-b border-zinc-800`}
            onClick={() => setFilter('withBounty')}
          >
            With Bounty
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium !rounded-none rounded-r-sm ${filter === 'withoutBounty'
                ? 'bg-zinc-800 text-white border-zinc-700'
                : 'bg-zinc-950 text-gray-400 hover:bg-zinc-900 border-zinc-800'
              } border`}
            onClick={() => setFilter('withoutBounty')}
          >
            Without Bounty
          </button>
        </div>
      </div>

      {/* Issues Table */}
      <div className="overflow-x-auto rounded-sm border border-zinc-800 shadow-sm">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Issue
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-zinc-950 divide-y divide-zinc-800">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-zinc-900 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-white">
                          <a href={issue.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline transition-colors">
                            #{issue.number}: {issue.title}
                          </a>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1">
                          {issue.labels.map(label => (
                            <span
                              key={label.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs border"
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
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-sm border ${issue.state === 'open'
                          ? 'bg-green-950/50 text-green-400 border-green-900'
                          : 'bg-zinc-900 text-gray-400 border-zinc-800'
                        }`}
                    >
                      {issue.state}
                    </span>
                    {hasBounty(issue.number) && (
                      <span className="ml-2 px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-sm border bg-purple-950/50 text-purple-400 border-purple-900">
                        Bounty
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isProjectOwner && !hasBounty(issue.number) && (
                      <button
                        onClick={() => handleCreateBounty(issue)}
                        className="text-white hover:text-gray-300 hover:underline transition-colors"
                      >
                        Create Bounty
                      </button>
                    )}
                    {hasBounty(issue.number) && (
                      <span className="text-gray-500">Bounty Created</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 bg-zinc-950">
                  No issues found matching the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bounty Creation Modal */}
      {showModal && selectedIssue && (
        <BountyCreationModal
          issue={selectedIssue}
          onClose={() => setShowModal(false)}
          onSubmit={submitBounty}
        />
      )}
    </div>
  );
};

export default IssueList;