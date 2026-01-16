-- =====================================================
-- BIZMANAGER COMPLETE DATABASE SCHEMA
-- Run this in Supabase Dashboard > SQL Editor
-- THIS WILL DROP ALL EXISTING TABLES AND START FRESH
-- =====================================================

-- =====================================================
-- STEP 1: DROP EVERYTHING FIRST
-- =====================================================
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.monthly_commissions CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.daily_sales CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 2: CREATE ALL TABLES
-- =====================================================

-- 1. USERS TABLE
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. BUSINESSES TABLE
CREATE TABLE public.businesses (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    business_type text NOT NULL,
    location text,
    description text,
    phone text,
    email text,
    logo_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. EMPLOYEES TABLE
CREATE TABLE public.employees (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text,
    position text DEFAULT 'Staff',
    commission_rate numeric DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    base_salary numeric DEFAULT 0,
    hire_date date DEFAULT CURRENT_DATE,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, business_id)
);

-- 4. DAILY SALES TABLE
CREATE TABLE public.daily_sales (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    sale_date date NOT NULL DEFAULT CURRENT_DATE,
    total_sales numeric NOT NULL DEFAULT 0 CHECK (total_sales >= 0),
    cash_amount numeric DEFAULT 0,
    card_amount numeric DEFAULT 0,
    tip_amount numeric DEFAULT 0,
    service_count integer DEFAULT 0,
    notes text,
    status text DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'disputed')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(employee_id, sale_date)
);

-- 5. EXPENSES TABLE
CREATE TABLE public.expenses (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
    amount numeric NOT NULL CHECK (amount > 0),
    category text NOT NULL,
    description text,
    expense_date date NOT NULL DEFAULT CURRENT_DATE,
    receipt_url text,
    is_approved boolean DEFAULT false,
    approved_by uuid REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now()
);

-- 6. MONTHLY COMMISSIONS TABLE
CREATE TABLE public.monthly_commissions (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    month integer NOT NULL CHECK (month >= 1 AND month <= 12),
    year integer NOT NULL CHECK (year >= 2020),
    total_sales numeric NOT NULL DEFAULT 0,
    commission_rate numeric NOT NULL,
    commission_amount numeric NOT NULL DEFAULT 0,
    bonus numeric DEFAULT 0,
    deductions numeric DEFAULT 0,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'payable', 'paid')),
    payable_date date,
    paid_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(employee_id, month, year)
);

-- 7. SERVICES TABLE
CREATE TABLE public.services (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric NOT NULL CHECK (price >= 0),
    duration_minutes integer DEFAULT 30,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 8. APPOINTMENTS TABLE
CREATE TABLE public.appointments (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
    client_name text NOT NULL,
    client_phone text,
    client_email text,
    appointment_date date NOT NULL,
    appointment_time time NOT NULL,
    duration_minutes integer DEFAULT 30,
    status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 9. ACTIVITY LOG TABLE
CREATE TABLE public.activity_log (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- STEP 3: HELPER FUNCTIONS
-- =====================================================
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

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: RLS POLICIES
-- =====================================================

-- USERS POLICIES
CREATE POLICY "Users can read own record" ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can read all users" ON public.users
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can create employee users" ON public.users
    FOR INSERT WITH CHECK (role = 'employee' AND public.is_admin());

CREATE POLICY "Users can insert own record" ON public.users
    FOR INSERT WITH CHECK (id = auth.uid());

-- BUSINESSES POLICIES
CREATE POLICY "Admins can manage own businesses" ON public.businesses
    FOR ALL USING (admin_id = auth.uid());

CREATE POLICY "Employees can view their business" ON public.businesses
    FOR SELECT USING (
        id IN (SELECT business_id FROM public.employees WHERE user_id = auth.uid())
    );

-- EMPLOYEES POLICIES
CREATE POLICY "Admins can manage employees" ON public.employees
    FOR ALL USING (
        business_id IN (SELECT id FROM public.businesses WHERE admin_id = auth.uid())
    );

CREATE POLICY "Employees can view themselves" ON public.employees
    FOR SELECT USING (user_id = auth.uid());

-- DAILY SALES POLICIES
CREATE POLICY "Admins can manage sales" ON public.daily_sales
    FOR ALL USING (
        business_id IN (SELECT id FROM public.businesses WHERE admin_id = auth.uid())
    );

CREATE POLICY "Employees can view own sales" ON public.daily_sales
    FOR SELECT USING (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    );

CREATE POLICY "Employees can insert sales" ON public.daily_sales
    FOR INSERT WITH CHECK (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    );

-- EXPENSES POLICIES
CREATE POLICY "Admins can manage expenses" ON public.expenses
    FOR ALL USING (
        business_id IN (SELECT id FROM public.businesses WHERE admin_id = auth.uid())
    );

CREATE POLICY "Employees can view own expenses" ON public.expenses
    FOR SELECT USING (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    );

CREATE POLICY "Employees can insert expenses" ON public.expenses
    FOR INSERT WITH CHECK (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    );

-- MONTHLY COMMISSIONS POLICIES
CREATE POLICY "Admins can manage commissions" ON public.monthly_commissions
    FOR ALL USING (
        business_id IN (SELECT id FROM public.businesses WHERE admin_id = auth.uid())
    );

CREATE POLICY "Employees can view own commissions" ON public.monthly_commissions
    FOR SELECT USING (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    );

-- SERVICES POLICIES
CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL USING (
        business_id IN (SELECT id FROM public.businesses WHERE admin_id = auth.uid())
    );

CREATE POLICY "Anyone can view services" ON public.services
    FOR SELECT USING (true);

-- APPOINTMENTS POLICIES
CREATE POLICY "Admins can manage appointments" ON public.appointments
    FOR ALL USING (
        business_id IN (SELECT id FROM public.businesses WHERE admin_id = auth.uid())
    );

CREATE POLICY "Employees can view appointments" ON public.appointments
    FOR SELECT USING (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    );

-- ACTIVITY LOG POLICIES
CREATE POLICY "Admins can view activity" ON public.activity_log
    FOR SELECT USING (
        business_id IN (SELECT id FROM public.businesses WHERE admin_id = auth.uid())
    );

CREATE POLICY "Users can insert activity" ON public.activity_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- STEP 6: INDEXES
-- =====================================================
CREATE INDEX idx_businesses_admin ON public.businesses(admin_id);
CREATE INDEX idx_employees_business ON public.employees(business_id);
CREATE INDEX idx_employees_user ON public.employees(user_id);
CREATE INDEX idx_daily_sales_business ON public.daily_sales(business_id);
CREATE INDEX idx_daily_sales_employee ON public.daily_sales(employee_id);
CREATE INDEX idx_daily_sales_date ON public.daily_sales(sale_date);
CREATE INDEX idx_expenses_business ON public.expenses(business_id);
CREATE INDEX idx_commissions_employee ON public.monthly_commissions(employee_id, year, month);

-- =====================================================
-- DONE! Database is ready.
-- =====================================================
