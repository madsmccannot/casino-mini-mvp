export const LeagueList = ({ events }: any) => <div className="text-xs text-gray-500">{new Set(events.map((event: any) => event.sport)).size} competitions · {events.length} events</div>;
