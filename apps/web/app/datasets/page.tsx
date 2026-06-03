"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UploadCloud, Database, ArrowRight, RefreshCw, Trash2, Layers } from "lucide-react"
import { toast } from "sonner"
import { UploadZone } from "@/components/datasets/upload-zone"
import { processDataset } from "@/services/datasets/dataset.service"
import { persistDataset } from "@/services/datasets/persist-dataset"
import { getDatasets } from "@/repositories/datasets/dataset.repository"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"

export default function DatasetsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [datasets, setDatasets] = useState<any[]>([])
    const [loadingDatasets, setLoadingDatasets] = useState(true)

    // Real-time dataset list from Firestore
    useEffect(() => {
        const q = query(collection(db, "datasets"))
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setDatasets(list)
            setLoadingDatasets(false)
        }, () => {
            // Fallback to one-shot read if snapshot fails
            getDatasets().then(data => {
                setDatasets(data)
                setLoadingDatasets(false)
            })
        })
        return () => unsub()
    }, [])

    async function handleFile(file: File) {
        try {
            setLoading(true)
            toast.loading("Processing dataset...")
            const processed = await processDataset(file)
            const datasetId = await persistDataset(processed)
            toast.dismiss()
            toast.success("Dataset uploaded successfully!")
            // Navigate to the newly uploaded dataset
            router.push(`/datasets/${datasetId}`)
        } catch (error) {
            console.error(error)
            toast.dismiss()
            toast.error("Failed to process dataset")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Database className="w-6 h-6 text-indigo-400" />
                        Datasets
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Upload CSV / Excel files and explore your data in real time
                    </p>
                </div>
                <span className="text-xs bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-slate-400 font-semibold">
                    {datasets.length} dataset{datasets.length !== 1 ? "s" : ""} available
                </span>
            </div>

            {/* Upload Zone */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-indigo-400" />
                    Upload New Dataset
                </h2>
                <UploadZone onFileAccepted={handleFile} />
                {loading && (
                    <div className="flex items-center gap-2 mt-4 text-indigo-400 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing dataset...
                    </div>
                )}
            </div>

            {/* Dataset List */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Your Datasets
                </h2>

                {loadingDatasets ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        Loading datasets...
                    </div>
                ) : datasets.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-2xl p-16 text-center text-slate-500">
                        <Database className="w-8 h-8 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">No datasets uploaded yet</p>
                        <p className="text-xs mt-1 opacity-60">Upload a CSV or Excel file above to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {datasets.map((dataset: any) => (
                            <button
                                key={dataset.id}
                                onClick={() => router.push(`/datasets/${dataset.id}`)}
                                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 text-left transition-all group shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <Database className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                </div>
                                <h3 className="font-semibold text-sm text-slate-100 truncate">
                                    {dataset.metadata?.name || dataset.name || "Untitled Dataset"}
                                </h3>
                                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                                    <span>{dataset.metadata?.rows ?? "—"} rows</span>
                                    <span>•</span>
                                    <span>{dataset.metadata?.columns ?? "—"} columns</span>
                                </div>
                                {dataset.metadata?.uploadedAt && (
                                    <p className="text-[10px] text-slate-600 mt-1.5">
                                        {new Date(dataset.metadata.uploadedAt).toLocaleDateString()}
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}