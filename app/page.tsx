'use client';

import dynamic from 'next/dynamic';

const PitchDeckContent = dynamic(() => import('./PitchDeckContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center font-sans">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-white/70">Carregando Inviagem...</p>
    </div>
  ),
});

export default function Home() {
  return <PitchDeckContent />;
}
