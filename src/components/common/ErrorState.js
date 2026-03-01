import React from 'react';
import { Link } from 'react-router-dom';

const ErrorState = ({ error }) => {
  return (
    <div className="max-w-xl mx-auto p-8 bg-zinc-950 border border-zinc-800 rounded-sm">
      <div className="text-center">
        <svg
          className="h-16 w-16 text-red-400 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 className="text-xl font-bold text-white mt-4 font-sans">{error}</h2>
        <p className="text-gray-500 mt-2">Please check the details and try again.</p>
        <Link
          to="/analyze"
          className="mt-6 inline-flex items-center px-4 py-2 border border-white text-base font-medium rounded-sm text-white hover:bg-white hover:text-black transition-colors"
        >
          Analyze a Profile
        </Link>
      </div>
    </div>
  );
};

export default ErrorState;