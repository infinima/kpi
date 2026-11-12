import { useLogsModel } from '@/pages/logs/model/useLogsModel';
import { LogsView } from '@/pages/logs/ui/LogsView';

export function LogsPage(props: Parameters<typeof useLogsModel>[0]) { return <LogsView {...useLogsModel(props)} />; }
