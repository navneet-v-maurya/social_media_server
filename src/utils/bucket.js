import * as admin from "firebase-admin";
import serviceAccount from "../../firebase_storage.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.BUCKET,
});

const bucket = admin.storage().bucket();

export { bucket };
