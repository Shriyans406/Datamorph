"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { getGoogleAuthUrl } from "@/services/connectors/google-sheets/google-sheets.service"
import { saveConnector } from "@/repositories/connectors/connector.repository"
import { toast } from "sonner"
import { Link, Mail, Settings, Database, Code, Check } from "lucide-react"

interface Props {
    isOpen: boolean
    onClose: () => void
}

export function AddConnectorModal({ isOpen, onClose }: Props) {
    const [type, setType] = useState<"google-sheets" | "airtable" | "api">("google-sheets")
    const [name, setName] = useState("")
    const [syncInterval, setSyncInterval] = useState<"manual" | "hourly" | "daily">("manual")

    // Sheets variables
    const [spreadsheetId, setSpreadsheetId] = useState("")
    const [range, setRange] = useState("Sheet1!A1:Z100")

    // Airtable variables
    const [baseId, setBaseId] = useState("")
    const [tableIdOrName, setTableIdOrName] = useState("")
    const [pat, setPat] = useState("")

    // API variables
    const [apiUrl, setApiUrl] = useState("")
    const [method, setMethod] = useState<"GET" | "POST">("GET")
    const [headers, setHeaders] = useState("")
    const [body, setBody] = useState("")
    const [jsonPath, setJsonPath] = useState("")

    const [submitting, setSubmitting] = useState(false)

    const handleGoogleOAuthLink = () => {
        if (!name.trim()) {
            toast.error("Please enter a name for the Google Sheet connector")
            return
        }
        toast.info("Redirecting to Google authorization page...")
        window.location.href = getGoogleAuthUrl()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error("Please enter a name")
            return
        }

        setSubmitting(true)
        try {
            const configPayload: any = {}

            if (type === "airtable") {
                configPayload.baseId = baseId
                configPayload.tableIdOrName = tableIdOrName
                configPayload.personalAccessToken = pat
                configPayload.simulate = pat === "mock-airtable-pat" || pat === ""
            } else if (type === "api") {
                configPayload.url = apiUrl
                configPayload.method = method
                configPayload.headers = headers
                configPayload.body = body
                configPayload.jsonPath = jsonPath
                configPayload.simulate = apiUrl.includes("mock") || apiUrl === ""
            }

            await saveConnector({
                userId: "test-user-admin",
                name,
                type,
                status: "active",
                lastSyncAt: null,
                syncInterval,
                createdAt: new Date().toISOString(),
                config: configPayload
            })

            toast.success("Connector created successfully!")
            onClose()
        } catch (err) {
            toast.error("Failed to configure connector")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-indigo-400 font-bold">
                        <Link className="w-5 h-5" />
                        Configure Connector
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs mt-1">
                        Select a data source, provide authentication credentials, and configure sync limits.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 border-b border-slate-800 pb-3 mb-2.5">
                    {(["google-sheets", "airtable", "api"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setType(tab)}
                            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${type === tab ? "bg-indigo-600 text-white" : "bg-slate-950 text-slate-400 border border-slate-800/80"}`}
                        >
                            {tab.replace("-", " ")}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Connector Label</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Sales Metrics Data Source"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sync Frequency</label>
                        <select
                            value={syncInterval}
                            onChange={(e: any) => setSyncInterval(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 cursor-pointer focus:outline-none"
                        >
                            <option value="manual">Manual Pull Only</option>
                            <option value="hourly">Hourly Automated Background Sync</option>
                            <option value="daily">Daily Automated Background Sync</option>
                        </select>
                    </div>

                    {type === "google-sheets" && (
                        <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-2xl space-y-4">
                            <p className="text-[10px] text-indigo-400 font-semibold leading-relaxed">
                                Google Sheets integration uses OAuth. Click the button below to authorize read access to spreadsheets.
                            </p>
                            <button
                                type="button"
                                onClick={handleGoogleOAuthLink}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 font-semibold text-xs transition-colors cursor-pointer"
                            >
                                Connect via Google OAuth
                            </button>
                        </div>
                    )}

                    {type === "airtable" && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase">Base ID</label>
                                <input
                                    required
                                    type="text"
                                    value={baseId}
                                    onChange={e => setBaseId(e.target.value)}
                                    placeholder="e.g. appSomeBaseId123"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase">Table Name / ID</label>
                                <input
                                    required
                                    type="text"
                                    value={tableIdOrName}
                                    onChange={e => setTableIdOrName(e.target.value)}
                                    placeholder="e.g. Opportunities"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase">Personal Access Token (PAT)</label>
                                <input
                                    type="password"
                                    value={pat}
                                    onChange={e => setPat(e.target.value)}
                                    placeholder="pat.xxxxxxxxxxxxxxxx (leave blank to simulate offline)"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {type === "api" && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-4 gap-2">
                                <div className="col-span-1 space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Method</label>
                                    <select
                                        value={method}
                                        onChange={(e: any) => setMethod(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-1 text-xs text-slate-100 cursor-pointer"
                                    >
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                    </select>
                                </div>
                                <div className="col-span-3 space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase">API Request URL</label>
                                    <input
                                        required
                                        type="url"
                                        value={apiUrl}
                                        onChange={e => setApiUrl(e.target.value)}
                                        placeholder="https://api.service.com/v1/metrics"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase">JSON path to array</label>
                                <input
                                    type="text"
                                    value={jsonPath}
                                    onChange={e => setJsonPath(e.target.value)}
                                    placeholder="e.g. data.users (leave blank for root arrays)"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase">Custom Headers (JSON String)</label>
                                <textarea
                                    value={headers}
                                    onChange={e => setHeaders(e.target.value)}
                                    placeholder='{ "Authorization": "Bearer token" }'
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none h-14 font-mono resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {type !== "google-sheets" && (
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-semibold text-xs tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            {submitting ? "Configuring..." : "Add Connector"}
                        </button>
                    )}
                </form>

                <DialogFooter className="mt-2 -mx-4 -mb-4 bg-slate-950/40 p-4 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-900 text-xs font-semibold tracking-wide cursor-pointer transition-colors"
                    >
                        Cancel
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
