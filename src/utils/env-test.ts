// Test environment variables loading
export const testEnvVars = () => {
  console.log('=== Environment Variables Test ===');
  console.log('VITE_RESEND_API_KEY:', import.meta.env.VITE_RESEND_API_KEY ? 'Loaded' : 'Missing');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Loaded' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Loaded' : 'Missing');
  
  if (import.meta.env.VITE_RESEND_API_KEY) {
    console.log('Resend API Key preview:', import.meta.env.VITE_RESEND_API_KEY.substring(0, 8) + '...');
  }
  
  console.log('All env vars:', import.meta.env);
  console.log('=== End Environment Variables Test ===');
};

// Auto-run in development
if (import.meta.env.DEV) {
  testEnvVars();
}
