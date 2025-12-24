import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserProfile, UserAnalytics, ChatSession } from '../types';
import { FIREBASE_CONFIG } from '../constants';

// --- SERVICE INITIALIZATION ---
let auth: any = null;
let db: any = null;
let isCloudEnabled = false;

// Attempt to initialize Firebase
try {
  // Only initialize if config is valid and not the placeholder
  if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY_HERE" && FIREBASE_CONFIG.projectId !== "YOUR_PROJECT_ID") {
    try {
      // 1. Initialize App
      const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
      
      // 2. Initialize Services 
      // This often fails if there are version mismatches in imports
      try {
         auth = getAuth(app);
         db = getFirestore(app);
         isCloudEnabled = true;
         console.log("[Google Cloud] Connection established successfully.");
      } catch(innerErr: any) {
         console.warn("[Google Cloud] Service init partial failure:", innerErr);
         isCloudEnabled = false;
      }
    } catch (firebaseError: any) {
      console.warn("[Google Cloud] Remote sync disabled (Fallback to Local):", firebaseError.message);
      isCloudEnabled = false;
    }
  } else {
    console.warn("[Google Cloud] No valid Firebase Config. Falling back to local simulation.");
  }
} catch (e) {
  console.warn("[Google Cloud] Initialization skipped due to critical error:", e);
  isCloudEnabled = false;
}

const DEFAULT_ANALYTICS: UserAnalytics = {
  totalTokens: 0,
  totalMessages: 0,
  totalCost: 0.00,
  activeChats: 0,
  modelUsage: {},
  history: new Array(24).fill(0)
};

const LATENCY_MS = 800; // Only for local simulation

export const GoogleCloudSync = {
  
  isCloudActive: () => isCloudEnabled,

  async login(email: string, password: string): Promise<UserProfile> {
    // Check if cloud is enabled AND auth is initialized
    let useCloud = isCloudEnabled && auth;

    if (useCloud) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        // Fetch Profile from Firestore
        let userProfile: UserProfile | null = null;
        if (db) {
            try {
                const userDocRef = doc(db, "users", fbUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) userProfile = userDoc.data() as UserProfile;
            } catch(dbErr) {
                console.warn("Firestore fetch failed, using minimal profile", dbErr);
            }
        }
        
        return userProfile || {
            id: fbUser.uid,
            email: fbUser.email || "",
            name: fbUser.displayName || "User",
            planId: "free",
            createdAt: Date.now(),
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`
        };

      } catch (e: any) {
        // Fallback to local on critical errors
        if (e.code === 'auth/configuration-not-found' || e.code === 'auth/api-key-not-valid' || e.message?.includes('auth')) {
            console.warn("Critical Cloud Error during Login. Falling back to Local Mode.", e);
            useCloud = false; 
            isCloudEnabled = false; 
        } else {
            console.error("Firebase Login Error", e);
            throw new Error(e.message || "Cloud Login Failed");
        }
      }
    } 
    
    // LOCAL SIMULATION
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('nexus_cloud_users') || '[]');
        const user = users.find((u: any) => u.email === email && u.password === password);
        if (user) {
          resolve({
            id: user.id,
            email: user.email,
            name: user.name,
            planId: user.planId || 'free',
            createdAt: user.createdAt,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
          });
        } else {
          reject(new Error("Invalid credentials (Local)"));
        }
      }, LATENCY_MS);
    });
  },

  async signup(email: string, password: string, name: string): Promise<UserProfile> {
    let useCloud = isCloudEnabled && auth;

    if (useCloud) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        const newProfile: UserProfile = {
          id: fbUser.uid,
          email: email,
          name: name,
          planId: 'free',
          createdAt: Date.now(),
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        };

        if (db) {
            await setDoc(doc(db, "users", fbUser.uid), newProfile);
            await setDoc(doc(db, "userData", fbUser.uid), {
                analytics: DEFAULT_ANALYTICS,
                credits: 0,
                sessions: []
            });
        }

        return newProfile;
      } catch (e: any) {
         if (e.code === 'auth/configuration-not-found' || e.code === 'auth/api-key-not-valid' || e.message?.includes('auth')) {
             console.warn("Critical Cloud Error during Signup. Falling back to Local Mode.", e);
             useCloud = false; 
             isCloudEnabled = false; 
         } else {
             console.error("Firebase Signup Error", e);
             throw new Error(e.message || "Cloud Signup Failed");
         }
      }
    } 
    
    // LOCAL SIMULATION
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('nexus_cloud_users') || '[]');
        const newUser = {
          id: `usr_${Date.now()}`,
          email,
          password,
          name,
          planId: 'free',
          createdAt: Date.now()
        };
        users.push(newUser);
        localStorage.setItem('nexus_cloud_users', JSON.stringify(users));

        resolve({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          planId: 'free',
          createdAt: newUser.createdAt,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        });
      }, LATENCY_MS);
    });
  },

  async syncUserData(userId: string): Promise<{ analytics: UserAnalytics, sessions: ChatSession[], credits: number, planId: string }> {
    if (isCloudEnabled && db) {
       try {
         const dataDoc = await getDoc(doc(db, "userData", userId));
         const userDoc = await getDoc(doc(db, "users", userId));
         
         const userData = dataDoc.exists() ? dataDoc.data() : {};
         const userProfile = userDoc.exists() ? userDoc.data() : {};
         
         return {
           analytics: userData.analytics || DEFAULT_ANALYTICS,
           sessions: userData.sessions || [],
           credits: userData.credits || 0,
           planId: userProfile.planId || 'free'
         };
       } catch (e) {
         console.warn("Cloud Sync Error (Using Default):", e);
         return { analytics: DEFAULT_ANALYTICS, sessions: [], credits: 0, planId: 'free' };
       }
    } else {
      // LOCAL SIMULATION
      return new Promise((resolve) => {
        setTimeout(() => {
          const storageKey = `nexus_data_${userId}`;
          const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
          resolve({
            analytics: data.analytics || DEFAULT_ANALYTICS,
            sessions: data.sessions || [],
            credits: data.credits || 0,
            planId: data.planId || 'free'
          });
        }, LATENCY_MS);
      });
    }
  },

  async saveUserData(userId: string, data: { analytics: UserAnalytics, sessions: ChatSession[], credits: number, planId: string }): Promise<void> {
    if (isCloudEnabled && db) {
       try {
         await setDoc(doc(db, "userData", userId), {
            analytics: data.analytics,
            credits: data.credits
         }, { merge: true });

         await setDoc(doc(db, "users", userId), { planId: data.planId }, { merge: true });
       } catch (e) {
         console.error("Cloud Save Error", e);
       }
    } else {
      // LOCAL SIMULATION
      return new Promise((resolve) => {
        const storageKey = `nexus_data_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
        resolve();
      });
    }
  },

  async saveUserSessions(userId: string, sessions: ChatSession[]): Promise<void> {
    if (isCloudEnabled && db) {
        try {
            await updateDoc(doc(db, "userData", userId), {
                sessions: sessions
            });
        } catch(e) {
            console.error("Cloud Session Save Error", e);
        }
    } else {
        const storageKey = `nexus_data_${userId}`;
        const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
        data.sessions = sessions;
        localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }
};