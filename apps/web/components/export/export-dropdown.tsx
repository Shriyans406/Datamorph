import { useState, useRef, useEffect } from "react"
import { Download, FileSpreadsheet, FileText, Image, Calendar, Loader2 } from "lucide-react"
import { exportToCSV, exportToExcel } from "@/services/export/csv-excel-export"
import { generateDashboardPDF, exportWidgetAsPNG } from "@/services/export/pdf-export"
import { ScheduleReportModal } from "./schedule-report-modal"
import { toast } from "sonner"

interface Props {
    dashboard: any
    dataMap: Record<string, any[]>
    canSchedule: boolean
}

export function ExportDropdown({ dashboard, dataMap, canSchedule }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPdfLoading, setIsPdfLoading] = useState(false)
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleExportCSV = () => {
        if (!dashboard || dashboard.widgets.length === 0) {
            toast.error("No widgets to export data from")
            return
        }
        toast.info("Preparing CSV data...")
        dashboard.widgets.forEach((w: any) => {
            const data = dataMap[w.datasetId] || []
            if (data.length === 0) return
            const headers = Object.keys(data[0])
            const rows = data.map(item => headers.map(h => item[h]))
            exportToCSV(`${w.title || "widget"}_data.csv`, headers, rows)
        })
        toast.success("CSV files downloaded!")
        setIsOpen(false)
    }

    const handleExportExcel = () => {
        if (!dashboard || dashboard.widgets.length === 0) {
            toast.error("No widgets to export data from")
            return
        }
        toast.info("Generating Excel sheets...")
        const sheets = dashboard.widgets.map((w: any) => {
            const data = dataMap[w.datasetId] || []
            const headers = data.length > 0 ? Object.keys(data[0]) : ["No Data"]
            const rows = data.map(item => headers.map(h => item[h]))
            return {
                name: (w.title || "Sheet").substring(0, 30),
                headers,
                rows
            }
        })
        exportToExcel(`${dashboard.name || "dashboard"}_report.xlsx`, sheets)
        toast.success("Excel report downloaded!")
        setIsOpen(false)
    }

    const handleExportPDF = async () => {
        if (!dashboard || dashboard.widgets.length === 0) {
            toast.error("No widgets to capture")
            return
        }
        setIsPdfLoading(true)
        toast.info("Rendering PDF visuals...")
        try {
            await generateDashboardPDF({
                dashboardName: dashboard.name,
                widgets: dashboard.widgets,
                dataMap
            })
            toast.success("PDF generated and downloaded!")
        } catch (err) {
            console.error(err)
            toast.error("Failed to generate PDF")
        } finally {
            setIsPdfLoading(false)
            setIsOpen(false)
        }
    }

    const handleExportImages = () => {
        if (!dashboard || dashboard.widgets.length === 0) {
            toast.error("No widgets to export")
            return
        }
        toast.info("Capturing widgets...")
        dashboard.widgets.forEach((w: any) => {
            exportWidgetAsPNG(w.id, w.title || "Widget View")
        })
        toast.success("Images downloaded!")
        setIsOpen(false)
    }

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 border border-border text-foreground bg-card hover:bg-muted rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-sm"
            >
                <Download className="w-3.5 h-3.5" />
                Export & Schedule
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border bg-popover/90 backdrop-blur-md text-popover-foreground shadow-2xl ring-1 ring-black/5 focus:outline-none z-50 p-1.5 animate-in fade-in-0 slide-in-from-top-2">
                    <button
                        onClick={handleExportCSV}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    >
                        <FileText className="w-4 h-4 text-emerald-500" />
                        Export Data to CSV
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-green-500" />
                        Export Data to Excel (.xlsx)
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={isPdfLoading}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:opacity-50"
                    >
                        {isPdfLoading ? (
                            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                        ) : (
                            <FileText className="w-4 h-4 text-red-500" />
                        )}
                        Export PDF (Multipage)
                    </button>
                    <button
                        onClick={handleExportImages}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    >
                        <Image className="w-4 h-4 text-indigo-500" />
                        Export Widgets to Images
                    </button>

                    {canSchedule && (
                        <>
                            <div className="my-1 border-t border-border" />
                            <button
                                onClick={() => {
                                    setIsSchedulerOpen(true)
                                    setIsOpen(false)
                                }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 cursor-pointer"
                            >
                                <Calendar className="w-4 h-4" />
                                Schedule Automated Reports
                            </button>
                        </>
                    )}
                </div>
            )}

            {isSchedulerOpen && (
                <ScheduleReportModal
                    isOpen={isSchedulerOpen}
                    onClose={() => setIsSchedulerOpen(false)}
                    dashboardId={dashboard.id}
                    dashboardName={dashboard.name}
                />
            )}
        </div>
    )
}
