import { useCabinetModel } from './account/model/useCabinetModel';
import { CabinetView } from './account/ui/CabinetView';

export default function LkPage() { return <CabinetView {...useCabinetModel()} />; }
