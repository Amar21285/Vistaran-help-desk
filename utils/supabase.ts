import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Replace with your own credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database tables:
// - users
// - tickets
// - technicians
// - files
// - symptoms
// - templates
// - departments
// - inventory
// - vendors
// - challans
// - outward_invoices
// - purchase_orders
// - attendance
