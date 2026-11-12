import { useHomeModel } from "./home/model/useHomeModel";
import { HomeView } from "./home/ui/HomeView";
export default function HomePage() { return <HomeView {...useHomeModel()} />; }
