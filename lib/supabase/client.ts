import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://nxlaqaknuvjqsmmwpung.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGFxYWtudXZqcXNtbXdwdW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODAyODQsImV4cCI6MjA4MDc1NjI4NH0.uS8WiYGJxD7D1gQUW_PQhYSOsgtHfbh-IlnCIoM1lCw"

// Singleton pattern to prevent multiple instances
let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (client) return client

  client = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      storageKey: 'sb-nxlaqaknuvjqsmmwpung-auth-token',
      storage: {
        getItem: (key) => {
          if (typeof document === 'undefined') return null
          const cookie = document.cookie.split('; ').find(row => row.startsWith(`${key}=`))
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
        },
        setItem: (key, value) => {
          if (typeof document === 'undefined') return
          document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`
        },
        removeItem: (key) => {
          if (typeof document === 'undefined') return
          document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`
        }
      }
    }
  })

  return client
}
