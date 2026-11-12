import { usePermissionsCardModel } from '@/pages/account/model/usePermissionsCardModel';
import { PermissionsCardView } from '@/pages/account/ui/PermissionsCardView';
export type { PermissionRow } from './model/permissionsCardSupport';

export function PermissionsCard(props: Parameters<typeof usePermissionsCardModel>[0]) { return <PermissionsCardView {...usePermissionsCardModel(props)} />; }
