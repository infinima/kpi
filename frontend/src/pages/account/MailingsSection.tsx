import { useMailingsModel } from './model/useMailingsModel';
import { MailingsView } from './ui/MailingsView';
export function MailingsSection() { return <MailingsView {...useMailingsModel()} />; }
