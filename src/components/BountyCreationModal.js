import React, { useState } from 'react';

const BountyCreationModal = ({ issue, onClose, onSubmit }) => {
  const [bountyAmount, setBountyAmount] = useState(50);
  const [difficultyLevel, setDifficultyLevel] = useState('medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(bountyAmount, difficultyLevel);
  };

  // Generate suggested amount based on difficulty
  const suggestedAmounts = {
    easy: 30,
    medium: 50,
    hard: 80,
    expert: 120
  };

  const updateDifficulty = (level) => {
    setDifficultyLevel(level);
    setBountyAmount(suggestedAmounts[level]);
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-zinc-950 border border-zinc-800 rounded-sm text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-zinc-950 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-white">
                    Create Bounty for Issue #{issue.number}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-300 mb-4">
                      {issue.title}
                    </p>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Difficulty Level
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {['easy', 'medium', 'hard', 'expert'].map((level) => (
                          <button
                            key={level}
                            type="button"
                            className={`py-2 px-3 text-sm font-medium rounded-sm border transition-colors ${difficultyLevel === level
                                ? level === 'easy' ? 'bg-green-900/50 text-green-400 border-green-800' :
                                  level === 'medium' ? 'bg-yellow-900/50 text-yellow-400 border-yellow-800' :
                                    level === 'hard' ? 'bg-red-900/50 text-red-400 border-red-800' :
                                      'bg-purple-900/50 text-purple-400 border-purple-800'
                                : 'bg-zinc-900 text-gray-400 border-zinc-700 hover:bg-zinc-800 hover:text-white'
                              }`}
                            onClick={() => updateDifficulty(level)}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bounty Amount (Tokens)
                      </label>
                      <div className="mt-1 relative rounded-sm shadow-sm">
                        <input
                          type="number"
                          value={bountyAmount}
                          onChange={(e) => setBountyAmount(Number(e.target.value))}
                          className="focus:ring-white focus:border-white block w-full pl-3 pr-16 py-2 sm:text-sm border-zinc-700 bg-zinc-900 text-white rounded-sm outline-none transition-colors"
                          placeholder="50"
                          min="10"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">
                            tokens
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 bg-zinc-900 border border-zinc-800 p-4 rounded-sm">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Contributor Score Requirements</h4>
                      <p className="text-xs text-gray-400">
                        Bounty will be available to contributors based on their profile score:
                      </p>
                      <ul className="text-xs text-gray-400 mt-2 pl-5 list-disc space-y-1">
                        <li>Score 0-20: <span className="text-white">10 tokens</span></li>
                        <li>Score 20-40: <span className="text-white">20 tokens</span></li>
                        <li>Score 40-60: <span className="text-white">40 tokens</span></li>
                        <li>Score 60-80: <span className="text-white">60 tokens</span></li>
                        <li>Score 80-100: <span className="text-white font-medium">{bountyAmount} tokens</span> (full amount)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-sm border border-transparent shadow-sm px-4 py-2 bg-white text-base font-medium text-black hover:bg-gray-200 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
              >
                Create Bounty
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-sm border border-zinc-700 shadow-sm px-4 py-2 bg-zinc-950 text-base font-medium text-gray-300 hover:bg-zinc-800 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BountyCreationModal;