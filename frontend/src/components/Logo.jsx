export default function Logo({ className = "" }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FlashGenius">
            <defs>
                <linearGradient id="fgLogoGrad" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="13" fill="url(#fgLogoGrad)" />
            <path
                d="M27.5 6.5 L13.5 27.2 C13.1 27.8 13.5 28.6 14.2 28.6 L21.4 28.6 L19.2 40.4 C19.0 41.5 20.4 42.1 21.1 41.2 L34.6 21.0 C35.0 20.4 34.6 19.6 33.9 19.6 L26.9 19.6 L29.0 8.0 C29.2 6.9 27.8 6.3 27.1 7.2 Z"
                fill="#fff"
            />
            <circle cx="35.5" cy="12.5" r="1.8" fill="#fff" fillOpacity="0.85" />
        </svg>
    );
}
