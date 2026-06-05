import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import crypto from "crypto"

const memoryCache = new Map<string, { value: any; expiresAt: number }>()

export class AICache {
    private collectionName = "ai_cache"
    private ttlMs = 24 * 60 * 60 * 1000 // 24 hours Cache TTL

    /**
     * Computes a canonical, clean hash key to maximize cache reuse
     */
    computeKey(action: string, prompt: string, context?: string): string {
        // Clean prompt formatting: strip extra whitespaces, normalize quotes and newlines
        const cleanPrompt = prompt
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase()

        const hashInput = `${action}:${cleanPrompt}:${context || ""}`
        return crypto.createHash("sha256").update(hashInput).digest("hex")
    }

    async get(key: string): Promise<any | null> {
        const now = Date.now()

        const cachedMem = memoryCache.get(key)
        if (cachedMem) {
            if (cachedMem.expiresAt > now) {
                return cachedMem.value
            }
            memoryCache.delete(key)
        }

        try {
            const docRef = doc(db, this.collectionName, key)
            const docSnap = await getDoc(docRef)

            if (docSnap && docSnap.exists()) {
                const data = docSnap.data()
                if (data.expiresAt > now) {
                    memoryCache.set(key, { value: data.value, expiresAt: data.expiresAt })
                    return data.value
                }
            }
        } catch (error: any) {
            // Silence exceptions for emulator environments
        }

        return null
    }

    async set(key: string, value: any): Promise<void> {
        const expiresAt = Date.now() + this.ttlMs
        memoryCache.set(key, { value, expiresAt })

        try {
            const docRef = doc(db, this.collectionName, key)
            await setDoc(docRef, {
                value,
                expiresAt,
                cachedAt: Date.now()
            })
        } catch (error) {
            console.error("⚠️ Firestore Cache write failed: ", error)
        }
    }
}

export const aiCache = new AICache()
