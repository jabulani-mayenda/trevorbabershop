-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id),
  CONSTRAINT expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- 2. Update Daily Sales Table
ALTER TABLE public.daily_sales 
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmed';

-- 3. Update Monthly Commissions Table
ALTER TABLE public.monthly_commissions
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending', -- pending, payable, paid
ADD COLUMN IF NOT EXISTS payable_date date,
ADD COLUMN IF NOT EXISTS paid_date date;

-- 4. Create RLS Policies (Security)

-- Enable RLS on new table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Expenses Policies
DROP POLICY IF EXISTS "Admins can view all expenses for their businesses" ON public.expenses;
CREATE POLICY "Admins can view all expenses for their businesses" 
ON public.expenses FOR SELECT 
USING (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE admin_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Employees can view their own expenses" ON public.expenses;
CREATE POLICY "Employees can view their own expenses" 
ON public.expenses FOR SELECT 
USING (
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Employees can insert expenses" ON public.expenses;
CREATE POLICY "Employees can insert expenses" 
ON public.expenses FOR INSERT 
WITH CHECK (
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

-- Update Daily Sales Policies (Strict Isolation)
ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view sales for their businesses" ON public.daily_sales;
CREATE POLICY "Admins can view sales for their businesses" 
ON public.daily_sales FOR SELECT 
USING (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE admin_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Employees can view ONLY their own sales" ON public.daily_sales;
CREATE POLICY "Employees can view ONLY their own sales" 
ON public.daily_sales FOR SELECT 
USING (
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Employees can insert their own sales" ON public.daily_sales;
CREATE POLICY "Employees can insert their own sales" 
ON public.daily_sales FOR INSERT 
WITH CHECK (
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);
