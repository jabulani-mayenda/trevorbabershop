-- Fix for Infinite Recursion on Businesses Table
-- Run this in Supabase Dashboard > SQL Editor

-- The issue: "Employees can view their business" policy on businesses table queries employees table.
-- "Admins can manage employees" policy on employees table queries businesses table.
-- This creates a loop: businesses -> employees -> businesses -> ...

-- Solution: Use a SECURITY DEFINER function to get the employee's business IDs.
-- This breaks the RLS chain.

-- 1. Create a secure function to get business IDs for the current user
CREATE OR REPLACE FUNCTION public.get_my_business_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT business_id FROM public.employees WHERE user_id = auth.uid();
$$;

-- 2. Drop ALL possible existing policies (to avoid "already exists" errors)
DROP POLICY IF EXISTS "Employees can view their business" ON public.businesses;
DROP POLICY IF EXISTS "Admins can manage own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can view own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can update own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can delete own businesses" ON public.businesses;

-- 3. Re-create "Admins can manage own businesses" (Split for clarity)
CREATE POLICY "Admins can view own businesses" ON public.businesses
    FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "Admins can insert businesses" ON public.businesses
    FOR INSERT WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can update own businesses" ON public.businesses
    FOR UPDATE USING (admin_id = auth.uid());

CREATE POLICY "Admins can delete own businesses" ON public.businesses
    FOR DELETE USING (admin_id = auth.uid());

-- 4. Re-create "Employees can view their business" using the function
CREATE POLICY "Employees can view their business" ON public.businesses
    FOR SELECT USING (
        id IN (SELECT public.get_my_business_ids())
    );
