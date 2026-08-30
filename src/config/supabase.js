import { createClient } from "@supabase/supabase-js/dist/index.cjs";
import  dotenv  from "dotenv";

dotenv.config();

const supabaseUrl = process.env.supabaseurl;
const supabaseAnonKey = process.env.anonkey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);