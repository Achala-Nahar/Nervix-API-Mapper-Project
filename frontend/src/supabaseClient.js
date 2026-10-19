import { createClient } from '@supabase/supabase-js';

// Replace these with your actual credentials from the Supabase Dashboard API Settings
const supabaseUrl = 'https://ypzerrmfawiuvbmowakd.supabase.co';
const supabaseAnonKey = 'sb_publishable_r6U49eClkyHIIb3XCl4Kbg_5pSpW1gz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);