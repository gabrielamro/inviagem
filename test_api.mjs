import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'ewgglooabyzilweudhoo';

async function testApi() {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/sql`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: 'SELECT 1;' })
    });

    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Result:', result);
}

testApi();
