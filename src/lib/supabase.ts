import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  const hint =
    supabaseUrl && !supabaseKey
      ? " NEXT_PUBLIC_SUPABASE_ANON_KEY is empty — copy the anon public key from Supabase Dashboard → Settings → API."
      : "";
  throw new Error(
    `Missing Supabase environment variables in .env.local: Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.${hint}`,
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
