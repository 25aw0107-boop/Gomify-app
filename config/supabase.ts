import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mhcytzjsikzlwdzullnp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oY3l0empzaWt6bHdkenVsbG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Nzc3MjQsImV4cCI6MjA5NzE1MzcyNH0.G65D7ecYJDmct9GhR-qcLb0r5vieBEYCn1G7tlN_ink';

export const supabase = createClient(supabaseUrl, supabaseKey);