/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

//@ts-ignore
let supabase: SupabaseClient | null = global.supabase ?? null;

// @ts-ignore
if (!global.supabase) {
  supabase = createClient(
    process.env.SUPABASE_ENDPOINT as string,
    process.env.SUPABASE_SECRET_KEY as string
  );
  // @ts-ignore
  global.supabase = supabase;
}

export default supabase as SupabaseClient;
