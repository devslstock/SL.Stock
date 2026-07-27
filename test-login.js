import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://dnmmudjzzqxabbhlvlhx.supabase.co', 'sb_publishable_BnFNzKI0qJZdCJFzmfqTIw_n01JdQXJ');

async function testLogin() {
  console.log('Testing login...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: '1distribuidoradeliciusgmailcom@estoquefacil.local',
    password: 'Trocar@123'
  });
  if (error) {
    console.error('Login error:', error.message);
  } else {
    console.log('Login successful! User ID:', data.user?.id);
  }
}

testLogin();
