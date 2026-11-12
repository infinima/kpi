import { useTeamQrModel } from '@/pages/qr/model/useTeamQrModel';
import { TeamQrView } from '@/pages/qr/ui/TeamQrView';

export function TeamQrPage() { return <TeamQrView {...useTeamQrModel()} />; }
