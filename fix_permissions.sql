-- 1. Create a function to get the current user's role safely (bypassing RLS for the lookup)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Update the check constraint on profiles.role (Requires dropping the old one first if it exists).
-- Since dropping a constraint requires knowing its name, and Supabase doesn't easily let us script finding it,
-- a safer approach for this script is to just rely on the application to send correct strings, or
-- if we must enforce it, we alter the type or drop the constraint if known.
-- Assuming standard Supabase, we might have `profiles_role_check`.
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE IF EXISTS public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('Admin', 'Manager', 'Executive', 'Refund Manager', 'Special Camp Manager'));

-- Add password column for Admin visibility (Insecure but requested)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;


-- 2. Update Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and users can update profiles" ON profiles;
CREATE POLICY "Admins and users can update profiles" ON profiles FOR UPDATE 
    USING (auth.uid() = id OR get_my_role() = 'Admin');

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id OR get_my_role() = 'Admin');

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE 
    USING (get_my_role() = 'Admin');

-- 3. Update Form Options Policies
DROP POLICY IF EXISTS "Form options are viewable by everyone" ON form_options;
CREATE POLICY "Form options are viewable by everyone" ON form_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify form_options" ON form_options;
CREATE POLICY "Only admins can modify form_options" ON form_options 
    USING (get_my_role() = 'Admin');

-- 4. Update Leads Policies
-- First, ensure created_by has a default value so RLS policies work even if app doesn't send it
ALTER TABLE public.leads ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Drop ANY potential policy that might be blocking inserts or causing name conflicts
DROP POLICY IF EXISTS "Viewing leads based on role" ON leads;
DROP POLICY IF EXISTS "Inserting leads is allowed for all auth users" ON leads;
DROP POLICY IF EXISTS "Updating leads based on role" ON leads;
DROP POLICY IF EXISTS "Deleting leads is for Admins only" ON leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON leads;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON leads;
DROP POLICY IF EXISTS "Allow all authenticated inserts" ON leads;
DROP POLICY IF EXISTS "Allow authenticated insert" ON leads;

CREATE POLICY "Viewing leads based on role" ON leads FOR SELECT 
    USING (
        get_my_role() IN ('Admin', 'Manager') OR 
        assigned_to = auth.uid() OR
        (
            EXISTS (
                SELECT 1 FROM event_assignments ea 
                WHERE ea.user_id = auth.uid() 
                AND (leads.primary_event = ea.event_value OR ea.event_value = ANY(leads.events_interested))
            )
        )
    );

CREATE POLICY "Inserting leads is allowed for all auth users" ON leads FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Updating leads based on role" ON leads FOR UPDATE 
    USING (
        get_my_role() IN ('Admin', 'Manager') OR 
        assigned_to = auth.uid()
    );

CREATE POLICY "Deleting leads is for Admins only" ON leads FOR DELETE 
    USING (get_my_role() = 'Admin');

-- 5. Update Activities Policies
DROP POLICY IF EXISTS "Anyone can view activities" ON lead_activities;
CREATE POLICY "Anyone can view activities" ON lead_activities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can add activities" ON lead_activities;
CREATE POLICY "Anyone can add activities" ON lead_activities FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- 6. Update Event Assignments Policies
DROP POLICY IF EXISTS "Anyone can view event assignments" ON event_assignments;
CREATE POLICY "Anyone can view event assignments" ON event_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify assignments" ON event_assignments;
CREATE POLICY "Only admins can modify assignments" ON event_assignments FOR ALL 
    USING (get_my_role() = 'Admin');

-- 7. Ensure correct GRANTS (Supabase defaults usually work, but let's be safe)
-- Moved to bottom to ensure new tables are included

-- 8. Lead Requests
CREATE TABLE IF NOT EXISTS lead_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    events_interested JSONB,
    primary_event TEXT,
    requester_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lead_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create lead requests" ON lead_requests;
CREATE POLICY "Users can create lead requests" ON lead_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Admins can view lead requests" ON lead_requests;
DROP POLICY IF EXISTS "Users can view own lead requests" ON lead_requests;
CREATE POLICY "Users can view own lead requests" ON lead_requests FOR SELECT 
USING (get_my_role() = 'Admin' OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "Admins can update lead requests" ON lead_requests;
CREATE POLICY "Admins can update lead requests" ON lead_requests FOR UPDATE 
USING (get_my_role() = 'Admin');

-- 9. Helper for duplicate check (Bypasses row-level data access for searching)
CREATE OR REPLACE FUNCTION public.check_lead_exists_by_phone(phone_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.leads WHERE phone = phone_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply grants at the end
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

