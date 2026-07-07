import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Topbar({ children }) {
    return (
        <header className="topbar">
            <Link to="/" className="topbar-logo">
                <Logo className="topbar-logo-icon" />
                <span className="topbar-logo-name">FlashGenius</span>
            </Link>
            <div className="topbar-actions">{children}</div>
        </header>
    );
}
