import { useScannerModel } from '@/pages/qr/model/useScannerModel';
import { ScannerView } from '@/pages/qr/ui/ScannerView';

export function ReadQrPage() { return <ScannerView {...useScannerModel()} />; }
