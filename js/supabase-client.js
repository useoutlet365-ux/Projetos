// =====================================================
// OUTLET 365 — Supabase Client
// =====================================================

const SUPABASE_URL     = 'https://umbqcfefdctakdkxlixy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYnFjZmVmZGN0YWtka3hsaXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NjE5MDYsImV4cCI6MjA5NTEzNzkwNn0.r9fRNxtd2h64AEvE4O9RbLIa0EKh0et7lLiApJmOcu4';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
