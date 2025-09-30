import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupStats {
  expired_deleted: number;
  old_read_deleted: number;
  total_deleted: number;
  retention_days: number;
  executed_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Starting notification cleanup job...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get retention settings from system_settings
    const { data: settings } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'notifications.retention_days')
      .single();

    const retentionDays = settings?.setting_value ? parseInt(settings.setting_value) : 90;
    console.log(`📅 Using retention period: ${retentionDays} days`);

    const stats: CleanupStats = {
      expired_deleted: 0,
      old_read_deleted: 0,
      total_deleted: 0,
      retention_days: retentionDays,
      executed_at: new Date().toISOString(),
    };

    // 1. Delete expired notifications
    const { data: expired, error: expiredError } = await supabase
      .from('notifications')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (expiredError) {
      console.error('❌ Error deleting expired notifications:', expiredError);
    } else {
      stats.expired_deleted = expired?.length || 0;
      console.log(`✅ Deleted ${stats.expired_deleted} expired notifications`);
    }

    // 2. Delete old read notifications (beyond retention period)
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);

    const { data: oldRead, error: oldReadError } = await supabase
      .from('notifications')
      .delete()
      .not('read_at', 'is', null)
      .lt('read_at', retentionDate.toISOString())
      .select('id');

    if (oldReadError) {
      console.error('❌ Error deleting old read notifications:', oldReadError);
    } else {
      stats.old_read_deleted = oldRead?.length || 0;
      console.log(`✅ Deleted ${stats.old_read_deleted} old read notifications`);
    }

    stats.total_deleted = stats.expired_deleted + stats.old_read_deleted;

    // Log cleanup stats
    console.log('📊 Cleanup Statistics:', JSON.stringify(stats, null, 2));

    // Create system notification for admins about cleanup
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins && admins.length > 0 && stats.total_deleted > 0) {
      const cleanupNotifications = admins.map(admin => ({
        user_id: admin.user_id,
        title: '🧹 Limpeza Automática de Notificações',
        message: `Sistema limpou ${stats.total_deleted} notificações antigas (${stats.expired_deleted} expiradas, ${stats.old_read_deleted} lidas antigas)`,
        notification_type: 'info',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }));

      await supabase.from('notifications').insert(cleanupNotifications);
      console.log('✅ Created admin notifications about cleanup');
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        message: `Cleanup completed: ${stats.total_deleted} notifications removed`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Cleanup job failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
