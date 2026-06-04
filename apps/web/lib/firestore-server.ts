/**
 * Server-side Firestore helper using the REST API.
 * This bypasses the Firebase Client SDK which has emulator issues in Next.js API routes.
 * Uses FIRESTORE_EMULATOR_HOST env var when set, otherwise hits production.
 */

function getFirestoreBaseUrl(): string {
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.replace(/"/g, "")
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (emulatorHost) {
        return `http://${emulatorHost}/v1/projects/${projectId}/databases/(default)/documents`
    }
    return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
}

function parseFirestoreValue(value: any): any {
    if (value === null || value === undefined) return null
    if (value.stringValue !== undefined) return value.stringValue
    if (value.integerValue !== undefined) return Number(value.integerValue)
    if (value.doubleValue !== undefined) return Number(value.doubleValue)
    if (value.booleanValue !== undefined) return value.booleanValue
    if (value.nullValue !== undefined) return null
    if (value.arrayValue) {
        return (value.arrayValue.values || []).map(parseFirestoreValue)
    }
    if (value.mapValue) {
        const fields = value.mapValue.fields || {}
        const result: Record<string, any> = {}
        for (const key of Object.keys(fields)) {
            result[key] = parseFirestoreValue(fields[key])
        }
        return result
    }
    if (value.timestampValue) return value.timestampValue
    return null
}

function parseFirestoreDoc(doc: any): any {
    const fields = doc.fields || {}
    const parsed: Record<string, any> = {}
    for (const key of Object.keys(fields)) {
        parsed[key] = parseFirestoreValue(fields[key])
    }
    const nameParts = doc.name?.split("/") || []
    parsed.id = nameParts[nameParts.length - 1]
    return parsed
}

function toFirestoreValue(value: any): any {
    if (value === null || value === undefined) return { nullValue: null }
    if (typeof value === "boolean") return { booleanValue: value }
    if (typeof value === "number") {
        if (Number.isInteger(value)) return { integerValue: String(value) }
        return { doubleValue: value }
    }
    if (typeof value === "string") return { stringValue: value }
    if (Array.isArray(value)) {
        return { arrayValue: { values: value.map(toFirestoreValue) } }
    }
    if (typeof value === "object") {
        const fields: Record<string, any> = {}
        for (const key of Object.keys(value)) {
            fields[key] = toFirestoreValue(value[key])
        }
        return { mapValue: { fields } }
    }
    return { stringValue: String(value) }
}

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
    const fields: Record<string, any> = {}
    for (const key of Object.keys(obj)) {
        fields[key] = toFirestoreValue(obj[key])
    }
    return fields
}

export async function firestoreGetDocs(collectionPath: string): Promise<any[]> {
    const base = getFirestoreBaseUrl()
    const url = `${base}/${collectionPath}`
    const res = await fetch(url)
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Firestore GET ${collectionPath} failed (${res.status}): ${text}`)
    }
    const data = await res.json()
    return (data.documents || []).map(parseFirestoreDoc)
}

export async function firestoreAddDoc(collectionPath: string, data: Record<string, any>): Promise<string> {
    const base = getFirestoreBaseUrl()
    const url = `${base}/${collectionPath}`
    const body = JSON.stringify({ fields: toFirestoreFields(data) })
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Firestore POST ${collectionPath} failed (${res.status}): ${text}`)
    }
    const doc = await res.json()
    const nameParts = doc.name?.split("/") || []
    return nameParts[nameParts.length - 1]
}

export async function firestoreUpdateDoc(collectionPath: string, docId: string, data: Record<string, any>): Promise<void> {
    const base = getFirestoreBaseUrl()
    const fields = toFirestoreFields(data)
    const updateMask = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&")
    const url = `${base}/${collectionPath}/${docId}?${updateMask}`
    const body = JSON.stringify({ fields })
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Firestore PATCH ${collectionPath}/${docId} failed (${res.status}): ${text}`)
    }
}

export async function firestoreSetDoc(collectionPath: string, docId: string, data: Record<string, any>): Promise<void> {
    const base = getFirestoreBaseUrl()
    const url = `${base}/${collectionPath}/${docId}`
    const body = JSON.stringify({ fields: toFirestoreFields(data) })
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Firestore SET ${collectionPath}/${docId} failed (${res.status}): ${text}`)
    }
}

export async function firestoreGetDoc(collectionPath: string, docId: string): Promise<any | null> {
    const base = getFirestoreBaseUrl()
    const url = `${base}/${collectionPath}/${docId}`
    const res = await fetch(url)
    if (res.status === 404) return null
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Firestore GET ${collectionPath}/${docId} failed (${res.status}): ${text}`)
    }
    const doc = await res.json()
    return parseFirestoreDoc(doc)
}
