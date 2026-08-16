import { useEffect, useMemo, useState } from 'react';
import { SportsLayout } from '../../components/Sports/SportsLayout';
import { LiveEventCard } from '../../components/Sports/LiveEventCard';
import { sportsbookClient } from '../../services/sportsbookClient';
import { useSportsStore } from '../../state/sportsStore';

export default function LiveSportsPage() {
  const { events, setEvents } = useSportsStore();
  const [sport, setSport] = useState('all');
  useEffect(() => { sportsbookClient.events('?live=true').then(data => setEvents(data.events)).catch(() => setEvents([])); }, [setEvents]);
  const sports = useMemo(() => [...new Set(events.map((event: any) => event.sport as string))], [events]);
  const visible = sport === 'all' ? events : events.filter((event: any) => event.sport === sport);
  return <SportsLayout><div className="flex items-center justify-between mb-4"><div><h2 className="text-2xl font-black">LIVE NOW</h2><p className="text-xs text-gray-500">Versioned prices · instant suspension · provider acceptance</p></div><span className="text-red-400 font-bold animate-pulse">● {visible.length} LIVE</span></div><div className="flex gap-2 overflow-x-auto mb-4"><button onClick={() => setSport('all')} className={`px-3 py-2 rounded-lg text-xs ${sport === 'all' ? 'bg-red-600' : 'bg-[#172533]'}`}>ALL</button>{sports.map(value => <button key={value} onClick={() => setSport(value)} className={`px-3 py-2 rounded-lg text-xs uppercase whitespace-nowrap ${sport === value ? 'bg-red-600' : 'bg-[#172533]'}`}>{value.replaceAll('_', ' ')}</button>)}</div><div className="grid gap-4">{visible.map((event: any) => <LiveEventCard key={event.eventId} event={event}/>)}</div>{!visible.length && <p className="text-gray-500">No live events are currently available.</p>}</SportsLayout>;
}
