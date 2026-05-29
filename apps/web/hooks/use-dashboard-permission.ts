import { useMemo } from "react";
import { Dashboard } from "@/services/dashboard/types/dashboard.types";

export type UserRole = "owner" | "editor" | "viewer" | "none";

interface PermissionResult {
    role: UserRole;
    isOwner: boolean;
    canEdit: boolean;
    canView: boolean;
    canManageShare: boolean;
}

export function useDashboardPermission(
    dashboard: Dashboard | null,
    userId: string,
    shareTokenPermission?: "viewer" | "editor" | null
): PermissionResult {
    return useMemo(() => {
        if (!dashboard) {
            return { role: "none", isOwner: false, canEdit: false, canView: false, canManageShare: false };
        }

        // 1. Direct Share Link Override
        if (shareTokenPermission) {
            return {
                role: shareTokenPermission,
                isOwner: false,
                canEdit: shareTokenPermission === "editor",
                canView: true,
                canManageShare: false
            };
        }

        // 2. Dashboard Owner (If no ownerId exists yet, first user becomes owner)
        const ownerId = dashboard.ownerId || "";
        if (!ownerId || ownerId === userId) {
            return { role: "owner", isOwner: true, canEdit: true, canView: true, canManageShare: true };
        }

        // 3. Explicit Team Permissions
        const userPerm = dashboard.teamPermissions?.[userId];
        if (userPerm) {
            return {
                role: userPerm.role,
                isOwner: false,
                canEdit: userPerm.role === "editor",
                canView: true,
                canManageShare: false
            };
        }

        // 4. Public Access Fallbacks
        const pub = dashboard.publicAccess || "private";
        if (pub === "public_editor") {
            return { role: "editor", isOwner: false, canEdit: true, canView: true, canManageShare: false };
        } else if (pub === "public_viewer") {
            return { role: "viewer", isOwner: false, canEdit: false, canView: true, canManageShare: false };
        }

        // 5. No access (Locked out)
        return { role: "none", isOwner: false, canEdit: false, canView: false, canManageShare: false };
    }, [dashboard, userId, shareTokenPermission]);
}
