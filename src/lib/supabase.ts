import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

// Server-side client — bypasses RLS when using service role key
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
