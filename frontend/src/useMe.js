import { useState, useEffect } from "react";
import api from "./api";

export const TIER_ORDER = { free: 0, plus: 1, pro: 2, ultra: 3 };

let cache = null;

export function clearMe() {
    cache = null;
}

export async function refreshMe() {
    const res = await api.get("/auth/me");
    cache = res.data;
    return cache;
}

export function useMe() {
    const [me, setMe] = useState(cache);

    useEffect(() => {
        if (cache) return;
        if (!localStorage.getItem("token")) return;
        let alive = true;
        api.get("/auth/me")
            .then((res) => {
                cache = res.data;
                if (alive) setMe(res.data);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    return me;
}

export function hasTier(me, minimum) {
    return TIER_ORDER[me?.tier || "free"] >= TIER_ORDER[minimum];
}
