import { useForgotPasswordModel } from '@/pages/auth/model/useForgotPasswordModel';
import { ForgotPasswordView } from '@/pages/auth/ui/ForgotPasswordView';

export default function ForgotPassPage() { return <ForgotPasswordView {...useForgotPasswordModel()} />; }
