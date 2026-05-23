const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://plbwqjdrivyffrhpbmvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYndxamRyaXZ5ZmZyaHBibXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjY3NjYsImV4cCI6MjA5MDcwMjc2Nn0.nZDHmQyVdn4a99zISog9-hzOzsFQ7G8RClV8GPe7sJw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  try {
    const { data, error } = await supabase
      .from('shop_items')
      .select('id, meta_value, category, is_active')
      .eq('category', 'theme');

    if (error) {
      console.error('Error fetching shop_items:', error);
      return;
    }

    console.log(`Found ${data.length} theme items:`);
    for (const item of data) {
      console.log(`ID: ${item.id}`);
      console.log('Raw meta_value:');
      console.log(item.meta_value);
      console.log('---');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

inspect();
