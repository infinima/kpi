import { useTeamInfoModel } from '../model/useTeamInfoModel';
import { TeamInfoView } from './TeamInfoView';
export function TeamInfoModal(props: Parameters<typeof useTeamInfoModel>[0]) { return <TeamInfoView {...useTeamInfoModel(props)} />; }
