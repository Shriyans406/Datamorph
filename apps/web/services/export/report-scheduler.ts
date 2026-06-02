import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, doc, deleteDoc, query, where, updateDoc } from "firebase/firestore"

export interface ScheduledReport {
    id?: string
    dashboardId: string
    dashboardName: string
    userId: string
    email: string
    frequency: "daily" | "weekly" | "monthly"
    format: "pdf" | "excel" | "csv"
    createdAt: number
    active: boolean
}

export async function createReportSchedule(schedule: Omit<ScheduledReport, "createdAt" | "active">): Promise<string> {
    const colRef = collection(db, "scheduled_reports")
    const docRef = await addDoc(colRef, {
        ...schedule,
        active: true,
        createdAt: Date.now()
    })
    return docRef.id
}

export async function getDashboardSchedules(dashboardId: string): Promise<ScheduledReport[]> {
    const colRef = collection(db, "scheduled_reports")
    const q = query(colRef, where("dashboardId", "==", dashboardId))
    const snap = await getDocs(q)
    return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as ScheduledReport[]
}

export async function toggleScheduleActive(id: string, active: boolean): Promise<void> {
    const docRef = doc(db, "scheduled_reports", id)
    await updateDoc(docRef, { active })
}

export async function deleteReportSchedule(id: string): Promise<void> {
    const docRef = doc(db, "scheduled_reports", id)
    await deleteDoc(docRef)
}
