import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
} from "firebase/firestore"

import { db } from "@/lib/firebase"

import {
    Dashboard,
} from "../types/dashboard.types"

const DASHBOARD_COLLECTION =
    "dashboards"

export async function saveDashboard(
    dashboard: Dashboard
) {
    await setDoc(
        doc(
            db,
            DASHBOARD_COLLECTION,
            dashboard.id
        ),
        dashboard
    )
}

export async function getDashboard(
    dashboardId: string
) {
    const snapshot =
        await getDoc(
            doc(
                db,
                DASHBOARD_COLLECTION,
                dashboardId
            )
        )

    return snapshot.data()
}

export async function getDashboards() {
    const snapshot =
        await getDocs(
            collection(
                db,
                DASHBOARD_COLLECTION
            )
        )

    return snapshot.docs.map(
        (doc) => doc.data()
    )
}