import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewSet from "./pages/NewSet";
import Generate from "./pages/Generate";
import Study from "./pages/Study";
import Quiz from "./pages/Quiz";
import Summary from "./pages/Summary";
import Mindmap from "./pages/Mindmap";
import Settings from "./pages/Settings";
import ChangePassword from "./pages/ChangePassword";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Stats from "./pages/Stats";
import SmartStudy from "./pages/SmartStudy";
import SharedDeck from "./pages/SharedDeck";

function PrivateRoute({ children }) {
    return localStorage.getItem("token") ? children : <Navigate to="/login" />;
}

function HomeRoute() {
    return localStorage.getItem("token") ? <Dashboard /> : <Landing />;
}

export default function App() {
    const location = useLocation();
    return (
        <>
            <div className="bg-blobs" aria-hidden="true">
                <span className="blob blob-1" />
                <span className="blob blob-2" />
                <span className="blob blob-3" />
            </div>
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                    <Routes location={location}>
                        <Route path="/" element={<HomeRoute />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/s/:shareToken" element={<SharedDeck />} />
                        <Route path="/new" element={<PrivateRoute><NewSet /></PrivateRoute>} />
                        <Route path="/generate/:type" element={<PrivateRoute><Generate /></PrivateRoute>} />
                        <Route path="/study/:deckId" element={<PrivateRoute><Study /></PrivateRoute>} />
                        <Route path="/smart/:deckId" element={<PrivateRoute><SmartStudy /></PrivateRoute>} />
                        <Route path="/quiz/:deckId" element={<PrivateRoute><Quiz /></PrivateRoute>} />
                        <Route path="/summary/:deckId" element={<PrivateRoute><Summary /></PrivateRoute>} />
                        <Route path="/mindmap/:deckId" element={<PrivateRoute><Mindmap /></PrivateRoute>} />
                        <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
                        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
                    </Routes>
                </motion.div>
            </AnimatePresence>
        </>
    );
}
