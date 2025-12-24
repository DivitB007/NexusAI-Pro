import { neon } from '@netlify/neon';
import { UserProfile, UserAnalytics, ChatSession } from '../types';

const DEFAULT_ANALYTICS: UserAnalytics = {
  totalTokens: 0,
  totalMessages: 0,
  totalCost: 0.00,
  activeChats: 0,
  modelUsage: {},
  history: new Array(24).fill(0)
};

const LATENCY_MS = 800; // Only for local simulation

// Initialize Neon SQL client
let sql: any = null;
let isCloudEnabled = false;

try {
  if (process.env.NETLIFY_DATABASE_URL) {
    sql = neon(process.env.NETLIFY_DATABASE_URL);
    isCloudEnabled = true;
    console.log("[Netlify DB] Connected successfully.");
    
    // Lazy Initialization: Ensure Tables Exist
    (async () => {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password TEXT,
            name TEXT,
            plan_id TEXT DEFAULT 'free',
            created_at BIGINT,
            avatar_url TEXT
          );
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS user_data (
            user_id TEXT PRIMARY KEY,
            analytics JSONB DEFAULT '{}'::jsonb,
            credits INTEGER DEFAULT 0,
            sessions JSONB DEFAULT '[]'::jsonb
          );
        `;
        console.log("[Netlify DB] Schema verification complete.");
      } catch (err) {
        console.error("[Netlify DB] Schema verification failed:", err);
      }
    })();

  } else {
    console.warn("[Netlify DB] NETLIFY_DATABASE_URL not found. Falling back to Local Mode.");
  }
} catch (e) {
  console.warn("[Netlify DB] Initialization error:", e);
}

export const NetlifyService = {
  
  isCloudActive: () => isCloudEnabled,

  async login(email: string, password: string): Promise<UserProfile> {
    if (isCloudEnabled && sql) {
      try {
        const users = await sql`SELECT * FROM users WHERE email = ${email} AND password = ${password}`;
        
        if (users && users.length > 0) {
          const u = users[0];
          return {
            id: u.id,
            email: u.email,
            name: u.name,
            planId: u.plan_id || 'free',
            createdAt: Number(u.created_at),
            avatarUrl: u.avatar_url
          };
        } else {
          throw new Error("Invalid credentials.");
        }
      } catch (e: any) {
         console.error("Netlify DB Login Error", e);
         throw new Error(e.message || "Cloud Login Failed");
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
    if (isCloudEnabled && sql) {
      try {
        const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const createdAt = Date.now();
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
        
        // 1. Create User
        await sql`
          INSERT INTO users (id, email, password, name, plan_id, created_at, avatar_url)
          VALUES (${id}, ${email}, ${password}, ${name}, 'free', ${createdAt}, ${avatarUrl})
        `;

        // 2. Initialize Data - Using stringified JSON to ensure compatibility
        await sql`
          INSERT INTO user_data (user_id, analytics, credits, sessions)
          VALUES (${id}, ${JSON.stringify(DEFAULT_ANALYTICS)}, 0, ${JSON.stringify([])})
        `;

        return {
          id, email, name, planId: 'free', createdAt, avatarUrl
        };
      } catch (e: any) {
         console.error("Netlify DB Signup Error", e);
         if (e.message?.includes('users_email_key') || e.message?.includes('constraint')) {
           throw new Error("Email already registered.");
         }
         throw new Error(e.message || "Cloud Signup Failed");
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
    if (isCloudEnabled && sql) {
       try {
         const userDataResult = await sql`SELECT * FROM user_data WHERE user_id = ${userId}`;
         const userResult = await sql`SELECT plan_id FROM users WHERE id = ${userId}`;
         
         const planId = (userResult && userResult.length > 0) ? userResult[0].plan_id : 'free';
         
         if (userDataResult && userDataResult.length > 0) {
            const data = userDataResult[0];
            
            // Handle potential double-serialization or raw object return
            let analytics = data.analytics;
            if (typeof analytics === 'string') {
                try { analytics = JSON.parse(analytics); } catch(e) {}
            }

            let sessions = data.sessions;
            if (typeof sessions === 'string') {
                try { sessions = JSON.parse(sessions); } catch(e) {}
            }

            return {
                analytics: analytics || DEFAULT_ANALYTICS,
                sessions: Array.isArray(sessions) ? sessions : [],
                credits: data.credits || 0,
                planId: planId
            };
         }
         
         // If user_data missing but user exists, return defaults
         return { analytics: DEFAULT_ANALYTICS, sessions: [], credits: 0, planId: planId };
       } catch (e) {
         console.warn("Cloud Sync Error:", e);
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
    if (isCloudEnabled && sql) {
       try {
         // 1. Update Plan in Users Table
         await sql`UPDATE users SET plan_id = ${data.planId} WHERE id = ${userId}`;

         // 2. Upsert User Data
         // We explicitly include sessions here to ensure the row is complete if it's a new insert
         // But on update, we preserve existing sessions if not provided, OR update them if needed. 
         // Since saveUserData is often called with empty sessions from App.tsx (bad practice but existing), 
         // we should only update analytics and credits on conflict if we want to preserve sessions stored in DB.
         
         // However, correct approach is:
         // If we are just saving metadata (credits/plan), we don't want to overwrite sessions with [].
         // The safe way is to separate these or read-modify-write, but for efficiency in SQL:
         
         await sql`
            INSERT INTO user_data (user_id, analytics, credits, sessions)
            VALUES (${userId}, ${JSON.stringify(data.analytics)}, ${data.credits}, ${JSON.stringify([])})
            ON CONFLICT (user_id) 
            DO UPDATE SET 
              analytics = ${JSON.stringify(data.analytics)}, 
              credits = ${data.credits}
         `;
         // Note: We deliberately DO NOT update 'sessions' in the DO UPDATE clause above 
         // because App.tsx often passes an empty array for sessions during metadata updates.
         // Sessions are saved separately via saveUserSessions.

       } catch (e) {
         console.error("Cloud Save Error", e);
       }
    } else {
      // LOCAL SIMULATION
      return new Promise((resolve) => {
        const storageKey = `nexus_data_${userId}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
        // Merge to avoid losing sessions if not provided
        const merged = { ...existing, ...data };
        if (data.sessions.length === 0 && existing.sessions?.length > 0) {
            merged.sessions = existing.sessions;
        }
        localStorage.setItem(storageKey, JSON.stringify(merged));
        resolve();
      });
    }
  },

  async saveUserSessions(userId: string, sessions: ChatSession[]): Promise<void> {
    if (isCloudEnabled && sql) {
        try {
            await sql`
                INSERT INTO user_data (user_id, sessions, analytics, credits)
                VALUES (${userId}, ${JSON.stringify(sessions)}, ${JSON.stringify(DEFAULT_ANALYTICS)}, 0)
                ON CONFLICT (user_id)
                DO UPDATE SET sessions = ${JSON.stringify(sessions)}
            `;
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