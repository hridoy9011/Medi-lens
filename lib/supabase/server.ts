import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://nxlaqaknuvjqsmmwpung.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bGFxYWtudXZqcXNtbXdwdW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODAyODQsImV4cCI6MjA4MDc1NjI4NH0.uS8WiYGJxD7D1gQUW_PQhYSOsgtHfbh-IlnCIoM1lCw"

export async function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
