-- Run this SQL in Supabase Dashboard > SQL Editor
-- This fixes the "row violates row-level security policy" error when creating employees
-- FIXED: Avoids infinite recursion by using a security definer function

-- Step 1: Create a helper function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Step 2: Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can create employee users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

-- Step 4: Create new policies using the helper function

-- Policy 1: Allow users to read their own record
CREATE POLICY "Users can read own record"
ON public.users FOR SELECT
USING (id = auth.uid());

-- Policy 2: Allow admins to read all users (uses helper function)
CREATE POLICY "Admins can read all users"
ON public.users FOR SELECT
USING (public.is_admin());

-- Policy 3: Allow admins to insert employee users (THIS FIXES YOUR ERROR!)
CREATE POLICY "Admins can create employee users"
ON public.users FOR INSERT
WITH CHECK (
  role = 'employee' AND public.is_admin()
);

-- Policy 4: Allow users to insert their own record (for self-registration/signup)
CREATE POLICY "Users can insert own record"
ON public.users FOR INSERT
WITH CHECK (id = auth.uid());
