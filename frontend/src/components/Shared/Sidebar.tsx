import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const GAMES = [
  { name: 'Dice', href: '/dice', icon: '🎲', color: 'text-blue-500' },
  { name: 'Roulette', href: '/roulette', icon: '🎡', color: 'text-red-500' },
  { name: 'Mines', href: '/mines', icon: '💣', color: 'text-yellow-500' },
  { name: 'Plinko', href: '/plinko', icon: '🔻', color: 'text-pink-500' },
  { name: 'Coinflip', href: '/coinflip', icon: '🪙', color: 'text-yellow-400' },
];

export const Sidebar = () => {
  const router = useRouter();

  return (
    <>
      <style jsx>{`
        aside::-webkit-scrollbar { width: 6px; }
        aside::-webkit-scrollbar-track { background: #0a0d14; }
        aside::-webkit-scrollbar-thumb { background-color: #3b82f6; border-radius: 10px; border: 1px solid #0c0f17; }
        aside::-webkit-scrollbar-thumb:hover { background-color: #60a5fa; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
      `}</style>

      <aside className="hidden md:flex flex-col w-56 h-[calc(100vh-80px)] fixed left-0 top-20 bg-[#0c0f17] border-r border-white/5 z-40 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Casino Games</h3>
          
          <nav className="flex flex-col gap-1.5">
            {GAMES.map((game) => {
              const isActive = router.pathname === game.href;
              return (
                <Link 
                  key={game.name} 
                  href={game.href}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive ? 'bg-white/5 text-white shadow-lg border border-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]"></div>}
                  <span className={`text-lg drop-shadow-md group-hover:scale-110 transition-transform ${game.color}`}>{game.icon}</span>
                  <span className="font-bold text-sm tracking-wide">{game.name}</span>
                </Link>
              );
            })}
          </nav>
          <Link href="/account" className={`mt-5 relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${router.pathname === '/account' ? 'bg-white/5 text-white border border-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
            <span className="text-lg">◎</span><span className="font-bold text-sm tracking-wide">Account</span>
          </Link>
        </div>

        <div className="mt-auto p-4 border-t border-white/5">
          <div className="bg-gradient-to-br from-blue-900/10 to-purple-900/10 rounded-lg p-3 border border-white/5 text-center">
              <p className="text-[10px] text-blue-300 font-bold mb-0.5">RTP LIVE</p>
              <p className="text-lg font-mono font-bold text-white text-shadow-glow">98.4%</p>
          </div>
        </div>
      </aside>
    </>
  );
};
