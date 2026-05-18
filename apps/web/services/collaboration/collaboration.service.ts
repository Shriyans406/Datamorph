import { realtimeDb } from "@/lib/firebase";
import { ref, set, onValue, onDisconnect, remove } from "firebase/database";

export interface UserPresence {
    uid: string;
    displayName: string;
    color: string;
}

export function joinDashboardPresence(dashboardId: string, user: UserPresence, onUsersChange: (users: UserPresence[]) => void) {
    const presenceRef = ref(realtimeDb, `dashboards/${dashboardId}/presence`);
    const userRef = ref(realtimeDb, `dashboards/${dashboardId}/presence/${user.uid}`);

    // Set online status and setup auto-cleanup on disconnect
    set(userRef, user);
    onDisconnect(userRef).remove();

    // Listen to all active users
    return onValue(presenceRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            onUsersChange(Object.values(data));
        } else {
            onUsersChange([]);
        }
    });
}

export function trackCursor(dashboardId: string, userId: string, x: number, y: number) {
    const cursorRef = ref(realtimeDb, `dashboards/${dashboardId}/cursors/${userId}`);
    set(cursorRef, { x, y });
    onDisconnect(cursorRef).remove();
}

export function listenToCursors(dashboardId: string, onCursorsChange: (cursors: Record<string, { x: number, y: number }>) => void) {
    const cursorsRef = ref(realtimeDb, `dashboards/${dashboardId}/cursors`);
    return onValue(cursorsRef, (snapshot) => {
        onCursorsChange(snapshot.val() || {});
    });
}
