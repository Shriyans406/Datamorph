import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from "firebase/firestore"
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

const app =
    getApps().length > 0
        ? getApp()
        : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db =
    getApps().length > 0
        ? getFirestore(app)
        : initializeFirestore(app, {
              experimentalForceLongPolling: true,
          })
export const storage = getStorage(app)
export const realtimeDb = getDatabase(app)

if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099")
    connectFirestoreEmulator(db, "127.0.0.1", 8085)
    connectStorageEmulator(storage, "127.0.0.1", 9199)
    connectDatabaseEmulator(realtimeDb, "127.0.0.1", 9000)
}