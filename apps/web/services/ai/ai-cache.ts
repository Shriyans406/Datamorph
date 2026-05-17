import { db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    setDoc,
} from "firebase/firestore";
import crypto from "crypto";


// Simple memory fallback cache
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

export class AICache {
    private collectionName = "ai_cache";
    private ttlMs = 24 * 60 * 60 * 1000; // 24 hours Cache TTL

    /**
     * Computes a unique hash key based on the action, prompt, and optional metadata
     */
    computeKey(action: string, prompt: string, context?: string): string {
        const hashInput = `${action}:${prompt}:${context || ""}`;
        return crypto.createHash("sha256").update(hashInput).digest("hex");
    }

    /**
     * Retrieves cached results if valid
     */
    async get(key: string): Promise<any | null> {
        const now = Date.now();

        // 1. Check RAM Cache
        const cachedMem = memoryCache.get(key);
        if (cachedMem) {
            if (cachedMem.expiresAt > now) {
                return cachedMem.value;
            }
            memoryCache.delete(key); // Stale entry
        }

        // 2. Check Firestore Cache
        try {
            const docRef = doc(db, this.collectionName, key);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.expiresAt > now) {
                    // Backfill memory cache
                    memoryCache.set(key, { value: data.value, expiresAt: data.expiresAt });
                    return data.value;
                }
            }
        } catch (error) {
            console.error("⚠️ Firestore Cache read failed: ", error);
        }

        return null;
    }

    /**
     * Saves cache values
     */
    async set(key: string, value: any): Promise<void> {
        const expiresAt = Date.now() + this.ttlMs;

        // 1. Set Memory
        memoryCache.set(key, { value, expiresAt });

        // 2. Set Firestore
        try {
            const docRef = doc(db, this.collectionName, key);
            await setDoc(docRef, {
                value,
                expiresAt,
                cachedAt: Date.now()
            });
        } catch (error) {
            console.error("⚠️ Firestore Cache write failed: ", error);
        }
    }
}

export const aiCache = new AICache();
