import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";

const SHARE_LINKS_COLLECTION = "shareLinks";
const INVITATIONS_COLLECTION = "invitations";
const DASHBOARDS_COLLECTION = "dashboards";

export interface ShareLink {
    id: string;
    dashboardId: string;
    permission: "viewer" | "editor";
    expiresAt: number | null;
    createdAt: number;
    createdBy: string;
    active: boolean;
}

export interface Invitation {
    id: string;
    dashboardId: string;
    role: "viewer" | "editor";
    expiresAt: number | null;
    createdAt: number;
    createdBy: string;
    accepted: boolean;
}

// Generate share link
export async function createShareLink(
    dashboardId: string,
    permission: "viewer" | "editor",
    expiresInMinutes: number | null,
    createdBy: string
): Promise<ShareLink> {
    const id = `link_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = expiresInMinutes ? Date.now() + expiresInMinutes * 60000 : null;

    const shareLink: ShareLink = {
        id,
        dashboardId,
        permission,
        expiresAt,
        createdAt: Date.now(),
        createdBy,
        active: true
    };

    await setDoc(doc(db, SHARE_LINKS_COLLECTION, id), shareLink);
    return shareLink;
}

// Retrieve valid share link
export async function getValidShareLink(linkId: string): Promise<ShareLink | null> {
    const snapshot = await getDoc(doc(db, SHARE_LINKS_COLLECTION, linkId));
    if (!snapshot.exists()) return null;

    const link = snapshot.data() as ShareLink;
    if (!link.active) return null;
    if (link.expiresAt && Date.now() > link.expiresAt) return null;

    return link;
}

// Revoke share link
export async function revokeShareLink(linkId: string): Promise<void> {
    await updateDoc(doc(db, SHARE_LINKS_COLLECTION, linkId), { active: false });
}

// Get all active share links for dashboard
export async function getDashboardShareLinks(dashboardId: string): Promise<ShareLink[]> {
    const q = query(
        collection(db, SHARE_LINKS_COLLECTION),
        where("dashboardId", "==", dashboardId),
        where("active", "==", true)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as ShareLink);
}

// Create Invitation
export async function createInvitation(
    dashboardId: string,
    role: "viewer" | "editor",
    createdBy: string
): Promise<Invitation> {
    const id = `invite_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours default expiry

    const invitation: Invitation = {
        id,
        dashboardId,
        role,
        expiresAt,
        createdAt: Date.now(),
        createdBy,
        accepted: false
    };

    await setDoc(doc(db, INVITATIONS_COLLECTION, id), invitation);
    return invitation;
}

// Get valid invite
export async function getValidInvitation(inviteId: string): Promise<Invitation | null> {
    const snapshot = await getDoc(doc(db, INVITATIONS_COLLECTION, inviteId));
    if (!snapshot.exists()) return null;

    const invite = snapshot.data() as Invitation;
    if (invite.accepted) return null;
    if (invite.expiresAt && Date.now() > invite.expiresAt) return null;

    return invite;
}

// Accept Invitation
export async function acceptInvitation(
    inviteId: string,
    uid: string,
    displayName: string,
    email: string
): Promise<string> {
    const invite = await getValidInvitation(inviteId);
    if (!invite) throw new Error("Invalid or expired invitation");

    // Add user to teamPermissions on dashboard doc
    const dashboardRef = doc(db, DASHBOARDS_COLLECTION, invite.dashboardId);
    const dashboardSnap = await getDoc(dashboardRef);

    if (dashboardSnap.exists()) {
        const dashboard = dashboardSnap.data();
        const teamPermissions = dashboard.teamPermissions || {};
        teamPermissions[uid] = {
            role: invite.role,
            displayName,
            email
        };
        await updateDoc(dashboardRef, { teamPermissions });
    }

    // Mark invite as accepted
    await updateDoc(doc(db, INVITATIONS_COLLECTION, inviteId), { accepted: true });
    
    return invite.dashboardId;
}

// Update public access
export async function updatePublicAccess(
    dashboardId: string,
    access: "private" | "public_viewer" | "public_editor"
): Promise<void> {
    await updateDoc(doc(db, DASHBOARDS_COLLECTION, dashboardId), { publicAccess: access });
}

// Remove team member
export async function removeTeamMember(dashboardId: string, memberUid: string): Promise<void> {
    const dashboardRef = doc(db, DASHBOARDS_COLLECTION, dashboardId);
    const snap = await getDoc(dashboardRef);
    if (snap.exists()) {
        const teamPermissions = { ...snap.data().teamPermissions };
        delete teamPermissions[memberUid];
        await updateDoc(dashboardRef, { teamPermissions });
    }
}

// Update team member role
export async function updateTeamMemberRole(
    dashboardId: string,
    memberUid: string,
    role: "viewer" | "editor"
): Promise<void> {
    const dashboardRef = doc(db, DASHBOARDS_COLLECTION, dashboardId);
    const snap = await getDoc(dashboardRef);
    if (snap.exists()) {
        const teamPermissions = { ...snap.data().teamPermissions };
        if (teamPermissions[memberUid]) {
            teamPermissions[memberUid].role = role;
            await updateDoc(dashboardRef, { teamPermissions });
        }
    }
}
