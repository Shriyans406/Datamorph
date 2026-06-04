import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, connectStorageEmulator } from "firebase/storage"
import { getDatabase, connectDatabaseEmulator } from "firebase/database"

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const realtimeDb = getDatabase(app)

if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
    try {
        connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
    } catch (_) { /* already connected */ }
    try {
        connectFirestoreEmulator(db, "127.0.0.1", 8085)
    } catch (_) { /* already connected */ }
    try {
        connectStorageEmulator(storage, "127.0.0.1", 9199)
    } catch (_) { /* already connected */ }
    try {
        connectDatabaseEmulator(realtimeDb, "127.0.0.1", 9000)
    } catch (_) { /* already connected */ }
}