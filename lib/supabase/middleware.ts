import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

const SUPABASE_URL = "https://nxlaqaknuvjqsmmwpung.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGFxYWtudXZqcXNtbXdwdW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODAyODQsImV4cCI6MjA4MDc1NjI4NH0.uS8WiYGJxD7D1gQUW_PQhYSOsgtHfbh-IlnCIoM1lCw"

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  // Create client for session check
  const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Refresh session if expired
  await supabase.auth.getUser()

  return supabaseResponse
}
