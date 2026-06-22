import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Generate from "./pages/Generate";
import Study from "./pages/Study";
import Settings from "./pages/Settings";
import ChangePassword from "./pages/ChangePassword";
import Landing from "./pages/Landing";

function PrivateRoute({ children }) {
    return localStorage.getItem("token") ? children : <Navigate to="/login" />;
}

function HomeRoute() {
    return localStorage.getItem("token") ? <Dashboard /> : <Landing />;
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/generate" element={<PrivateRoute><Generate /></PrivateRoute>} />
            <Route path="/study/:deckId" element={<PrivateRoute><Study /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
        </Routes>
    );
}
