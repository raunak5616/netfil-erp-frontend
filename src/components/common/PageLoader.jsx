import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Centered animated loader for lazy-loaded route components in React Suspense.
 */
const PageLoader = ({ message = 'Loading module...' }) => {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm animate-pulse">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
};

export default PageLoader;
