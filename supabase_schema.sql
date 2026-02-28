-- Run this SQL in your Supabase SQL Editor

-- 1. Devices Table
CREATE TABLE public.devices (
    serial_number TEXT PRIMARY KEY,
    alias TEXT,
    is_authorized BOOLEAN DEFAULT false,
    last_activity TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Attendances Table
CREATE TABLE public.attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_sn TEXT REFERENCES public.devices(serial_number),
    user_pin TEXT NOT NULL,
    verify_type INTEGER,
    status INTEGER,
    punch_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Device Commands Table (for Push SDK server-to-device remote commands)
CREATE TABLE public.device_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_sn TEXT REFERENCES public.devices(serial_number),
    command_string TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'EXECUTED', 'FAILED')),
    return_value TEXT,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS) if you plan to use Supabase securely from a frontend
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;

-- Create policies (Example for Admin access)
-- Note: Service Role Key (used in backend) bypasses RLS automatically.
