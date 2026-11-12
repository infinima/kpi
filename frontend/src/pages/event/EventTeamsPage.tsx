import { useEventTeamsModel } from '@/pages/event/model/useEventTeamsModel';
import { EventTeamsView } from '@/pages/event/ui/EventTeamsView';

export function EventTeamsPage() { return <EventTeamsView {...useEventTeamsModel()} />; }
