import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
} from "firebase/firestore"

import { db } from "@/lib/firebase"

const datasetsCollection = collection(
    db,
    "datasets"
)

const rowsCollection = collection(
    db,
    "dataset_rows"
)

export async function saveDataset(
    dataset: any
) {
    const datasetDoc = await addDoc(
        datasetsCollection,
        {
            metadata: dataset.metadata,
            schema: dataset.schema,
            statistics: dataset.statistics,
            quality: dataset.quality,
            preview: dataset.preview,
            createdAt: new Date().toISOString(),
        }
    )

    await addDoc(rowsCollection, {
        datasetId: datasetDoc.id,
        rows: dataset.rows.slice(0, 500),
    })

    return datasetDoc.id
}

export async function getDatasets() {
    const snapshot = await getDocs(
        datasetsCollection
    )

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }))
}

export async function getDatasetById(
    id: string
) {
    const datasetDoc = await getDoc(
        doc(db, "datasets", id)
    )

    if (!datasetDoc.exists()) {
        return null
    }

    const rowsSnapshot = await getDocs(
        rowsCollection
    )

    const rowsDoc = rowsSnapshot.docs.find(
        (d) => d.data().datasetId === id
    )

    return {
        id: datasetDoc.id,
        ...datasetDoc.data(),
        rows: rowsDoc?.data()?.rows || [],
    }
}