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

    // 📊 Fetch system settings for alert days
    console.log('🔧 Fetching system settings for alert periods...')
    const { data: settingsData, error: settingsError } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'notifications.certification_alert_days',
        'notifications.technical_attestation_alert_days', 
        'notifications.legal_document_alert_days'
      ])

    if (settingsError) {
      console.error('❌ Error fetching settings:', settingsError)
    }

    // Parse settings or use defaults
    const certAlertDays = parseInt(settingsData?.find(s => s.setting_key === 'notifications.certification_alert_days')?.setting_value) || 60;
    const techAlertDays = parseInt(settingsData?.find(s => s.setting_key === 'notifications.technical_attestation_alert_days')?.setting_value) || 45;
    const legalAlertDays = parseInt(settingsData?.find(s => s.setting_key === 'notifications.legal_document_alert_days')?.setting_value) || 30;

    console.log(`⚙️ Alert periods - Certifications: ${certAlertDays}d, Technical: ${techAlertDays}d, Legal: ${legalAlertDays}d`)

    // Calculate future dates based on settings
    const today = new Date().toISOString().split('T')[0]
    const certAlertDate = new Date(Date.now() + certAlertDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const techAlertDate = new Date(Date.now() + techAlertDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const legalAlertDate = new Date(Date.now() + legalAlertDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 📊 Check for expiring certifications
    console.log('🔍 Checking for expiring certifications...')
    const { data: expiringCertifications, error: certError } = await supabase
      .from('certifications')
      .select('id, name, user_id, validity_date, status')
      .gte('validity_date', today)
      .lte('validity_date', certAlertDate)

    if (certError) {
      console.error('❌ Error fetching certifications:', certError)
    } else {
      console.log(`📋 Found ${expiringCertifications?.length || 0} expiring certifications`)
      expiringCertifications?.forEach(cert => {
        console.log(`  - ${cert.name} (${cert.validity_date}) - Status: ${cert.status}`)
      })
    }

    // 📊 Check for expiring technical attestations
    console.log('🔍 Checking for expiring technical attestations...')
    const { data: expiringTechnical, error: techError } = await supabase
      .from('technical_attestations')
      .select('id, project_object, user_id, validity_date, status')
      .gte('validity_date', today)
      .lte('validity_date', techAlertDate)

    if (techError) {
      console.error('❌ Error fetching technical attestations:', techError)
    } else {
      console.log(`📋 Found ${expiringTechnical?.length || 0} expiring technical attestations`)
      expiringTechnical?.forEach(tech => {
        console.log(`  - ${tech.project_object} (${tech.validity_date}) - Status: ${tech.status}`)
      })
    }

    // 📊 Check for expiring legal documents
    console.log('🔍 Checking for expiring legal documents...')
    const { data: expiringLegal, error: legalError } = await supabase
      .from('legal_documents')
      .select('id, document_name, user_id, validity_date, status')
      .gte('validity_date', today)
      .lte('validity_date', legalAlertDate)

    if (legalError) {
      console.error('❌ Error fetching legal documents:', legalError)
    } else {
      console.log(`📋 Found ${expiringLegal?.length || 0} expiring legal documents`)
      expiringLegal?.forEach(legal => {
        console.log(`  - ${legal.document_name} (${legal.validity_date}) - Status: ${legal.status}`)
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
    console.log(`  - Expiring certifications: ${expiringCertifications?.length || 0}`)
    console.log(`  - Expiring technical attestations: ${expiringTechnical?.length || 0}`)
    console.log(`  - Expiring legal documents: ${expiringLegal?.length || 0}`)
    console.log(`  - Notifications created today: ${notificationCount || 0}`)
    console.log(`  - Old notifications cleaned: ${deletedCount || 0}`)
    console.log(`  - Alert periods: Cert=${certAlertDays}d, Tech=${techAlertDays}d, Legal=${legalAlertDays}d`)

    const jobCompletedAt = new Date().toISOString()
    console.log('🎉 Daily notification job completed successfully at:', jobCompletedAt)

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily notification job completed successfully',
      timestamp: jobCompletedAt,
      statistics: {
        expiringCertifications: expiringCertifications?.length || 0,
        expiringTechnicalAttestations: expiringTechnical?.length || 0,
        expiringLegalDocuments: expiringLegal?.length || 0,
        notificationsToday: notificationCount || 0,
        totalNotifications: totalNotifications || 0,
        totalCertifications: totalCertifications || 0,
        oldNotificationsDeleted: deletedCount || 0,
        alertPeriods: {
          certifications: certAlertDays,
          technicalAttestations: techAlertDays,
          legalDocuments: legalAlertDays
        }
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