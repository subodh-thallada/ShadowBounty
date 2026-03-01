import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ProjectsList = ({ account }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    if (!account) return;

    setLoading(true);
    setError(null);

    try {
      const OAUTH_SERVER_URL = process.env.REACT_APP_OAUTH_SERVER_URL || 'http://localhost:3001';
      const response = await axios.get(
        `${OAUTH_SERVER_URL}/api/projects/user/${account}`,
        { withCredentials: true }
      );

      if (response.data && response.data.success) {
        setProjects(response.data.projects);
      } else {
        throw new Error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error.message || 'Failed to load your projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [account]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Your Projects</h1>
        <Link
          to="/project-onboarding"
          className="bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-sm text-sm font-medium transition-colors"
        >
          Add Project
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : error ? (
        <div className="bg-red-950/50 border border-red-900 rounded-sm p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-500">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchProjects}
              className="inline-flex items-center px-3 py-1 border border-zinc-700 text-sm leading-4 font-medium rounded-sm text-gray-300 bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-sm p-8 text-center shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-white">No projects</h3>
          <p className="mt-1 text-sm text-gray-400">Get started by creating a new project.</p>
          <div className="mt-6">
            <Link
              to="/project-onboarding"
              className="inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm shadow-sm text-white bg-zinc-900 hover:bg-zinc-800 hover:border-white focus:outline-none transition-colors"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Project
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block hover:border-gray-500 transition-colors duration-200 rounded-sm border border-zinc-800 overflow-hidden bg-zinc-950 shadow-sm"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-2 truncate">{project.name}</h2>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-10">{project.description || "No description available"}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="truncate group-hover:text-white transition-colors">{project.repositoryName}</span>
                </div>
              </div>
              <div className="bg-zinc-900 px-6 py-3 flex justify-between items-center border-t border-zinc-800">
                <span className="text-sm font-medium text-white">View Project</span>
                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsList;