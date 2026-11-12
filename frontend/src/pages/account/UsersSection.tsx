import { useUsersModel } from './model/useUsersModel';
import { UsersView } from './ui/UsersView';
export function UsersSection() { return <UsersView {...useUsersModel()} />; }
