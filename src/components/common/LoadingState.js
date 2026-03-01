import React from 'react';

const LoadingState = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-gray-400 font-mono text-sm uppercase tracking-wider">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;