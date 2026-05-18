"use client"
import { useEffect, useState, useRef } from "react";
import { trackCursor, listenToCursors, UserPresence } from "@/services/collaboration/collaboration.service";
import { MousePointer2 } from "lucide-react";

export function LiveCursors({ dashboardId, currentUser, activeUsers, children }: { dashboardId: string, currentUser: UserPresence, activeUsers: UserPresence[], children: React.ReactNode }) {
    const [cursors, setCursors] = useState<Record<string, { x: number, y: number }>>({});
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        return listenToCursors(dashboardId, setCursors);
    }, [dashboardId]);

    const handleMouseMove = (e: React.MouseEvent) => {
        // Throttle this in production, but for emulation raw is fine
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            trackCursor(dashboardId, currentUser.uid, x, y);
        }
    };

    return (
        <div ref={containerRef} onMouseMove={handleMouseMove} className="relative w-full h-full min-h-screen">
            {children}

            {/* Render remote cursors */}
            {Object.entries(cursors).map(([uid, pos]) => {
                if (uid === currentUser.uid) return null; // Don't render own cursor
                const user = activeUsers.find(u => u.uid === uid);
                if (!user) return null;

                return (
                    <div
                        key={uid}
                        className="absolute pointer-events-none transition-all duration-75 ease-linear z-50"
                        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                    >
                        <MousePointer2 className="w-5 h-5 fill-current" style={{ color: user.color }} />
                        <div className="mt-1 px-2 py-1 text-[10px] font-bold text-white rounded-md" style={{ backgroundColor: user.color }}>
                            {user.displayName}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
