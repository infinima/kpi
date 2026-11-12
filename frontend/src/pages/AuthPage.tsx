import { useAuthModel } from "./auth/model/useAuthModel";
import { AuthView } from "./auth/ui/AuthView";
export default function AuthPage({ adminOnly = false }: { adminOnly?: boolean } = {}) { return <AuthView {...useAuthModel({ adminOnly })} />; }
