
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulgjljnnimilqtfgohjc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZ2psam5uaW1pbHF0ZmdvaGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDE3MDUsImV4cCI6MjA4NTUxNzcwNX0.18TM-hXror0oBhZYzH-7Y3zfdCCxEJDMuBrdhgNCGTw';

// Cleanest possible client for maximum stability and no token duplication
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: window.localStorage
  }
});
