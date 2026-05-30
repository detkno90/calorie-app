import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bgpxaefusgizerlcfmkx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncHhhZWZ1c2dpemVybGNmbWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4ODEzMTgsImV4cCI6MjA5NTQ1NzMxOH0.GqDj8J1LChMorQKdFYV4bH0-bJSJ0DkJ6Hun11RtQlI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  },
});
