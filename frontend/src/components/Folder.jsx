import { useState } from "react";

const darkenColor = (hex, percent) => {
    let color = hex.startsWith("#") ? hex.slice(1) : hex;
    if (color.length === 3) {
        color = color.split("").map((c) => c + c).join("");
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
    g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
    b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export default function Folder({ color = "#6366f1", size = 0.62, open = false }) {
    const maxPapers = 3;
    const [offsets, setOffsets] = useState(Array.from({ length: maxPapers }, () => ({ x: 0, y: 0 })));

    const folderStyle = {
        "--folder-color": color,
        "--folder-back-color": darkenColor(color, 0.18),
        "--paper-1": darkenColor("#ffffff", 0.1),
        "--paper-2": darkenColor("#ffffff", 0.05),
        "--paper-3": "#ffffff",
    };

    function onPaperMove(e, index) {
        if (!open) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = (e.clientX - (rect.left + rect.width / 2)) * 0.15;
        const offsetY = (e.clientY - (rect.top + rect.height / 2)) * 0.15;
        setOffsets((prev) => prev.map((o, i) => (i === index ? { x: offsetX, y: offsetY } : o)));
    }

    function onPaperLeave(index) {
        setOffsets((prev) => prev.map((o, i) => (i === index ? { x: 0, y: 0 } : o)));
    }

    return (
        <div className="folder-scale" style={{ width: 100 * size, height: 92 * size }}>
            <div className="folder-stage" style={{ transform: `translateX(-50%) scale(${size})` }}>
                <div className={`folder ${open ? "open" : ""}`} style={folderStyle}>
                    <div className="folder__back">
                        {Array.from({ length: maxPapers }).map((_, i) => (
                            <div
                                key={i}
                                className={`paper paper-${i + 1}`}
                                onMouseMove={(e) => onPaperMove(e, i)}
                                onMouseLeave={() => onPaperLeave(i)}
                                style={open ? { "--magnet-x": `${offsets[i].x}px`, "--magnet-y": `${offsets[i].y}px` } : {}}
                            />
                        ))}
                        <div className="folder__front" />
                        <div className="folder__front right" />
                    </div>
                </div>
            </div>
        </div>
    );
}
