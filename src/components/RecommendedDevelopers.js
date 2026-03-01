import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGithub, FaStar, FaCode, FaUser } from 'react-icons/fa';

const RecommendedDevelopers = ({ projectId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [projectLanguages, setProjectLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchRecommendations();
    }
  }, [projectId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError('');
      const OAUTH_SERVER_URL = process.env.REACT_APP_OAUTH_SERVER_URL || 'http://localhost:3001';
      const response = await axios.get(
        `${OAUTH_SERVER_URL}/api/projects/${projectId}/recommended-developers`,
        { withCredentials: true }
      );
      if (response.data?.success) {
        setRecommendations(response.data.recommendations || []);
        setProjectLanguages(response.data.projectLanguages || []);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Failed to load developer recommendations.');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-950/30 border border-amber-800 text-amber-400 p-4 rounded-sm">
        {error}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FaUser className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p className="font-medium">No developer recommendations yet</p>
        <p className="text-sm mt-2">
          Add <code className="bg-zinc-800 px-1 rounded">CURATED_DEVELOPER_USERNAMES</code> to your server .env
          (comma-separated GitHub usernames or profile URLs), or ensure developers have analyzed their profiles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projectLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-gray-500 text-sm">Project uses:</span>
          {projectLanguages.map(lang => (
            <span key={lang} className="px-2 py-0.5 bg-zinc-800 text-gray-300 rounded text-sm">
              {lang}
            </span>
          ))}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((dev, idx) => (
          <div
            key={dev.username}
            className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-4 hover:border-zinc-600 transition-colors"
          >
            <div className="flex items-start gap-3">
              <img
                src={dev.avatarUrl}
                alt={dev.username}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-xs font-mono">#{idx + 1}</span>
                  <a
                    href={dev.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:text-yellow-400 truncate"
                  >
                    {dev.username}
                  </a>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                  <span className="flex items-center gap-1" title="Relevance">
                    <FaCode className="text-yellow-500" /> {dev.relevanceScore}
                  </span>
                  {dev.overallScore > 0 && (
                    <span title="On-chain score">{dev.overallScore}/100</span>
                  )}
                  <span className="flex items-center gap-1">
                    <FaStar className="text-amber-400" /> {dev.totalStars}
                  </span>
                </div>
                {dev.matchingLanguages?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {dev.matchingLanguages.map(lang => (
                      <span
                        key={lang}
                        className="px-2 py-0.5 bg-green-900/40 text-green-400 rounded text-xs"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                )}
                {dev.allLanguages?.length > 0 && dev.matchingLanguages?.length < dev.allLanguages?.length && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dev.allLanguages.filter(l => !dev.matchingLanguages?.includes(l)).slice(0, 4).map(lang => (
                      <span key={lang} className="px-1.5 py-0.5 bg-zinc-800 text-gray-500 rounded text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <a
              href={dev.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2 text-sm border border-zinc-700 rounded-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <FaGithub /> View profile
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedDevelopers;
