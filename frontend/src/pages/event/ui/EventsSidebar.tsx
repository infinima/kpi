import { useEventsSidebarModel } from '@/pages/event/model/useEventsSidebarModel';
import { EventsSidebarView } from '@/pages/event/ui/EventsSidebarView';

export default function EventsSidebar() { return <EventsSidebarView {...useEventsSidebarModel()} />; }
