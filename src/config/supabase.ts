import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.supabaseUrl;
const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.supabaseSecretKey;

if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
        "Variáveis de ambiente do Supabase não configuradas. Defina SUPABASE_URL e SUPABASE_SECRET_KEY (ou as chaves em minúsculas)."
    );
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

export default supabase;