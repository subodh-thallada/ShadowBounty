import React from 'react';
import { Link } from 'react-router-dom';

const ProfileActions = ({ isVerified, username }) => {
  return (
    <div className="mt-6 flex flex-wrap gap-4 justify-center">
      <Link 
        to="/analyze" 
        className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-sm text-white hover:bg-white hover:text-black focus:outline-none transition-colors"
      >
        Analyze Another Profile
      </Link>
      
      {!isVerified && (
        <Link 
          to="/connect-github" 
          className="inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm text-white bg-zinc-950 hover:bg-zinc-800 hover:border-white focus:outline-none transition-colors"
        >
          Verify Your GitHub Account
        </Link>
      )}
      
      <a 
        href={`https://github.com/${username}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-sm text-white bg-zinc-950 hover:bg-zinc-800 hover:border-white focus:outline-none transition-colors"
      >
        View GitHub Profile
      </a>
    </div>
  );
};

export default ProfileActions;