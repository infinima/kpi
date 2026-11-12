import { useUserRightsModel } from '../model/useUserRightsModel';
import { UserRightsView } from './UserRightsView';
export function UserRightsModal(props: Parameters<typeof useUserRightsModel>[0]) { return <UserRightsView {...useUserRightsModel(props)} />; }
