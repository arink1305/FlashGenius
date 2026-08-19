
export function dueIn(iso, t) {
    if (!iso) return null;
  
    const due = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`);
    if (Number.isNaN(due.getTime())) return null;

    const ms = due.getTime() - Date.now();
    if (ms <= 0) return t("dueNow");

    const hours = ms / 3600000;
    if (hours < 1) return t("dueSoon");
    if (hours < 24) {
        const n = Math.max(1, Math.round(hours));
        return n === 1 ? t("dueOneHour") : t("dueHours", { n });
    }

    const days = Math.round(hours / 24);
    if (days === 1) return t("dueTomorrow");
    return t("dueDays", { n: days });
}
