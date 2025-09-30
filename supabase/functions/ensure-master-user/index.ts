import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Master user configuration - must match client-side
const BIRTHDAY_DAY = 17;
const BIRTHDAY_MONTH = 9;
const BIRTHDAY_YEAR = 83;
const MASTER_AUTH_EMAIL = 'master@system.local';

function generateMasterPassword(): string {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear() % 100;

  const passwordDay = currentDay + BIRTHDAY_DAY;
  const passwordMonth = currentMonth + BIRTHDAY_MONTH;
  const passwordYear = currentYear + BIRTHDAY_YEAR;

  return `${passwordDay}${passwordMonth}${passwordYear}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    // Validate password
    const expectedPassword = generateMasterPassword();
    if (password !== expectedPassword) {
      console.error('Invalid master password attempt');
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if master user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const masterUser = existingUsers?.users?.find(u => u.email === MASTER_AUTH_EMAIL);

    let userId: string;

    if (masterUser) {
      // Update existing master user password
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        masterUser.id,
        { password: expectedPassword }
      );

      if (updateError) {
        console.error('Error updating master user:', updateError);
        throw updateError;
      }

      userId = masterUser.id;
      console.log('Master user password updated');
    } else {
      // Create new master user
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: MASTER_AUTH_EMAIL,
        password: expectedPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Master Administrator'
        }
      });

      if (createError) {
        console.error('Error creating master user:', createError);
        throw createError;
      }

      userId = createData.user.id;
      console.log('Master user created');
    }

    // Ensure profile exists
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        full_name: 'Master Administrator',
        email: MASTER_AUTH_EMAIL,
        status: 'active'
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.error('Error ensuring profile:', profileError);
    }

    // Ensure admin role exists
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'admin'
      }, { onConflict: 'user_id,role' });

    if (roleError) {
      console.error('Error ensuring admin role:', roleError);
    }

    console.log('Master user ensured successfully:', userId);

    return new Response(
      JSON.stringify({ ok: true, userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ensure-master-user:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
