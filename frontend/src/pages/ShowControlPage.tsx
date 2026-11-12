import { useShowControlModel } from '@/pages/show/model/useShowControlModel';
import { ShowControlView } from '@/pages/show/ui/ShowControlView';

export function ShowControlPage() { return <ShowControlView {...useShowControlModel()} />; }
