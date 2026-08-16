import Link from 'next/link';
const sports = ['football','basketball','tennis','ice_hockey','baseball','american_football','mma','boxing','motorsport','cricket','esports'];
export const SportSidebar = () => <aside className="flex md:flex-col gap-2 overflow-auto">{sports.map(sport => <Link key={sport} href={`/sports/${sport}`} className="px-3 py-2 rounded-lg bg-[#101b27] text-xs uppercase whitespace-nowrap hover:bg-blue-600">{sport.replaceAll('_', ' ')}</Link>)}</aside>;
