import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

export interface AuthResult {
  user: User;
  supabase: SupabaseClient;
}

export async function authenticate(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Unauthorized: Missing Authorization header');
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Server configuration error: Missing Supabase URL or Anon Key');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: Invalid token');
  }

  return { user, supabase };
}
