import type { NextPage } from 'next';
import Link from 'next/link';
import { useUIStore } from '../state/uiStore';
import { useMemo } from 'react';

const Home: NextPage = () => {
  const { t, language } = useUIStore(); 

  const gamesRow1 = useMemo(() => [
    { 
      id: 'coinflip', 
      name: t('game_coinflip') || "COINFLIP", 
      icon: '🪙', 
      desc: t('desc_coinflip') || "Double your SOL",
      color: 'yellow',
      gradient: 'from-yellow-900/40 to-black',
      hoverGradient: 'group-hover:from-yellow-600 group-hover:to-yellow-900',
      borderGlow: 'group-hover:shadow-yellow-500/50'
    },
    { 
      id: 'dice', 
      name: t('game_dice') || "DICE", 
      icon: '🎲', 
      desc: t('desc_dice') || "Roll and Win",
      color: 'emerald',
      gradient: 'from-emerald-900/40 to-black',
      hoverGradient: 'group-hover:from-emerald-600 group-hover:to-emerald-900',
      borderGlow: 'group-hover:shadow-emerald-500/50'
    },
    { 
      id: 'roulette', 
      name: t('game_roulette') || "ROULETTE", 
      icon: '🎰', 
      desc: t('desc_roulette') || "Spin the Wheel",
      color: 'red',
      gradient: 'from-red-900/40 to-black',
      hoverGradient: 'group-hover:from-red-600 group-hover:to-red-900',
      borderGlow: 'group-hover:shadow-red-500/50'
    },
  ], [language, t]);

  const gamesRow2 = useMemo(() => [
    { 
      id: 'plinko', 
      name: t('game_plinko') || "PLINKO", 
      icon: '🎯', 
      desc: t('desc_plinko') || "Drop & Multiply",
      color: 'pink',
      gradient: 'from-pink-900/40 to-black',
      hoverGradient: 'group-hover:from-pink-600 group-hover:to-pink-900',
      borderGlow: 'group-hover:shadow-pink-500/50'
    },
    { 
      id: 'mines', 
      name: t('game_mines') || "MINES", 
      icon: '💣', 
      desc: t('desc_mines') || "Don't Explode",
      color: 'blue',
      gradient: 'from-blue-900/40 to-black',
      hoverGradient: 'group-hover:from-blue-600 group-hover:to-blue-900',
      borderGlow: 'group-hover:shadow-blue-500/50'
    },
  ], [language, t]);

  const HexagonCard = ({ game }: { game: any }) => (
    <Link href={`/${game.id}`} className="group relative block mx-1 z-0 hover:z-20 transition-all duration-300">
      <div 
        className={`absolute inset-0 bg-${game.color}-600 opacity-0 group-hover:opacity-40 blur-2xl transition-opacity duration-300 -z-10`}
        style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
      />
      <div 
        className={`w-[200px] h-[230px] md:w-[240px] md:h-[277px] relative transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-2 filter drop-shadow-xl ${game.borderGlow}`}
        style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-gray-500 via-gray-700 to-black p-[2px]">
          <div className={`w-full h-full bg-[#0c0f17] bg-gradient-to-b ${game.gradient} ${game.hoverGradient} flex flex-col items-center justify-center relative overflow-hidden text-center px-2 transition-all duration-500`}>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="text-5xl md:text-6xl mb-2 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {game.icon}
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-1 drop-shadow-md z-10">
              {game.name}
            </h3>
            <p className="text-[10px] md:text-xs font-bold text-white/80 uppercase tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 absolute bottom-12 z-10">
              {game.desc}
            </p>
            <div className={`absolute bottom-6 w-8 h-1 bg-white/20 rounded-full group-hover:bg-white transition-colors shadow-[0_0_10px_currentColor]`} />
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 overflow-hidden relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[128px] pointer-events-none" />

      <div className="text-center mb-10 animate-fade-in max-w-2xl mx-auto z-10">
        <h2 className="text-sm font-bold tracking-[0.3em] text-blue-400 mb-4 uppercase drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">
          {t('hero_pre')}
        </h2>
        
        <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tighter leading-none drop-shadow-2xl">
          <span className="block bg-gradient-to-b from-white via-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
            {t('hero_line1')}
          </span>
          <span className="block text-[#4169E1] drop-shadow-[0_0_35px_rgba(65,105,225,0.6)]">
            {t('hero_line2')}
          </span>
        </h1>

        <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
          {t('hero_subtitle')}
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-center z-10 pb-20 scale-90 md:scale-100">
        <div className="flex justify-center items-center">
          {gamesRow1.map(game => <HexagonCard key={game.id} game={game} />)}
        </div>
        <div className="flex justify-center items-center -mt-[50px] md:-mt-[55px]">
          {gamesRow2.map(game => <HexagonCard key={game.id} game={game} />)}
        </div>
      </div>
    </div>
  );
};

export default Home;