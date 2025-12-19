import React from 'react';

interface GameCardProps {
  title: string;
  imageUrl: string;
  onClick?: () => void;
}

export const GameCard = ({ title, imageUrl, onClick }: GameCardProps) => {
  return (
    <div 
      onClick={onClick}
      className="group relative w-[240px] h-[280px] cursor-pointer transition-transform duration-300 hover:-translate-y-2"
      style={{ filter: 'drop-shadow(0px 0px 0px rgba(0,0,0,0))' }} 
    >
      <div 
        className="w-full h-full relative overflow-hidden bg-slate-700 transition-all duration-300 group-hover:bg-slate-600"
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
      >
        <div className="absolute inset-0">
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 blur-[1px] group-hover:blur-0"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-slate-900 group-hover:opacity-50 transition-opacity" />
        </div>

        <div 
          className="absolute inset-[3px] border-[3px] border-slate-500/30 z-20 pointer-events-none group-hover:border-cyan-400/60 transition-colors duration-300"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        />

        <div className="absolute bottom-0 w-full h-1/2 flex flex-col items-center justify-end pb-8 z-30 bg-gradient-to-t from-black/90 to-transparent">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest drop-shadow-md group-hover:text-cyan-400 transition-colors">
            {title}
          </h3>
          <div className="h-1 w-0 bg-cyan-400 mt-2 transition-all duration-300 group-hover:w-16 rounded-full" />
        </div>
      </div>
      
      <div 
        className="absolute inset-0 bg-cyan-500 opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-300 -z-10"
        style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              transform: 'scale(1.05)'
        }}
      />
    </div>
  );
};