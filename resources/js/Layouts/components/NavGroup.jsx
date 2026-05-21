import { useState } from "react";
import { Link } from "@inertiajs/react";
import Icon from "./Icon";

export default function NavGroup({ item, currentUrl, user }) {
    const isAdmin = user?.type === "Admin";
    const isAdmin021 = user?.type === "Admin" && user?.company_code === "021";
    const visibleChildren = item.children.filter((c) => {
        if (c.requires === "admin021") return isAdmin021;
        if (c.requires === "admin") return isAdmin;
        return true;
    });
    const hasActive = visibleChildren.some(
        (c) => currentUrl === c.match || currentUrl.startsWith(c.match + "/")
    );
    const [open, setOpen] = useState(hasActive);

    if (visibleChildren.length === 0) return null;

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
                <Icon
                    name="chevron"
                    className={`w-4 h-4 transition-transform ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>
            {open && (
                <div className="mt-1 ml-3 pl-4 border-l border-white/10 space-y-1">
                    {visibleChildren.map((child) => {
                        const isActive = child.exact
                            ? currentUrl === child.match
                            : currentUrl === child.match ||
                              currentUrl.startsWith(child.match + "/");
                        const cls = `block px-3 py-1.5 text-sm rounded-md transition ${
                            isActive
                                ? "bg-blue-500/20 text-white font-medium"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }`;
                        return child.external ? (
                            <a
                                key={child.href}
                                href={child.href}
                                className={cls}
                            >
                                {child.label}
                            </a>
                        ) : (
                            <Link
                                key={child.href}
                                href={child.href}
                                className={cls}
                            >
                                {child.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
