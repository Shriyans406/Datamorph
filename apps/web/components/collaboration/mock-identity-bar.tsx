"use client"

import { Shield, Sparkles } from "lucide-react";

export interface MockUser {
    uid: string;
    displayName: string;
    email: string;
    color: string;
}

export const MOCK_USERS: MockUser[] = [
    { uid: "alice_owner_10", displayName: "Alice (Owner)", email: "alice@datamorph.ai", color: "#6366f1" },
    { uid: "bob_editor_10", displayName: "Bob (Editor)", email: "bob@datamorph.ai", color: "#f59e0b" },
    { uid: "charlie_viewer_10", displayName: "Charlie (Viewer)", email: "charlie@datamorph.ai", color: "#10b981" },
    { uid: "guest_anon_10", displayName: "Anonymous Guest", email: "guest@datamorph.ai", color: "#ef4444" }
];

interface Props {
    activeUser: MockUser;
    onSelectUser: (user: MockUser) => void;
    currentResolvedRole: string;
}

export function MockIdentityBar({ activeUser, onSelectUser, currentResolvedRole }: Props) {
    return (
        <div className="bg-indigo-950 text-indigo-100 border-b border-indigo-900 px-6 py-2.5 flex items-center justify-between gap-4 text-xs font-medium shadow-md shadow-indigo-950/20 shrink-0">
            <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse animate-duration-1000" />
                <span>Permission System Simulator:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
                {MOCK_USERS.map(user => {
                    const isSelected = user.uid === activeUser.uid;
                    return (
                        <button
                            key={user.uid}
                            onClick={() => onSelectUser(user)}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${isSelected ? "bg-white text-indigo-950 shadow-sm font-semibold scale-[1.03]" : "hover:bg-indigo-900 text-indigo-300"}`}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: user.color }} />
                            {user.displayName}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center gap-2 bg-indigo-900/60 border border-indigo-800/80 px-3 py-1.5 rounded-lg shadow-inner">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Resolved Access: <strong className="text-white uppercase tracking-wider text-[11px]">{currentResolvedRole}</strong></span>
            </div>
        </div>
    );
}
