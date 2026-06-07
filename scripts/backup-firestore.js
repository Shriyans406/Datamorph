const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// To run this script locally:
// GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json node scripts/backup-firestore.js
function runBackup() {
    console.log("Initializing production Firestore backup process...");

    // Try initializing with default credentials
    try {
        initializeApp();
    } catch (e) {
        // Already initialized or credentials missing
    }

    const db = getFirestore();
    const collections = ['users', 'datasets', 'dashboards', 'connectors', 'collaborations'];
    const backupData = {};

    const backupPromises = collections.map(async (colName) => {
        try {
            const snapshot = await db.collection(colName).get();
            const docs = [];
            snapshot.forEach(doc => {
                docs.push({ id: doc.id, ...doc.data() });
            });
            backupData[colName] = docs;
            console.log(`Backup completed for collection: ${colName} (${docs.length} items)`);
        } catch (err) {
            console.error(`Error backing up collection ${colName}:`, err.message);
            backupData[colName] = [];
        }
    });

    Promise.all(backupPromises).then(() => {
        const dir = path.join(__dirname, '../backups');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        const filename = `firestore_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filepath = path.join(dir, filename);
        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
        console.log(`Backup successfully saved locally to: ${filepath}`);
    }).catch((err) => {
        console.error("Critical backup failure:", err);
    });
}

runBackup();
