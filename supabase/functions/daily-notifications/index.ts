import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🚀 Starting daily notification job...', new Date().toISOString())
    
    // Log request details for debugging
    const requestBody = await req.text()
    console.log('📥 Request body:', requestBody || 'empty')
    console.log('🔗 Request method:', req.method)
    console.log('📍 Request URL:', req.url)

    // 📊 Check for expiring certifications in the next 30 days
    console.log('🔍 Checking for expiring certifications...')
    const { data: expiringCertifications, error: certError } = await supabase
      .from('certifications')
      .select('id, name, user_id, validity_date, status')
      .gte('validity_date', new Date().toISOString().split('T')[0])
      .lte('validity_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    if (certError) {
      console.error('❌ Error fetching certifications:', certError)
    } else {
      console.log(`📋 Found ${expiringCertifications?.length || 0} expiring certifications`)
      expiringCertifications?.forEach(cert => {
        console.log(`  - ${cert.name} (${cert.validity_date}) - Status: ${cert.status}`)
      })
    }

    // 🔄 Update document status using RPC
    console.log('🔄 Calling update_document_status RPC...')
    const updateStartTime = Date.now()
    const { data: updateResult, error: updateError } = await supabase.rpc('update_document_status')
    
    if (updateError) {
      console.error('❌ Error updating document status:', updateError)
    } else {
      const updateDuration = Date.now() - updateStartTime
      console.log(`✅ Document status updated successfully in ${updateDuration}ms:`, updateResult)
    }

    // 📈 Count notifications created today
    console.log('📈 Counting today\'s notifications...')
    const today = new Date().toISOString().split('T')[0]
    const { count: notificationCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .gte('created_at', today + 'T00:00:00Z')
      .lt('created_at', today + 'T23:59:59Z')

    if (countError) {
      console.error('❌ Error counting notifications:', countError)
    } else {
      console.log(`📨 Notifications created today: ${notificationCount || 0}`)
    }

    // 🧹 Clean up old notifications (older than 30 days)
    console.log('🧹 Cleaning up old notifications...')
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: deletedCount, error: deleteError } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .lt('expires_at', thirtyDaysAgo)

    if (deleteError) {
      console.error('❌ Error cleaning up old notifications:', deleteError)
    } else {
      console.log(`🗑️ Old notifications cleaned up: ${deletedCount || 0}`)
    }

    // ✅ Create a test notification to verify the system is working
    console.log('✅ Creating system verification notification...')
    const { data: testNotification, error: testError } = await supabase
      .from('notifications')
      .insert({
        user_id: '1b2e3a2b-7cd7-45df-97eb-b68f9f829710', // Admin user
        title: 'Sistema Funcionando',
        message: `Verificação automática executada em ${new Date().toLocaleString('pt-BR')}. Job ID: ${crypto.randomUUID().substring(0, 8)}`,
        notification_type: 'info',
        related_document_type: null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()

    if (testError) {
      console.error('❌ Error creating test notification:', testError)
    } else {
      console.log('📬 Test notification created:', testNotification?.[0]?.id)
    }

    // 📊 Final statistics
    const { count: totalNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })

    const { count: totalCertifications } = await supabase
      .from('certifications')
      .select('*', { count: 'exact' })

    console.log('📊 FINAL STATISTICS:')
    console.log(`  - Total notifications in system: ${totalNotifications || 0}`)
    console.log(`  - Total certifications in system: ${totalCertifications || 0}`)
    console.log(`  - Notifications created today: ${notificationCount || 0}`)
    console.log(`  - Old notifications cleaned: ${deletedCount || 0}`)

    const jobCompletedAt = new Date().toISOString()
    console.log('🎉 Daily notification job completed successfully at:', jobCompletedAt)

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily notification job completed successfully',
      timestamp: jobCompletedAt,
      statistics: {
        expiringCertifications: expiringCertifications?.length || 0,
        notificationsToday: notificationCount || 0,
        totalNotifications: totalNotifications || 0,
        totalCertifications: totalCertifications || 0,
        oldNotificationsDeleted: deletedCount || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('💥 ERROR in daily notification job:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})