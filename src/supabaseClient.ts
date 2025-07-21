import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qvizfdyqgzttdqowegff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2aXpmZHlxZ3p0dGRxb3dlZ2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNzY0MzksImV4cCI6MjA2ODY1MjQzOX0.xa6D_mpvzV4sUQwQLPBR8h0a-tx1LrH7k9HDSdV8O9c';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;


