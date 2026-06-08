"use client"

import Link from "next/link"
import { 
    LayoutDashboard, 
    Database, 
    Link as LinkIcon, 
    Download, 
    Zap, 
    ShieldAlert, 
    ShieldCheck, 
    ArrowRight,
    Activity,
    Layers
} from "lucide-react"

export default function HomePage() {
    const modules = [
        {
            title: "Analytics Dashboards",
            description: "Build, view, and interact with AI-powered data dashboards and widgets in real time.",
            href: "/dashboard",
            icon: LayoutDashboard,
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
            hoverShadow: "hover:shadow-indigo-500/10"
        },
        {
            title: "Datasets Manager",
            description: "Upload CSV/Excel spreadsheets, generate profile stats, and explore schemas interactively.",
            href: "/datasets",
            icon: Database,
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
            hoverShadow: "hover:shadow-emerald-500/10"
        },
        {
            title: "External Data Connectors",
            description: "Simulate external sync integrations for Google Sheets, Airtable, and custom REST API endpoints.",
            href: "/connectors-test",
            icon: LinkIcon,
            color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
            hoverShadow: "hover:shadow-amber-500/10"
        },
        {
            title: "Export & Report Center",
            description: "Configure scheduled automated email dispatches and download PDF, Excel, or CSV report sheets.",
            href: "/export-test",
            icon: Download,
            color: "text-sky-400 bg-sky-500/10 border-sky-500/25",
            hoverShadow: "hover:shadow-sky-500/10"
        },
        {
            title: "Performance Optimization Lab",
            description: "Inspect data rendering speeds, manage AI request throttling, and track caching efficiency.",
            href: "/optimizations-test",
            icon: Zap,
            color: "text-violet-400 bg-violet-500/10 border-violet-500/25",
            hoverShadow: "hover:shadow-violet-500/10"
        },
        {
            title: "System Diagnostics Lab",
            description: "Inspect component error boundary fallbacks, structured logging, and backend diagnostic outputs.",
            href: "/testing-lab",
            icon: ShieldAlert,
            color: "text-rose-400 bg-rose-500/10 border-rose-500/25",
            hoverShadow: "hover:shadow-rose-500/10"
        },
        {
            title: "SaaS Deployment Control",
            description: "Verify live system telemetry, health parameters, automated backup logs, and platform setups.",
            href: "/deployment-lab",
            icon: ShieldCheck,
            color: "text-blue-400 bg-blue-500/10 border-blue-500/25",
            hoverShadow: "hover:shadow-blue-500/10"
        }
    ]

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 font-sans relative overflow-hidden">
            {/* Background glowing gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Content Container */}
            <div className="max-w-6xl w-full mx-auto space-y-12 z-10 my-auto">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                        Enterprise Analytics Hub
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                        Welcome to <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">DataMorph</span>
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                        An advanced, secure, and production-safe AI-powered business analytics ecosystem. Choose a module below to begin.
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                    {modules.map((m, idx) => {
                        const Icon = m.icon
                        return (
                            <Link 
                                key={m.title} 
                                href={m.href}
                                className={`block bg-slate-900 border border-slate-800 hover:border-slate-700/60 rounded-2xl p-6 transition-all group shadow-lg hover:-translate-y-0.5 cursor-pointer ${m.hoverShadow}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${m.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">
                                    {m.title}
                                </h3>
                                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                    {m.description}
                                </p>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[11px] text-slate-600 border-t border-slate-900 pt-6 mt-12 z-10">
                DataMorph Platform • Live Telemetry &copy; {new Date().getFullYear()}
            </div>
        </main>
    )
}