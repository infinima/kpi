import { Outlet } from "react-router-dom"
import {MenuBar} from "@/components/layout/MenuBar/MenuBar"
import Background from "@/components/layout/Background";

export default function DefaultLayout() {
    return (
        <div className="min-h-screen">
            <MenuBar />
            <main>
                <Background active={false}></Background>
                <Outlet />
            </main>
            </div>
    )
}