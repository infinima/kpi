import {useEffect} from "react";
import NotificationCenter from "@/components/services/NotificationCenter";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import ExamplePage from "@/pages/ExamplePage";
import NotFoundPage from "@/pages/NotFoundPage";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import {useUser} from "@/store";
import EmptyLayout from "@/components/layout/EmptyLayout";
import DefaultLayout from "@/components/layout/DefaultLayout";
import NotReadyPage from "@/pages/NotReadyPage";

export default function App() {
    const fetchUser = useUser((state) => state.fetchUser);

    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token");

        if (!storedToken || useUser.getState().token) {
            return;
        }

        useUser.setState({token: storedToken, guest: false});

        void fetchUser().catch(() => {
            localStorage.removeItem("auth_token");
            useUser.setState({token: null, user: null, guest: true});
        });
    }, [fetchUser]);

    return (
        <BrowserRouter>
            <NotificationCenter />

            <Routes>
                <Route element={<EmptyLayout />}>
                    <Route path="/" element={<HomePage />} />
                </Route>

                <Route element={<DefaultLayout />}>
                    <Route path="/logs" element={<NotReadyPage pageName={"Логи"} />} />
                    <Route path="/results" element={<NotReadyPage pageName={"Страница результатов"} />} />
                    <Route path="/show" element={<NotReadyPage pageName={"Показ"} />} />
                    {/*<Route path="/users" element={<UsersPage />} />*/}
                    {/*<Route path="/teams" element={<TeamsPage/>} />*/}
                    <Route path="/tables" element={<NotReadyPage pageName={"Таблицы"} />} />
                    <Route element={""}>
                        {/*<Route path="/events" element={<EventsPage />} />*/}
                        {/*<Route path="/locations" element={<LocationsPage />} />*/}
                        {/*<Route path="/leagues" element={<LeaguesPage />} />*/}

                    </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
                <Route path="/indev" element={<NotReadyPage pageName={"В разработке"} />} />
                <Route path="/example" element={<ExamplePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
