import { exec } from 'child_process';

function addEnv(name, value) {
  return new Promise((resolve) => {
    // We must pass the value into vercel env add using pipe properly.
    const p = exec(`npx vercel env add ${name} production`);
    
    p.stdout.on('data', d => console.log(d.toString()));
    p.stderr.on('data', d => console.error(d.toString()));
    
    p.on('close', resolve);
    
    // Write exactly the string value
    p.stdin.write(value);
    p.stdin.end();
  });
}

async function run() {
  await addEnv('VITE_SUPABASE_URL', 'https://skcehyqjhjzqtafvuvye.supabase.co');
  await addEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_gyoZ1eM6w6WU9w3dteKoug_Ua-a3Dke');
  console.log('Done');
}

run();
