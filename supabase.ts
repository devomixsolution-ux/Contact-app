
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulgjljnnimilqtfgohjc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZ2psam5uaW1pbHF0ZmdvaGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDE3MDUsImV4cCI6MjA4NTUxNzcwNX0.18TM-hXror0oBhZYzH-7Y3zfdCCxEJDMuBrdhgNCGTw';

// Custom fetch to force unique URLs and handle headers correctly for Android WebView
const customFetch = (url: RequestInfo | URL, options: RequestInit = {}) => {
  let finalUrl = url.toString();
  
  // Apply cache busting to GET requests
  if (finalUrl.includes('supabase.co')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}t_cb=${Date.now()}`;
  }

  // Create a proper Headers object to avoid losing Supabase's internal headers (like apikey)
  const headers = new Headers(options.headers || {});
  
  // Force cache-busting headers
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  // Ensure apikey is present as a fallback
  if (!headers.has('apikey')) {
    headers.set('apikey', supabaseAnonKey);
  }

  return fetch(finalUrl, {
    ...options,
    headers,
  });
};

// Exported as 'any' to resolve type conflicts across different views
export const supabase: any = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
