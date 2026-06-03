import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

interface PDFExportOptions {
    dashboardName: string
    widgets: any[]
    dataMap?: Record<string, any[]>
}

/**
 * Injects a <style> into the cloned document that replaces all oklch/lab/lch
 * CSS variables with safe rgb equivalents that html2canvas can parse.
 */
function injectSafeColors(clonedDoc: Document) {
    const style = clonedDoc.createElement("style")
    style.textContent = `
        *, *::before, *::after {
            /* Override oklch/lab computed values with safe rgb fallbacks */
            --background: #0f172a !important;
            --foreground: #f8fafc !important;
            --card: #1e293b !important;
            --card-foreground: #f8fafc !important;
            --popover: #1e293b !important;
            --popover-foreground: #f8fafc !important;
            --primary: #e2e8f0 !important;
            --primary-foreground: #1e293b !important;
            --secondary: #1e293b !important;
            --secondary-foreground: #f8fafc !important;
            --muted: #1e293b !important;
            --muted-foreground: #94a3b8 !important;
            --accent: #1e293b !important;
            --accent-foreground: #f8fafc !important;
            --destructive: #ef4444 !important;
            --border: rgba(255,255,255,0.1) !important;
            --input: rgba(255,255,255,0.15) !important;
            --ring: #6366f1 !important;
            background-color: #ffffff;
            color: #0f172a;
        }
        .bg-background { background-color: #ffffff !important; }
        .bg-card { background-color: #f8fafc !important; }
        .text-foreground { color: #0f172a !important; }
        .text-muted-foreground { color: #64748b !important; }
        .border-border { border-color: #e2e8f0 !important; }
    `
    clonedDoc.head.appendChild(style)
}

export async function generateDashboardPDF({
    dashboardName,
    widgets,
    dataMap = {}
}: PDFExportOptions): Promise<void> {
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - 2 * margin
    const todayStr = new Date().toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit"
    })

    // ── Cover Banner ──────────────────────────────────────────────────────
    pdf.setFillColor(79, 70, 229)
    pdf.rect(0, 0, pageWidth, 40, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(20)
    pdf.text("DATAMORPH ANALYTICS REPORT", margin, 20)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.text(`Generated: ${todayStr}`, margin, 30)

    // ── Dashboard Title ───────────────────────────────────────────────────
    pdf.setTextColor(15, 23, 42)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(22)
    pdf.text(dashboardName, margin, 58)
    pdf.setDrawColor(226, 232, 240)
    pdf.line(margin, 63, pageWidth - margin, 63)

    let currentY = 73

    // ── For each widget: try DOM capture first, fall back to data table ────
    for (let i = 0; i < widgets.length; i++) {
        const widget = widgets[i]
        const element = document.querySelector(`[data-widget-id="${widget.id}"]`) as HTMLElement | null

        // Section title
        if (currentY + 10 > pageHeight - margin) {
            pdf.addPage()
            currentY = margin + 5
        }
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(11)
        pdf.setTextColor(30, 41, 59)
        pdf.text(widget.title || widget.config?.title || `Widget ${i + 1}`, margin, currentY)
        currentY += 6

        // ── Try html2canvas snapshot ──────────────────────────────────────
        if (element) {
            try {
                const canvas = await html2canvas(element, {
                    scale: 1.5,
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#ffffff",
                    onclone: (_clonedDoc: Document) => {
                        injectSafeColors(_clonedDoc)
                    },
                })

                const imgData = canvas.toDataURL("image/png")
                const imgWidth = contentWidth
                const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 80)

                if (currentY + imgHeight > pageHeight - margin) {
                    pdf.addPage()
                    currentY = margin
                }
                pdf.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight)
                currentY += imgHeight + 8
                continue
            } catch (_err) {
                // DOM capture failed — fall through to data table
            }
        }

        // ── Fallback: render data as a table in the PDF ───────────────────
        const rows = dataMap[widget.datasetId] ?? []
        if (rows.length > 0) {
            const headers = Object.keys(rows[0])
            const colW = Math.min(contentWidth / Math.max(headers.length, 1), 40)

            // Header row
            pdf.setFillColor(79, 70, 229)
            pdf.rect(margin, currentY, contentWidth, 7, "F")
            pdf.setTextColor(255, 255, 255)
            pdf.setFont("helvetica", "bold")
            pdf.setFontSize(8)
            headers.forEach((h, ci) => {
                pdf.text(String(h).substring(0, 12), margin + ci * colW + 1, currentY + 5)
            })
            currentY += 7

            // Data rows (max 20)
            pdf.setFont("helvetica", "normal")
            pdf.setFontSize(7)
            rows.slice(0, 20).forEach((row, ri) => {
                if (currentY + 6 > pageHeight - margin) {
                    pdf.addPage()
                    currentY = margin
                }
                pdf.setFillColor(ri % 2 === 0 ? 248 : 241, ri % 2 === 0 ? 250 : 245, ri % 2 === 0 ? 252 : 255)
                pdf.rect(margin, currentY, contentWidth, 6, "F")
                pdf.setTextColor(30, 41, 59)
                headers.forEach((h, ci) => {
                    const val = row[h] === null || row[h] === undefined ? "" : String(row[h])
                    pdf.text(val.substring(0, 14), margin + ci * colW + 1, currentY + 4.5)
                })
                currentY += 6
            })
            if (rows.length > 20) {
                pdf.setTextColor(100, 116, 139)
                pdf.setFontSize(7)
                pdf.text(`… and ${rows.length - 20} more rows`, margin, currentY + 4)
                currentY += 8
            }
        } else {
            pdf.setTextColor(148, 163, 184)
            pdf.setFontSize(9)
            pdf.text("No data available for this widget", margin, currentY + 4)
            currentY += 10
        }
        currentY += 8
    }

    // ── Footer on every page ──────────────────────────────────────────────
    const totalPages = (pdf.internal as any).pages.length - 1
    for (let j = 1; j <= totalPages; j++) {
        pdf.setPage(j)
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(148, 163, 184)
        pdf.text("Confidential • DataMorph Platform", margin, pageHeight - 10)
        pdf.text(`Page ${j} of ${totalPages}`, pageWidth - margin - 14, pageHeight - 10)
    }

    pdf.save(`${dashboardName.toLowerCase().replace(/\s+/g, "_")}_report.pdf`)
}

export async function exportWidgetAsPNG(widgetId: string, filename: string) {
    const element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement | null
    if (!element) {
        console.warn(`[exportWidgetAsPNG] No element found with data-widget-id="${widgetId}"`)
        return
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            onclone: (_clonedDoc: Document) => {
                injectSafeColors(_clonedDoc)
            },
        })

        const imgUrl = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.href = imgUrl
        link.download = `${filename.toLowerCase().replace(/\s+/g, "_")}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch (err) {
        console.error("[exportWidgetAsPNG] html2canvas failed:", err)
        throw err
    }
}
