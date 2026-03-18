// Supabase client setup and utilities

import { createSupabaseBrowser, supabaseServer } from './database/client';
import { DatabaseClient } from './database/client';

// Client-side Supabase instance
export const supabase = createSupabaseBrowser();

// Server-side database client
export const db = new DatabaseClient(supabaseServer);

// Client-side database client (for client components)
export const createClientDb = () => new DatabaseClient(supabase);