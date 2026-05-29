"use client"

import { useState, useEffect } from "react";
import { createShareLink, revokeShareLink, getDashboardShareLinks, createInvitation, updatePublicAccess, removeTeamMember, updateTeamMemberRole, ShareLink, Invitation } from "@/services/sharing/sharing.service";
import { Dashboard } from "@/services/dashboard/types/dashboard.types";
import { Link2, Trash2, Shield, UserPlus, Globe, Lock, Copy, Check, Users } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    dashboard: Dashboard;
    currentUserUid: string;
    onRefreshDashboard: () => void;
}

export function ShareModal({ isOpen, onClose, dashboard, currentUserUid, onRefreshDashboard }: Props) {
    const [activeTab, setActiveTab] = useState<"general" | "links" | "team">("general");
    const [publicAccess, setPublicAccess] = useState(dashboard.publicAccess || "private");
    const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
    
    // Generate Share Link settings
    const [linkPerm, setLinkPerm] = useState<"viewer" | "editor">("viewer");
    const [linkExpiry, setLinkExpiry] = useState<number | null>(60); // Default 60 minutes
    const [generatedLinkUrl, setGeneratedLinkUrl] = useState("");
    const [copiedLink, setCopiedLink] = useState(false);

    // Invite settings
    const [inviteRole, setInviteRole] = useState<"viewer" | "editor">("viewer");
    const [inviteUrl, setInviteUrl] = useState("");
    const [copiedInvite, setCopiedInvite] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadShareLinks();
            setPublicAccess(dashboard.publicAccess || "private");
        }
    }, [isOpen, dashboard]);

    async function loadShareLinks() {
        const links = await getDashboardShareLinks(dashboard.id);
        setShareLinks(links);
    }

    async function handleSaveGeneral() {
        await updatePublicAccess(dashboard.id, publicAccess as any);
        onRefreshDashboard();
    }

    async function handleGenerateShareLink() {
        const link = await createShareLink(dashboard.id, linkPerm, linkExpiry, currentUserUid);
        const fullUrl = `${window.location.origin}/dashboard-builder/${dashboard.id}?shareToken=${link.id}`;
        setGeneratedLinkUrl(fullUrl);
        loadShareLinks();
    }

    async function handleGenerateInvite() {
        const invite = await createInvitation(dashboard.id, inviteRole, currentUserUid);
        const fullUrl = `${window.location.origin}/dashboard-builder/${dashboard.id}?inviteToken=${invite.id}`;
        setInviteUrl(fullUrl);
    }

    async function handleRevoke(linkId: string) {
        await revokeShareLink(linkId);
        loadShareLinks();
    }

    async function handleKickMember(uid: string) {
        await removeTeamMember(dashboard.id, uid);
        onRefreshDashboard();
    }

    async function handleChangeRole(uid: string, role: "viewer" | "editor") {
        await updateTeamMemberRole(dashboard.id, uid, role);
        onRefreshDashboard();
    }

    function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Share Dashboard</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Manage visibility, teams, and expiring links</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border text-sm font-medium">
                    <button 
                        onClick={() => setActiveTab("general")} 
                        className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-2 transition-all ${activeTab === "general" ? "border-indigo-500 text-indigo-500 bg-indigo-500/5 font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                        <Globe className="w-4 h-4" /> General Access
                    </button>
                    <button 
                        onClick={() => setActiveTab("links")} 
                        className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-2 transition-all ${activeTab === "links" ? "border-indigo-500 text-indigo-500 bg-indigo-500/5 font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                        <Link2 className="w-4 h-4" /> Expiring Links
                    </button>
                    <button 
                        onClick={() => setActiveTab("team")} 
                        className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-2 transition-all ${activeTab === "team" ? "border-indigo-500 text-indigo-500 bg-indigo-500/5 font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                        <Users className="w-4 h-4" /> Team & Invites
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto space-y-6">

                    {/* Tab 1: General Access */}
                    {activeTab === "general" && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Global Visibility</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <button 
                                        onClick={() => setPublicAccess("private")}
                                        className={`p-4 border rounded-xl flex flex-col gap-1 text-left transition-all ${publicAccess === "private" ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500" : "hover:bg-muted/40 border-border"}`}
                                    >
                                        <Lock className={`w-5 h-5 ${publicAccess === "private" ? "text-indigo-500" : "text-muted-foreground"}`} />
                                        <span className="font-semibold text-sm text-foreground">Private</span>
                                        <span className="text-[11px] text-muted-foreground">Only invited team members can access.</span>
                                    </button>

                                    <button 
                                        onClick={() => setPublicAccess("public_viewer")}
                                        className={`p-4 border rounded-xl flex flex-col gap-1 text-left transition-all ${publicAccess === "public_viewer" ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500" : "hover:bg-muted/40 border-border"}`}
                                    >
                                        <Globe className={`w-5 h-5 ${publicAccess === "public_viewer" ? "text-indigo-500" : "text-muted-foreground"}`} />
                                        <span className="font-semibold text-sm text-foreground">Public (Read-only)</span>
                                        <span className="text-[11px] text-muted-foreground">Anyone with the URL can view and filter.</span>
                                    </button>

                                    <button 
                                        onClick={() => setPublicAccess("public_editor")}
                                        className={`p-4 border rounded-xl flex flex-col gap-1 text-left transition-all ${publicAccess === "public_editor" ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500" : "hover:bg-muted/40 border-border"}`}
                                    >
                                        <Shield className={`w-5 h-5 ${publicAccess === "public_editor" ? "text-indigo-500" : "text-muted-foreground"}`} />
                                        <span className="font-semibold text-sm text-foreground">Public (Co-Edit)</span>
                                        <span className="text-[11px] text-muted-foreground">Anyone with the URL can fully edit & save.</span>
                                    </button>
                                </div>
                            </div>
                            <button 
                                onClick={handleSaveGeneral}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-medium transition-all text-sm shadow-md shadow-indigo-600/10"
                            >
                                Apply Access Setting
                            </button>
                        </div>
                    )}

                    {/* Tab 2: Expiring Share Links */}
                    {activeTab === "links" && (
                        <div className="space-y-6">
                            <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
                                <h3 className="font-semibold text-sm text-foreground">Create an expiring guest URL</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium block mb-1">Permission</label>
                                        <select 
                                            value={linkPerm} 
                                            onChange={(e) => setLinkPerm(e.target.value as any)} 
                                            className="w-full border border-border rounded-lg px-2.5 py-1.5 bg-background text-sm text-foreground outline-none focus:border-indigo-500"
                                        >
                                            <option value="viewer">Can View Only</option>
                                            <option value="editor">Can Edit</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium block mb-1">Expiration</label>
                                        <select 
                                            value={linkExpiry || "never"} 
                                            onChange={(e) => setLinkExpiry(e.target.value === "never" ? null : Number(e.target.value))} 
                                            className="w-full border border-border rounded-lg px-2.5 py-1.5 bg-background text-sm text-foreground outline-none focus:border-indigo-500"
                                        >
                                            <option value={5}>5 Minutes</option>
                                            <option value={60}>1 Hour</option>
                                            <option value={1440}>24 Hours</option>
                                            <option value="never">Never Expires</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button 
                                            onClick={handleGenerateShareLink}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1.5 font-medium transition-all text-xs shadow-md"
                                        >
                                            Create Link
                                        </button>
                                    </div>
                                </div>

                                {generatedLinkUrl && (
                                    <div className="mt-3 flex items-center gap-2 border border-border rounded-lg p-2 bg-background border-indigo-500/30">
                                        <input readOnly value={generatedLinkUrl} className="text-xs font-mono w-full bg-transparent text-foreground outline-none truncate" />
                                        <button 
                                            onClick={() => copyToClipboard(generatedLinkUrl, setCopiedLink)}
                                            className="p-1.5 bg-muted rounded-md hover:bg-muted/70 flex items-center justify-center shrink-0 border border-border"
                                        >
                                            {copiedLink ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Active Links Table */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm text-foreground">Active Share Links</h3>
                                {shareLinks.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic border border-dashed border-border rounded-lg p-4 text-center">No active temporary share links found.</p>
                                ) : (
                                    <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                                        {shareLinks.map(link => (
                                            <div key={link.id} className="p-3 flex items-center justify-between gap-3 text-xs bg-background hover:bg-muted/5 transition-all">
                                                <div className="min-w-0">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${link.permission === "editor" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"}`}>
                                                        {link.permission}
                                                    </span>
                                                    <p className="font-mono text-[10px] text-muted-foreground truncate mt-1">{link.id}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        {link.expiresAt ? `Expires: ${new Date(link.expiresAt).toLocaleTimeString()}` : "Permanent Link"}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => copyToClipboard(`${window.location.origin}/dashboard-builder/${dashboard.id}?shareToken=${link.id}`, () => {})}
                                                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                        title="Copy URL"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRevoke(link.id)}
                                                        className="p-1 hover:bg-red-50 text-red-500 rounded dark:hover:bg-red-950/20"
                                                        title="Revoke Link"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Team Access & Team Invites */}
                    {activeTab === "team" && (
                        <div className="space-y-6">
                            
                            {/* Invitation Code Creation */}
                            <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
                                <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground"><UserPlus className="w-4 h-4 text-indigo-500" /> Invite Collaborator</h3>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <select 
                                            value={inviteRole} 
                                            onChange={(e) => setInviteRole(e.target.value as any)} 
                                            className="w-full border border-border rounded-lg px-2.5 py-1.5 bg-background text-sm text-foreground outline-none focus:border-indigo-500"
                                        >
                                            <option value="viewer">Invite as Viewer</option>
                                            <option value="editor">Invite as Editor</option>
                                        </select>
                                    </div>
                                    <button 
                                        onClick={handleGenerateInvite}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-1.5 font-medium transition-all text-xs shadow-md shrink-0"
                                    >
                                        Create Invite Link
                                    </button>
                                </div>

                                {inviteUrl && (
                                    <div className="mt-3 flex items-center gap-2 border border-border rounded-lg p-2 bg-background border-indigo-500/30">
                                        <input readOnly value={inviteUrl} className="text-xs font-mono w-full bg-transparent text-foreground outline-none truncate" />
                                        <button 
                                            onClick={() => copyToClipboard(inviteUrl, setCopiedInvite)}
                                            className="p-1.5 bg-muted rounded-md hover:bg-muted/70 flex items-center justify-center shrink-0 border border-border"
                                        >
                                            {copiedInvite ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Active Team List */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm text-foreground">Team Collaborators</h3>
                                {!dashboard.teamPermissions || Object.keys(dashboard.teamPermissions).length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic border border-dashed border-border rounded-lg p-4 text-center">No team members added yet. Share an invitation link above.</p>
                                ) : (
                                    <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                                        {Object.entries(dashboard.teamPermissions).map(([uid, member]) => (
                                            <div key={uid} className="p-3 flex items-center justify-between gap-3 text-xs bg-background hover:bg-muted/5 transition-all text-foreground">
                                                <div>
                                                    <span className="font-semibold">{member.displayName}</span>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">{member.email}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <select 
                                                        value={member.role}
                                                        onChange={(e) => handleChangeRole(uid, e.target.value as any)}
                                                        className="border border-border rounded px-1.5 py-0.5 bg-transparent text-[11px] text-foreground outline-none"
                                                    >
                                                        <option value="viewer">Viewer</option>
                                                        <option value="editor">Editor</option>
                                                    </select>
                                                    <button 
                                                        onClick={() => handleKickMember(uid)}
                                                        className="p-1 hover:bg-red-50 text-red-500 rounded dark:hover:bg-red-950/20"
                                                        title="Revoke Collaborator Access"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
