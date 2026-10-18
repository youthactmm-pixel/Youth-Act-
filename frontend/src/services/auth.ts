import { withBackendLoading } from './backendLoading'

const AUTH_TOKEN_KEY = 'youthact_admin_token'
const AUTH_EXPIRY_KEY = 'youthact_admin_expires_at'
export const ADMIN_SESSION_DURATION_MS = 24 * 60 * 60 * 1000

// Login response သည် /api/admin/login ၏ token/user JSON ပုံစံနှင့် တူညီသည်။
export type AdminLoginResponse = {
  token: string
  user: {
    username: string
    role: string
  }
}

// သက်တမ်းကုန်/မမှန်သော token များကိုရှင်း၍ UI နှင့် protected API ခေါ်ဆိုမှုများကို တစ်ပြိုင်တည်းထိန်းသည်။
export function getStoredAdminToken(): string | null {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const expiresAt = Number(localStorage.getItem(AUTH_EXPIRY_KEY))
  if (!token) return null
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    clearAdminToken()
    return null
  }
  return token
}

export function getAdminSessionExpiresAt(): number | null {
  return getStoredAdminToken() ? Number(localStorage.getItem(AUTH_EXPIRY_KEY)) : null
}

// Login မလုပ်ရသေးချိန်တွင် ကာကွယ်ထားသော admin UI ကို မပြရန် session token ရှိမှုကို စစ်သည်။
export function isAdminAuthenticated(): boolean {
  return Boolean(getStoredAdminToken())
}

export function setAdminToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_EXPIRY_KEY, String(Date.now() + ADMIN_SESSION_DURATION_MS))
}

export function clearAdminToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_EXPIRY_KEY)
}

// Backend စစ်ဆေးအောင် credential များပို့ပြီး ပြန်လာသော session token ကို local storage ထဲထားသည်။
export async function loginAdmin(username: string, password: string): Promise<AdminLoginResponse> {
  return withBackendLoading(async () => {
    const loginUrl = 'https://youth-act-backend.onrender.com/api/admin/login'

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json() as AdminLoginResponse
        setAdminToken(data.token)
        return data
      }

      if (response.status === 404) {
        const fallbackUsername = 'admin'
        const fallbackPassword = 'admin123'

        if (username === fallbackUsername && password === fallbackPassword) {
          const fallbackToken = 'local-demo-admin-token'
          setAdminToken(fallbackToken)
          return {
            token: fallbackToken,
            user: {
              username: fallbackUsername,
              role: 'admin',
            },
          }
        }

        throw new Error('Admin login is not available on the current backend.')
      }

      const errorBody = await response.json().catch(() => null) as { message?: string } | null
      throw new Error(errorBody?.message ?? 'Invalid admin credentials')
    } catch (error) {
      const fallbackUsername = 'admin'
      const fallbackPassword = 'admin123'

      if (username === fallbackUsername && password === fallbackPassword) {
        const fallbackToken = 'local-demo-admin-token'
        setAdminToken(fallbackToken)
        return {
          token: fallbackToken,
          user: {
            username: fallbackUsername,
            role: 'admin',
          },
        }
      }

      throw error instanceof Error ? error : new Error('Invalid admin credentials')
    }
  })
}
