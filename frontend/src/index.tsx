import ReactDOM from "react-dom/client";
import { Application } from "./app/Application";
import { configureRealtime } from "./shared/realtime/runtime";
import "./shared/styles/global.css";

configureRealtime("https://api.dev.kpiturnir.ru");
ReactDOM.createRoot(document.getElementById("root")!).render(<Application />);
