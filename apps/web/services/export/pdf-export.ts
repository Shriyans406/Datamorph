import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

interface PDFExportOptions {
    dashboardName: string
    widgets: any[]
}

export async function generateDashboardPDF({
    dashboardName,
    widgets
}: PDFExportOptions): Promise<void> {
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - 2 * margin

    // Cover Page Banner
    pdf.setFillColor(79, 70, 229) // Indigo-600
    pdf.rect(0, 0, pageWidth, 40, "F")

    pdf.setTextColor(255, 255, 255)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(22)
    pdf.text("DATAMORPH ANALYTICS REPORT", margin, 20)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    const todayStr = new Date().toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
    pdf.text(`Generated: ${todayStr}`, margin, 30)

    // Dashboard Title
    pdf.setTextColor(15, 23, 42) // Slate-900
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(24)
    pdf.text(dashboardName, margin, 60)

    pdf.setDrawColor(226, 232, 240) // Slate-200
    pdf.line(margin, 65, pageWidth - margin, 65)

    let currentY = 75

    for (let i = 0; i < widgets.length; i++) {
        const widget = widgets[i]
        const element = document.querySelector(`[data-widget-id="${widget.id}"]`)

        if (!element) continue

        // Print-friendly background optimization
        const originalStyle = (element as HTMLElement).style.cssText
            ; (element as HTMLElement).style.backgroundColor = "#ffffff"
            ; (element as HTMLElement).style.boxShadow = "none"
            ; (element as HTMLElement).style.border = "1px solid #e2e8f0"
            ; (element as HTMLElement).style.color = "#000000"

        const canvas = await html2canvas(element as HTMLElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
        })

            ; (element as HTMLElement).style.cssText = originalStyle

        const imgData = canvas.toDataURL("image/png")
        const imgWidth = contentWidth
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Overflow check to wrap onto a new page
        if (currentY + imgHeight > pageHeight - margin - 20) {
            pdf.addPage()
            currentY = margin

            // Sub-header for subsequent pages
            pdf.setFillColor(248, 250, 252) // Slate-50
            pdf.rect(0, 0, pageWidth, 15, "F")
            pdf.setFont("helvetica", "normal")
            pdf.setFontSize(8)
            pdf.setTextColor(100, 116, 139) // Slate-500
            pdf.text(`Dashboard Report: ${dashboardName}`, margin, 10)
            pdf.text(`Page ${pdf.internal.pages.length - 1}`, pageWidth - margin - 15, 10)

            currentY = 25
        }

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(12)
        pdf.setTextColor(30, 41, 59)
        pdf.text(widget.title || widget.config?.title || "Metric View", margin, currentY)
        currentY += 6

        pdf.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight)
        currentY += imgHeight + 15
    }

    // Page footer running numbers
    const totalPages = pdf.internal.pages.length - 1
    for (let j = 1; j <= totalPages; j++) {
        pdf.setPage(j)
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(148, 163, 184)
        pdf.text("Confidential • DataMorph Platform", margin, pageHeight - 10)
        pdf.text(`Page ${j} of ${totalPages}`, pageWidth - margin - 10, pageHeight - 10)
    }

    pdf.save(`${dashboardName.toLowerCase().replace(/\s+/g, "_")}_report.pdf`)
}

export async function exportWidgetAsPNG(widgetId: string, filename: string) {
    const element = document.querySelector(`[data-widget-id="${widgetId}"]`)
    if (!element) return

    const canvas = await html2canvas(element as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
    })

    const imgUrl = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.href = imgUrl
    link.download = `${filename.toLowerCase().replace(/\s+/g, "_")}.png`
    link.click()
}
