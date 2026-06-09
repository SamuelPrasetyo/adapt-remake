import { useState } from "react";
import { Link } from "@inertiajs/react";
import Icon from "./Icon";

function roleAllowed(requires, { isAdmin, isAdmin021, isMentor }) {
    if (!requires) return true;
    if (requires === "admin021") return isAdmin021;
    if (requires === "admin") return isAdmin;
    if (requires === "mentor_only") return isMentor;
    if (requires === "mentor_or_admin021") return isMentor || isAdmin021;
    return true;
}

function Badge({ count }) {
    if (!count) return null;
    return (
        <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {count > 99 ? "99+" : count}
        </span>
    );
}

export default function NavGroup({ item, currentUrl, user, badges = {} }) {
    const roles = {
        isAdmin: user?.type === "Admin",
        isAdmin021: user?.type === "Admin" && user?.company_code === "021",
        isMentor: user?.type === "Mentor",
    };

    const visibleChildren = item.children.filter((c) => roleAllowed(c.requires, roles));

    // Hooks harus dipanggil sebelum early-return mana pun.
    const hasActive = visibleChildren.some(
        (c) => currentUrl === c.match || currentUrl.startsWith(c.match + "/")
    );
    const [open, setOpen] = useState(hasActive);

    if (!roleAllowed(item.requires, roles)) return null;
    if (visibleChildren.length === 0) return null;

    // Total badge grup = jumlah seluruh badge child (ditampilkan saat grup tertutup).
    const groupTotal = visibleChildren.reduce(
        (sum, c) => sum + (c.badge ? badges[c.badge] ?? 0 : 0),
        0
    );

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
                <span className="flex items-center gap-3">
                    <Icon name={item.icon} className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                </span>
                <span className="flex items-center gap-2">
                    {!open && <Badge count={groupTotal} />}
                    <Icon
                        name="chevron"
                        className={`w-4 h-4 transition-transform ${
                            open ? "rotate-180" : ""
                        }`}
                    />
                </span>
            </button>
            {open && (
                <div className="mt-1 ml-3 pl-4 border-l border-white/10 space-y-1">
                    {visibleChildren.map((child) => {
                        const isActive = child.exact
                            ? currentUrl === child.match
                            : currentUrl === child.match ||
                              currentUrl.startsWith(child.match + "/");
                        const cls = `flex items-center justify-between gap-2 px-3 py-1.5 text-sm rounded-md transition ${
                            isActive
                                ? "bg-blue-500/20 text-white font-medium"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }`;
                        const childBadge = child.badge ? badges[child.badge] ?? 0 : 0;
                        const content = (
                            <>
                                <span>{child.label}</span>
                                <Badge count={childBadge} />
                            </>
                        );
                        return child.external ? (
                            <a key={child.href} href={child.href} className={cls}>
                                {content}
                            </a>
                        ) : (
                            <Link key={child.href} href={child.href} className={cls}>
                                {content}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
