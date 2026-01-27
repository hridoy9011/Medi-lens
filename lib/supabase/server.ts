import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const SUPABASE_URL = "https://nxlaqaknuvjqsmmwpung.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGFxYWtudXZqcXNtbXdwdW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODAyODQsImV4cCI6MjA4MDc1NjI4NH0.uS8WiYGJxD7D1gQUW_PQhYSOsgtHfbh-IlnCIoM1lCw"

export async function createClient() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("sb-nxlaqaknuvjqsmmwpung-auth-token")?.value

  let token = ""
  if (sessionCookie) {
    try {
      // Supabase browser client stores the entire session/token as a JSON string when persistSession is true
      const session = JSON.parse(decodeURIComponent(sessionCookie))
      token = session.access_token || ""
    } catch (e) {
      // Fallback: maybe it's a raw token
      token = sessionCookie
    }
  }

  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ""
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}
