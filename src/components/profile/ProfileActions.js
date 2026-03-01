import React from 'react';
import { Link } from 'react-router-dom';

const ProfileActions = ({ isVerified, username }) => {
  return (
    <div className="mt-6 flex flex-wrap gap-4 justify-center">
      <Link
        to="/analyze"
        className="inline-flex items-center px-6 py-3 border border-white text-xs font-mono uppercase tracking-widest text-white hover:bg-white hover:text-black focus:outline-none transition-colors rounded-none"
      >
        Analyze Another
      </Link>

      {!isVerified && (
        <Link
          to="/connect-github"
          className="inline-flex items-center px-6 py-3 border border-zinc-700 text-xs font-mono uppercase tracking-widest text-white bg-black hover:border-white focus:outline-none transition-colors rounded-none"
        >
          Verify Your GitHub
        </Link>
      )}

      <a
        href={`https://github.com/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-6 py-3 border border-zinc-700 text-xs font-mono uppercase tracking-widest text-white bg-black hover:border-white focus:outline-none transition-colors rounded-none"
      >
        View GitHub
      </a>
    </div>
  );
};

export default ProfileActions;