// ── Supabase Edge Function: Notify New Task ──
// Production-ready email broadcaster for Afrgram.
// optimized to handle multiple users via Resend batching.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
    // 1. Basic security check
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    try {
        const payload = await req.json()
        const { record } = payload

        if (!record) {
            return new Response(JSON.stringify({ error: "No record found" }), { status: 400 })
        }

        const { title, description, reward } = record

        // 2. Initialize Supabase Client with Service Role
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // 3. Fetch user emails from profiles (more efficient than auth.users)
        // We fetch emails as an array to minimize data transfer
        const { data: users, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .not('email', 'is', null)

        if (profileError) throw profileError

        if (!users || users.length === 0) {
            return new Response(JSON.stringify({ message: "No active users to notify" }), { status: 200 })
        }

        const emails = users.map(u => u.email)
        const totalUsers = emails.length

        // 4. Batch Processing for Resend (Resend limit: 100 emails per API call)
        const BATCH_SIZE = 100
        const emailBatches = []
        for (let i = 0; i < totalUsers; i += BATCH_SIZE) {
            emailBatches.push(emails.slice(i, i + BATCH_SIZE))
        }

        console.log(`System: Processing ${totalUsers} users in ${emailBatches.length} batches...`)

        // 5. Parallel Dispatch to Resend
        // Using Promise.all with some concurrency control could be better for massive scale,
        // but for 15,000 users (150 batches), we'll dispatch in parallel.
        const dispatchPromises = emailBatches.map(batch => {
            return fetch('https://api.resend.com/emails/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify(batch.map(email => ({
                    from: 'Afrgram Team <notifications@afrgram.com>',
                    to: email,
                    subject: `🚀 New Task: ${title} — Earn ${reward} RWF!`,
                    html: `
                        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; background: #fafafa; color: #1a1a1a;">
                            <div style="background: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
                                <div style="display: flex; align-items: center; margin-bottom: 30px;">
                                    <span style="background: #3b82f6; color: white; font-weight: 900; padding: 10px 15px; border-radius: 12px; font-style: italic;">A</span>
                                    <span style="font-size: 24px; font-weight: 900; margin-left: 12px; letter-spacing: -0.02em;">Afrgram</span>
                                </div>
                                <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 16px 0; line-height: 1.1; color: #111;">New Task Alert!</h1>
                                <p style="font-size: 16px; color: #666; margin: 0 0 32px 0; line-height: 1.6;">A new earning opportunity is available on the platform. Complete it now to boost your balance.</p>
                                
                                <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
                                    <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1e293b;">${title}</h3>
                                    <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b; line-height: 1.5;">${description}</p>
                                    <div style="display: inline-block; padding: 8px 16px; background: #dcfce7; border: 1px solid #bbf7d0; color: #15803d; border-radius: 99px; font-weight: 900; font-size: 14px;">
                                        +${reward} RWF Reward
                                    </div>
                                </div>

                                <a href="https://afrgram.com/dashboard" style="display: block; width: 100%; padding: 18px; background: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 16px; font-weight: 800; text-align: center; box-shadow: 0 4px 20px rgba(59,130,246,0.3);">Open Dashboard</a>
                                
                                <p style="margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                                    You received this email because you are a registered user of Afrgram.<br/>
                                    If you no longer wish to receive task alerts, update your settings in the app.
                                </p>
                            </div>
                        </div>
                    `
                })))
            })
        })

        const responses = await Promise.allSettled(dispatchPromises)
        const failures = responses.filter(r => r.status === 'rejected')

        return new Response(JSON.stringify({
            status: "success",
            total_emails_sent: emails.length,
            batches: emailBatches.length,
            failures: failures.length
        }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        })

    } catch (err) {
        console.error("Critical Error:", err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500
        })
    }
})
