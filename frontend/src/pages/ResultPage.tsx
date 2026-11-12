import { useFinalResultsModel } from '@/pages/results/model/useFinalResultsModel';
import { FinalResultsView } from '@/pages/results/ui/FinalResultsView';

export function ResultPage() { return <FinalResultsView {...useFinalResultsModel()} />; }
