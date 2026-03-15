'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-xl font-semibold text-red-400 mb-2">Algo deu errado</h1>
      <p className="text-white/70 text-sm mb-6 max-w-md text-center">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-emerald-500 text-black rounded-full font-medium hover:bg-emerald-400 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}
