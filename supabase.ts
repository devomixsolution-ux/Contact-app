
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulgjljnnimilqtfgohjc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZ2psam5uaW1pbHF0ZmdvaGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDE3MDUsImV4cCI6MjA4NTUxNzcwNX0.18TM-hXror0oBhZYzH-7Y3zfdCCxEJDMuBrdhgNCGTw';

// Custom fetch to force unique URLs for every request to bypass Android WebView internal caching
const customFetch = (url: RequestInfo | URL, options: RequestInit = {}) => {
  let finalUrl = url.toString();
  
  // Only apply cache busting to GET requests (Supabase uses POST for some queries, but mostly GET for fetches)
  // To be safe and aggressive for WebView, we apply it to all requests if it's a Supabase API call
  if (finalUrl.includes('supabase.co')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}t_cache_bust=${Date.now()}`;
  }

  return fetch(finalUrl, {
    ...options,
    headers: {
      ...options.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
};

// Fix: Exported as 'any' to resolve 'Property does not exist on type SupabaseAuthClient' errors across the app
export const supabase: any = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
