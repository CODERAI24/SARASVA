import { initializeApp }              from "firebase/app";
import { getAuth }                    from "firebase/auth";
import { getFirestore, collection,
         doc }                        from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

/**
 * Helper: returns a Firestore collection reference scoped to a user.
 * All user data lives under: users/{uid}/{collectionName}
 *
 * Set these Firestore security rules in Firebase Console:
 *
 *   rules_version = '2';
 *   service cloud.firestore {
 *     match /databases/{database}/documents {
 *       match /users/{userId}/{document=**} {
 *         allow read, write: if request.auth != null && request.auth.uid == userId;
 *       }
 *     }
 *   }
 */
export function userCol(uid, name) {
  return collection(db, "users", uid, name);
}

export function userDoc(uid, name, id) {
  return doc(db, "users", uid, name, id);
}
