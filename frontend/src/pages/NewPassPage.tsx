import { useNewPasswordModel } from '@/pages/auth/model/useNewPasswordModel';
import { NewPasswordView } from '@/pages/auth/ui/NewPasswordView';

export default function NewPassPage() { return <NewPasswordView {...useNewPasswordModel()} />; }
