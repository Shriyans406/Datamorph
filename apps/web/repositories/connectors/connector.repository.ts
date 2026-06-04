import { db } from "@/lib/firebase"
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit
} from "firebase/firestore"
import { DataConnector, SyncLog } from "@/types/connectors.types"

const connectorsCol = collection(db, "data_connectors")
const syncLogsCol = collection(db, "connector_sync_logs")

export async function saveConnector(connector: DataConnector): Promise<string> {
    const docRef = await addDoc(connectorsCol, {
        ...connector,
        createdAt: connector.createdAt || new Date().toISOString()
    })
    return docRef.id
}

export async function getConnectors(): Promise<DataConnector[]> {
    const snap = await getDocs(connectorsCol)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as DataConnector))
}

export async function getConnectorById(id: string): Promise<DataConnector | null> {
    const d = await getDoc(doc(db, "data_connectors", id))
    if (!d.exists()) return null
    return { id: d.id, ...d.data() } as DataConnector
}

export async function updateConnector(id: string, updates: Partial<DataConnector>): Promise<void> {
    const ref = doc(db, "data_connectors", id)
    await updateDoc(ref, updates)
}

export async function deleteConnector(id: string): Promise<void> {
    const ref = doc(db, "data_connectors", id)
    await deleteDoc(ref)
}

export async function logSyncRun(log: SyncLog): Promise<string> {
    const docRef = await addDoc(syncLogsCol, {
        ...log,
        syncTime: log.syncTime || Date.now()
    })
    return docRef.id
}

export async function getSyncLogs(connectorId?: string): Promise<SyncLog[]> {
    let q = query(syncLogsCol, orderBy("syncTime", "desc"), limit(50))
    if (connectorId) {
        q = query(syncLogsCol, where("connectorId", "==", connectorId), orderBy("syncTime", "desc"), limit(20))
    }
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SyncLog))
}
