import { neon } from '@netlify/neon';
import { UserProfile, UserAnalytics, ChatSession, CustomPlanConfig } from '../types';

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
            sessions JSONB DEFAULT '[]'::jsonb,
            enterprise_data JSONB DEFAULT '{}'::jsonb
          );
        `;
        // Create index for faster member lookups
        await sql`CREATE INDEX IF NOT EXISTS idx_user_data_enterprise_members ON user_data USING gin (enterprise_data)`;
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

interface UserDataPayload {
    analytics: UserAnalytics;
    sessions: ChatSession[];
    credits: number;
    planId: string;
    enterpriseConfig?: CustomPlanConfig;
    teamMembers?: string[];
    isEnterpriseOwner?: boolean;
}

export const NetlifyService = {
  
  isCloudActive: () => isCloudEnabled,

  async login(email: string, password: string): Promise<UserProfile> {
    const cleanEmail = email.toLowerCase().trim();
    if (isCloudEnabled && sql) {
      try {
        const users = await sql`SELECT * FROM users WHERE email = ${cleanEmail} AND password = ${password}`;
        
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
        const user = users.find((u: any) => u.email === cleanEmail && u.password === password);
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
    const cleanEmail = email.toLowerCase().trim();
    if (isCloudEnabled && sql) {
      try {
        const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const createdAt = Date.now();
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
        
        // 1. Create User
        await sql`
          INSERT INTO users (id, email, password, name, plan_id, created_at, avatar_url)
          VALUES (${id}, ${cleanEmail}, ${password}, ${name}, 'free', ${createdAt}, ${avatarUrl})
        `;

        // 2. Initialize Data
        await sql`
          INSERT INTO user_data (user_id, analytics, credits, sessions, enterprise_data)
          VALUES (${id}, ${JSON.stringify(DEFAULT_ANALYTICS)}::jsonb, 0, ${JSON.stringify([])}::jsonb, '{}'::jsonb)
        `;

        return {
          id, email: cleanEmail, name, planId: 'free', createdAt, avatarUrl
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
          email: cleanEmail,
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

  async syncUserData(userId: string): Promise<UserDataPayload> {
    const parse = (val: any) => {
        if (!val) return null;
        if (typeof val === 'object') return val;
        if (typeof val === 'string') {
            try { 
                const parsed = JSON.parse(val);
                if (typeof parsed === 'string') {
                    try { return JSON.parse(parsed); } catch { return parsed; }
                }
                return parsed;
            } catch(e) { return val; }
        }
        return val;
    };

    if (isCloudEnabled && sql) {
       try {
         const userDataResult = await sql`SELECT * FROM user_data WHERE user_id = ${userId}`;
         const userResult = await sql`SELECT plan_id, email FROM users WHERE id = ${userId}`;
         
         const planId = (userResult && userResult.length > 0) ? userResult[0].plan_id : 'free';
         const rawEmail = (userResult && userResult.length > 0) ? userResult[0].email : '';
         const userEmail = rawEmail ? rawEmail.toLowerCase().trim() : '';

         if (userDataResult && userDataResult.length > 0) {
            const data = userDataResult[0];
            const analytics = parse(data.analytics);
            const sessions = parse(data.sessions);
            const enterpriseData = parse(data.enterprise_data) || {}; 

            let config = enterpriseData.config;
            let members = enterpriseData.members || [];
            let isOwner = !!config; 

            // If I am NOT an owner (no config in my row), check if I am a member of someone else's team
            if (!isOwner && userEmail) {
                // IMPORTANT: Ensure userEmail is strictly lowercased for comparison
                const targetMemberSubset = JSON.stringify({ members: [userEmail] });
                
                const ownerResult = await sql`
                    SELECT enterprise_data 
                    FROM user_data 
                    WHERE enterprise_data @> ${targetMemberSubset}::jsonb
                    LIMIT 1
                `;
                
                if (ownerResult && ownerResult.length > 0) {
                    const ownerData = parse(ownerResult[0].enterprise_data);
                    if (ownerData && ownerData.config) {
                        config = ownerData.config; // Inherit config
                        isOwner = false; 
                    }
                }
            }

            return {
                analytics: analytics || DEFAULT_ANALYTICS,
                sessions: Array.isArray(sessions) ? sessions : [],
                credits: data.credits || 0,
                planId: planId,
                enterpriseConfig: config,
                teamMembers: members,
                isEnterpriseOwner: isOwner
            };
         }
         
         return { analytics: DEFAULT_ANALYTICS, sessions: [], credits: 0, planId: planId, teamMembers: [], isEnterpriseOwner: false };
       } catch (e) {
         console.warn("Cloud Sync Error:", e);
         return { analytics: DEFAULT_ANALYTICS, sessions: [], credits: 0, planId: 'free', teamMembers: [], isEnterpriseOwner: false };
       }
    } else {
      // LOCAL SIMULATION
      return new Promise((resolve) => {
        setTimeout(() => {
          const storageKey = `nexus_data_${userId}`;
          const myData = JSON.parse(localStorage.getItem(storageKey) || '{}');
          const users = JSON.parse(localStorage.getItem('nexus_cloud_users') || '[]');
          const me = users.find((u: any) => u.id === userId);
          const myEmail = me ? me.email.toLowerCase() : '';

          let config = myData.enterpriseConfig;
          let members = myData.teamMembers || [];
          let isOwner = !!config;

          if (!isOwner && myEmail) {
             for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('nexus_data_') && key !== storageKey) {
                    const otherData = JSON.parse(localStorage.getItem(key) || '{}');
                    // Check inclusion case-insensitively
                    const otherMembers = (otherData.teamMembers || []).map((m: string) => m.toLowerCase());
                    if (otherMembers.includes(myEmail)) {
                        config = otherData.enterpriseConfig;
                        isOwner = false;
                        break;
                    }
                }
             }
          }

          resolve({
            analytics: myData.analytics || DEFAULT_ANALYTICS,
            sessions: myData.sessions || [],
            credits: myData.credits || 0,
            planId: myData.planId || 'free',
            enterpriseConfig: config,
            teamMembers: members,
            isEnterpriseOwner: isOwner
          });
        }, LATENCY_MS);
      });
    }
  },

  async saveUserData(userId: string, data: UserDataPayload): Promise<void> {
    if (isCloudEnabled && sql) {
       try {
         // 1. Update Plan in Users Table
         await sql`UPDATE users SET plan_id = ${data.planId} WHERE id = ${userId}`;

         // 2. Prepare Enterprise Data
         const normalizedMembers = (data.teamMembers || []).map(m => m.toLowerCase().trim());
         let enterprisePayload: any = { members: normalizedMembers };
         
         // 3. SAFE MERGE STRATEGY
         // If isEnterpriseOwner is FALSE, we intentionally delete the config (User canceled).
         // If isEnterpriseOwner is TRUE, we save the new config (User updated).
         // If isEnterpriseOwner is UNDEFINED (Stale update?), we MUST fetch existing config to prevent deletion.
         
         if (data.isEnterpriseOwner === true) {
             // Explicit Update/Create
             enterprisePayload.config = data.enterpriseConfig;
         } else if (data.isEnterpriseOwner === false) {
             // Explicit Cancel
             enterprisePayload.config = null;
         } else {
             // Undefined/Stale State: Fetch existing to preserve it
             try {
                const existing = await sql`SELECT enterprise_data FROM user_data WHERE user_id = ${userId}`;
                if (existing && existing.length > 0) {
                    const existingData = existing[0].enterprise_data;
                    if (typeof existingData === 'string') {
                         try { enterprisePayload.config = JSON.parse(existingData).config; } catch {}
                    } else if (existingData) {
                         enterprisePayload.config = existingData.config;
                    }
                }
             } catch(e) {
                console.warn("Failed to fetch existing config for merge, proceeding cautiously.", e);
             }
             
             // Fallback: If we still don't have config but have it in payload, use it
             if (!enterprisePayload.config && data.enterpriseConfig) {
                 enterprisePayload.config = data.enterpriseConfig;
             }
         }

         const analyticsJson = JSON.stringify(data.analytics);
         const enterpriseJson = JSON.stringify(enterprisePayload);

         // 4. Upsert User Data
         await sql`
            INSERT INTO user_data (user_id, analytics, credits, sessions, enterprise_data)
            VALUES (
              ${userId}, 
              ${analyticsJson}::jsonb, 
              ${data.credits}, 
              '[]'::jsonb, 
              ${enterpriseJson}::jsonb
            )
            ON CONFLICT (user_id) 
            DO UPDATE SET 
              analytics = ${analyticsJson}::jsonb, 
              credits = ${data.credits},
              enterprise_data = ${enterpriseJson}::jsonb
         `;
       } catch (e) {
         console.error("Cloud Save Error", e);
       }
    } else {
      // LOCAL SIMULATION
      return new Promise((resolve) => {
        const storageKey = `nexus_data_${userId}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
        
        let configToSave = existing.enterpriseConfig; // Default to existing
        
        if (data.isEnterpriseOwner === true) {
            configToSave = data.enterpriseConfig;
        } else if (data.isEnterpriseOwner === false) {
            configToSave = undefined;
        }
        // If undefined, we keep existing configToSave

        const merged = { 
            ...existing, 
            ...data, 
            enterpriseConfig: configToSave 
        };

        // Don't overwrite sessions with empty if we passed empty
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
            const sessionsJson = JSON.stringify(sessions);
            await sql`
                INSERT INTO user_data (user_id, sessions, analytics, credits)
                VALUES (${userId}, ${sessionsJson}::jsonb, '{}'::jsonb, 0)
                ON CONFLICT (user_id)
                DO UPDATE SET sessions = ${sessionsJson}::jsonb
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