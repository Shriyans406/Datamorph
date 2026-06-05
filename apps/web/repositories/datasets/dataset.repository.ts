import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    limit,
    writeBatch
} from "firebase/firestore"

import { db } from "@/lib/firebase"

const datasetsCollection = collection(db, "datasets")
const rowsCollection = collection(db, "dataset_rows")

// In-memory caching layer for metadata to minimize reads
const METADATA_CACHE = new Map<string, { data: any; expiry: number }>()
const CACHE_TTL_MS = 30 * 1000 // 30 seconds

export async function saveDataset(dataset: any) {
    const batch = writeBatch(db)

    // Create new doc IDs upfront
    const newDatasetDocRef = doc(datasetsCollection)
    const newRowsDocRef = doc(rowsCollection)

    // Stage dataset metadata
    batch.set(newDatasetDocRef, {
        metadata: dataset.metadata,
        schema: dataset.schema,
        statistics: dataset.statistics,
        quality: dataset.quality,
        profile: dataset.profile,
        preview: dataset.preview,
        createdAt: new Date().toISOString(),
    })

    // Stage rows document linked to the dataset ID
    batch.set(newRowsDocRef, {
        datasetId: newDatasetDocRef.id,
        rows: dataset.rows.slice(0, 500),
    })

    // Commit atomic transaction
    await batch.commit()

    // Warm cache
    METADATA_CACHE.set(newDatasetDocRef.id, {
        data: {
            id: newDatasetDocRef.id,
            metadata: dataset.metadata,
            schema: dataset.schema,
            statistics: dataset.statistics,
            quality: dataset.quality,
            profile: dataset.profile,
            preview: dataset.preview,
        },
        expiry: Date.now() + CACHE_TTL_MS
    })

    return newDatasetDocRef.id
}

export async function getDatasets() {
    const snapshot = await getDocs(datasetsCollection)
    const datasets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }))

    // Batch warm cache
    datasets.forEach(d => {
        METADATA_CACHE.set(d.id, {
            data: d,
            expiry: Date.now() + CACHE_TTL_MS
        })
    })

    return datasets
}

export async function getDatasetById(id: string) {
    // 1. Check cache first
    const cached = METADATA_CACHE.get(id)
    if (cached && cached.expiry > Date.now()) {
        // Fetch rows still needed, but read from cached metadata
        const rowsQuery = query(rowsCollection, where("datasetId", "==", id), limit(1))
        const rowsSnapshot = await getDocs(rowsQuery)
        const rowsDoc = rowsSnapshot.docs[0]
        return {
            ...cached.data,
            rows: rowsDoc?.data()?.rows || [],
        }
    }

    // 2. Cache miss - Read metadata
    const datasetDoc = await getDoc(doc(db, "datasets", id))
    if (!datasetDoc.exists()) {
        return null
    }

    const metadataData = { id: datasetDoc.id, ...datasetDoc.data() }
    METADATA_CACHE.set(id, {
        data: metadataData,
        expiry: Date.now() + CACHE_TTL_MS
    })

    // 3. Query rows directly by index instead of full scan
    const rowsQuery = query(rowsCollection, where("datasetId", "==", id), limit(1))
    const rowsSnapshot = await getDocs(rowsQuery)
    const rowsDoc = rowsSnapshot.docs[0]

    return {
        ...metadataData,
        rows: rowsDoc?.data()?.rows || [],
    }
}

export async function updateDataset(id: string, dataset: any): Promise<void> {
    const batch = writeBatch(db)

    // Update metadata document
    const datasetDocRef = doc(db, "datasets", id)
    batch.set(datasetDocRef, {
        metadata: dataset.metadata,
        schema: dataset.schema,
        statistics: dataset.statistics,
        quality: dataset.quality,
        profile: dataset.profile,
        preview: dataset.preview,
        createdAt: dataset.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }, { merge: true })

    // Find and update/insert rows document
    const rowsQuery = query(rowsCollection, where("datasetId", "==", id), limit(1))
    const rowsSnapshot = await getDocs(rowsQuery)
    const rowsDoc = rowsSnapshot.docs[0]

    if (rowsDoc) {
        batch.update(doc(db, "dataset_rows", rowsDoc.id), {
            rows: dataset.rows.slice(0, 500)
        })
    } else {
        const newRowsDocRef = doc(rowsCollection)
        batch.set(newRowsDocRef, {
            datasetId: id,
            rows: dataset.rows.slice(0, 500)
        })
    }

    await batch.commit()

    // Invalidate cache
    METADATA_CACHE.delete(id)
}
