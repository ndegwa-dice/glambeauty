import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteRequest {
  stylistName: string;
  stylistEmail: string;
  salonName: string;
  stylistId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    // Verify the user is a salon owner
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { stylistName, stylistEmail, salonName, stylistId }: InviteRequest = await req.json();

    if (!stylistName || !stylistEmail || !salonName || !stylistId) {
      throw new Error("Missing required fields");
    }

    // Build the invite link
    const appUrl = req.headers.get("origin") || "https://glambeauty.lovable.app";
    const inviteLink = `${appUrl}/auth?invite=true&email=${encodeURIComponent(stylistEmail)}`;

    // Send the branded invitation email
    const emailResponse = await resend.emails.send({
      from: "GLAMOS <onboarding@resend.dev>",
      to: [stylistEmail],
      subject: `You're invited to join ${salonName} on GLAMOS! 💅`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #ffffff; border-radius: 16px; overflow: hidden;">
          <div style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%);">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">✨ GLAMOS ✨</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Beauty. Redefined.</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 16px; font-size: 22px; color: #f8bbd0;">Hey ${stylistName}! 👋</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0;">
              You've been invited to join <strong style="color: #f48fb1;">${salonName}</strong> as a team member on GLAMOS!
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #bdbdbd;">
              Create your account to access your personal stylist dashboard, manage your schedule, showcase your portfolio, and connect with clients.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${inviteLink}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #e91e63, #9c27b0); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px;">
                Join ${salonName} →
              </a>
            </div>
            
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-top: 24px;">
              <p style="margin: 0; font-size: 13px; color: #9e9e9e;">
                🔒 This invitation was sent to <strong>${stylistEmail}</strong>. 
                Use this exact email when creating your account to be automatically linked to your salon.
              </p>
            </div>
          </div>
          
          <div style="padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
            <p style="margin: 0; font-size: 12px; color: #757575;">
              © GLAMOS — Your salon, your brand, your way
            </p>
          </div>
        </div>
      `,
    });

    console.log("Invite email sent:", emailResponse);

    // Update invitation status to 'sent' using service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    await adminClient
      .from("stylists")
      .update({ invitation_status: "sent", invited_at: new Date().toISOString() })
      .eq("id", stylistId);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending stylist invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
