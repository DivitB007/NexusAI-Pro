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

        // 2. Initialize Data
        await sql`
          INSERT INTO user_data (user_id, analytics, credits, sessions, enterprise_data)
          VALUES (${id}, ${JSON.stringify(DEFAULT_ANALYTICS)}, 0, ${JSON.stringify([])}, '{}'::jsonb)
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

  async syncUserData(userId: string): Promise<UserDataPayload> {
    const parse = (val: any) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch(e) { return val; }
        }
        return val;
    };

    if (isCloudEnabled && sql) {
       try {
         const userDataResult = await sql`SELECT * FROM user_data WHERE user_id = ${userId}`;
         const userResult = await sql`SELECT plan_id, email FROM users WHERE id = ${userId}`;
         
         const planId = (userResult && userResult.length > 0) ? userResult[0].plan_id : 'free';
         const userEmail = (userResult && userResult.length > 0) ? userResult[0].email : '';

         if (userDataResult && userDataResult.length > 0) {
            const data = userDataResult[0];
            const analytics = parse(data.analytics);
            const sessions = parse(data.sessions);
            const enterpriseData = parse(data.enterprise_data || {});

            let config = enterpriseData.config;
            let members = enterpriseData.members || [];
            let isOwner = !!config;

            // If I am NOT an owner, check if I am a member of someone else's team
            if (!isOwner && userEmail) {
                // Check if my email is in ANY user's members list
                // We use Postgres JSONB operator ? to check for existence of key/string in array
                const ownerResult = await sql`
                    SELECT enterprise_data 
                    FROM user_data 
                    WHERE enterprise_data->'members' @> ${JSON.stringify([userEmail])}::jsonb
                    LIMIT 1
                `;
                
                if (ownerResult && ownerResult.length > 0) {
                    const ownerData = parse(ownerResult[0].enterprise_data);
                    config = ownerData.config; // Inherit config
                    // I don't inherit the members list (I can't see other members), just the config
                    isOwner = false; 
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
          // 1. Get My Data
          const storageKey = `nexus_data_${userId}`;
          const myData = JSON.parse(localStorage.getItem(storageKey) || '{}');
          
          // 2. Get My Email (Need to look up in users list)
          const users = JSON.parse(localStorage.getItem('nexus_cloud_users') || '[]');
          const me = users.find((u: any) => u.id === userId);
          const myEmail = me ? me.email : '';

          let config = myData.enterpriseConfig;
          let members = myData.teamMembers || [];
          let isOwner = !!config;

          // 3. If I am not owner, search all other local users to see if I am in their team
          if (!isOwner && myEmail) {
             for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('nexus_data_') && key !== storageKey) {
                    const otherData = JSON.parse(localStorage.getItem(key) || '{}');
                    if (otherData.teamMembers && Array.isArray(otherData.teamMembers) && otherData.teamMembers.includes(myEmail)) {
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
         // IMPORTANT: Only save enterprise config if I am the OWNER.
         // If I am a member, my 'enterpriseConfig' is just a view, I shouldn't overwrite my own data with it 
         // unless I am saving my OWN separate config. 
         // However, for simplicity here, we rely on the App to pass `undefined` for config if I am just a member trying to save stats.
         // BUT `saveAllToCloud` passes `user.enterpriseConfig`.
         // Refinement: The App State `user` object holds the *viewable* config.
         // We need to know if we should persist it.
         // If `data.isEnterpriseOwner` is false, we should NOT save the `enterpriseConfig` to DB for THIS user, 
         // effectively keeping their 'config' null in DB, so they continue to inherit it.

         let enterprisePayload: any = { members: data.teamMembers };
         if (data.isEnterpriseOwner) {
             enterprisePayload.config = data.enterpriseConfig;
         } else {
             // If I'm not owner, I don't save the config to MY record.
             // I only save my members list (which should be empty usually)
             // or any *personal* enterprise config if I had one (but here we assume one active config)
             enterprisePayload.config = null; 
         }

         // 3. Upsert User Data
         await sql`
            INSERT INTO user_data (user_id, analytics, credits, sessions, enterprise_data)
            VALUES (${userId}, ${JSON.stringify(data.analytics)}, ${data.credits}, ${JSON.stringify([])}, ${JSON.stringify(enterprisePayload)})
            ON CONFLICT (user_id) 
            DO UPDATE SET 
              analytics = ${JSON.stringify(data.analytics)}, 
              credits = ${data.credits},
              enterprise_data = ${JSON.stringify(enterprisePayload)}
         `;
       } catch (e) {
         console.error("Cloud Save Error", e);
       }
    } else {
      // LOCAL SIMULATION
      return new Promise((resolve) => {
        const storageKey = `nexus_data_${userId}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
        
        // Handle Member Logic for Local
        let configToSave = data.enterpriseConfig;
        if (data.isEnterpriseOwner === false) {
            configToSave = undefined; // Do not save inherited config to local storage persistence for self
        }

        const merged = { 
            ...existing, 
            ...data, 
            enterpriseConfig: configToSave 
        };

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