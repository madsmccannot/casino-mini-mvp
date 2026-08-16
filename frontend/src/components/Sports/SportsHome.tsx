import { EventCard } from './EventCard'; import { LeagueList } from './LeagueList';
export const SportsHome = ({ events }: any) => <div><LeagueList events={events}/><div className="grid gap-4 mt-4">{events.map((event: any) => <EventCard key={event.eventId} event={event}/>)}</div></div>;
