-- ══════════════════════════════════════════════════════════════════
-- SUPPORT TICKETS — FULL FIX
-- Run this entire script in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Create table (safe if already exists)
CREATE TABLE IF NOT EXISTS support_tickets (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_name      text,
    guest_email     text,
    guest_phone     text,
    guest_whatsapp  text,
    guest_handle    text,
    subject         text NOT NULL,
    message         text NOT NULL,
    status          text NOT NULL DEFAULT 'open',
    admin_reply     text,
    replied_at      timestamptz
);

-- 2. Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "support_insert_auth"     ON support_tickets;
DROP POLICY IF EXISTS "support_insert_anon"     ON support_tickets;
DROP POLICY IF EXISTS "support_read_own"        ON support_tickets;
DROP POLICY IF EXISTS "support_admin_all"       ON support_tickets;
DROP POLICY IF EXISTS "support_update_admin"    ON support_tickets;
DROP POLICY IF EXISTS "support_select_admin"    ON support_tickets;

-- 3. Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- 4. ADMIN: full access using JWT email claim (most reliable method)
CREATE POLICY "support_admin_select" ON support_tickets
    FOR SELECT TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'sharibaru0@gmail.com'
        OR auth.uid() = user_id
    );

CREATE POLICY "support_admin_update" ON support_tickets
    FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'email' = 'sharibaru0@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'sharibaru0@gmail.com');

-- 5. Authenticated users: insert their own tickets
CREATE POLICY "support_auth_insert" ON support_tickets
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 6. GUESTS (anon): insert guest tickets (user_id must be NULL)
-- First, grant INSERT permission to anon role on the table
GRANT INSERT ON support_tickets TO anon;
GRANT USAGE ON SCHEMA public TO anon;

CREATE POLICY "support_anon_insert" ON support_tickets
    FOR INSERT TO anon
    WITH CHECK (user_id IS NULL);

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION touch_support_ticket()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_ticket_touch ON support_tickets;
CREATE TRIGGER support_ticket_touch
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION touch_support_ticket();

-- ── Verify: show current policies ─────────────────────────────────
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'support_tickets';
