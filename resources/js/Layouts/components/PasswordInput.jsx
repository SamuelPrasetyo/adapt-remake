import { useState } from "react";
import Icon from "./Icon";

export default function PasswordInput({ id, label, value, onChange, error }) {
    const [show, setShow] = useState(false);
    return (
        <div className="mb-4">
            <label
                htmlFor={id}
                className="block text-sm font-medium text-slate-700 mb-1"
            >
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    required
                    className="w-full pr-10 pl-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    <Icon name={show ? "eyeoff" : "eye"} className="w-4 h-4" />
                </button>
            </div>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}
