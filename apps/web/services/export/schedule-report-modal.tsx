import { useState, useEffect } from "react"
import { Calendar, Trash2, Mail, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { createReportSchedule, getDashboardSchedules, deleteReportSchedule, ScheduledReport } from "@/services/export/report-scheduler"
import { toast } from "sonner"

interface Props {
    isOpen: boolean
    onClose: () => void
    dashboardId: string
    dashboardName: string
}

export function ScheduleReportModal({ isOpen, onClose, dashboardId, dashboardName }: Props) {
    const [email, setEmail] = useState("")
    const [format, setFormat] = useState<"pdf" | "excel" | "csv">("pdf")
    const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily")
    const [schedules, setSchedules] = useState<ScheduledReport[]>([])
    const [loadingSchedules, setLoadingSchedules] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const loadSchedules = async () => {
        setLoadingSchedules(true)
        try {
            const data = await getDashboardSchedules(dashboardId)
            setSchedules(data)
        } catch (e) {
            toast.error("Failed to load schedules")
        } finally {
            setLoadingSchedules(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            loadSchedules()
        }
    }, [isOpen, dashboardId])

    const handleAddSchedule = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            toast.error("Please enter a valid email address")
            return
        }
        setSubmitting(true)
        try {
            await createReportSchedule({
                dashboardId,
                dashboardName,
                userId: "alice_owner_10",
                email,
                format,
                frequency
            })
            toast.success("Report scheduled successfully!")
            setEmail("")
            loadSchedules()
        } catch (err) {
            toast.error("Failed to create schedule")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        toast.info("Deleting schedule...")
        try {
            await deleteReportSchedule(id)
            toast.success("Schedule deleted successfully!")
            loadSchedules()
        } catch (e) {
            toast.error("Failed to delete schedule")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-indigo-400 font-bold">
                        <Calendar className="w-5 h-5" />
                        Schedule Dashboard Reports
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs mt-1">
                        Configure automated delivery of reports directly to your inbox.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddSchedule} className="space-y-4 py-3">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                            Recipient Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                                Format
                            </label>
                            <select
                                value={format}
                                onChange={(e: any) => setFormat(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                                <option value="pdf">PDF (Full Layout)</option>
                                <option value="excel">Excel (.xlsx Sheets)</option>
                                <option value="csv">CSV (Raw Metrics)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                                Frequency
                            </label>
                            <select
                                value={frequency}
                                onChange={(e: any) => setFrequency(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                                <option value="daily">Daily at 9:00 AM</option>
                                <option value="weekly">Weekly (Monday 9 AM)</option>
                                <option value="monthly">Monthly (1st 9 AM)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Create Schedule
                    </button>
                </form>

                <div className="border-t border-slate-800 pt-4">
                    <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2.5">
                        Active Schedules ({schedules.length})
                    </h4>

                    {loadingSchedules ? (
                        <div className="flex justify-center py-6">
                            <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                        </div>
                    ) : schedules.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 py-4">No schedules configured.</p>
                    ) : (
                        <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                            {schedules.map(sched => (
                                <div key={sched.id} className="flex items-center justify-between bg-slate-950/50 border border-slate-800/60 p-2.5 rounded-xl">
                                    <div className="min-w-0 flex-1 pr-3">
                                        <p className="text-xs text-slate-200 truncate font-medium">{sched.email}</p>
                                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider">
                                                {sched.format}
                                            </span>
                                            • <span className="capitalize">{sched.frequency} delivery</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => sched.id && handleDelete(sched.id)}
                                        className="text-slate-500 hover:text-red-500 p-1.5 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-2 -mx-4 -mb-4 bg-slate-950/40 p-4 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-900 text-xs font-semibold tracking-wide cursor-pointer transition-colors"
                    >
                        Dismiss
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
