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
    const requestBodyText = await req.text()
    let requestBody = null;
    
    try {
      requestBody = requestBodyText ? JSON.parse(requestBodyText) : null;
    } catch (e) {
      console.log('📥 Request body (text):', requestBodyText || 'empty')
    }
    
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
        'notifications.legal_document_alert_days',
        'notifications.badge_alert_days'
      ])

    if (settingsError) {
      console.error('❌ Error fetching settings:', settingsError)
    }

    // Parse settings or use defaults
    const certAlertDays = parseInt(settingsData?.find(s => s.setting_key === 'notifications.certification_alert_days')?.setting_value) || 60;
    const techAlertDays = parseInt(settingsData?.find(s => s.setting_key === 'notifications.technical_attestation_alert_days')?.setting_value) || 45;
    const legalAlertDays = parseInt(settingsData?.find(s => s.setting_key === 'notifications.legal_document_alert_days')?.setting_value) || 30;
    const badgeAlertDays = parseInt(settingsData?.find(s => s.setting_key === 'notifications.badge_alert_days')?.setting_value) || 30;

    console.log(`⚙️ Alert periods - Certifications: ${certAlertDays}d, Technical: ${techAlertDays}d, Legal: ${legalAlertDays}d, Badges: ${badgeAlertDays}d`)

    // Calculate future dates based on settings
    const today = new Date().toISOString().split('T')[0]
    const certAlertDate = new Date(Date.now() + certAlertDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const techAlertDate = new Date(Date.now() + techAlertDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const legalAlertDate = new Date(Date.now() + legalAlertDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const badgeAlertDate = new Date(Date.now() + badgeAlertDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 📊 Check for expiring certifications and create notifications
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

    // 📊 Check for expiring technical attestations and create notifications
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

    // 📊 Check for expiring legal documents and create notifications
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

    // 📊 Check for expiring badges and create notifications
    console.log('🔍 Checking for expiring badges...')
    const { data: expiringBadges, error: badgeError } = await supabase
      .from('badges')
      .select('id, name, user_id, expiry_date, status')
      .gte('expiry_date', today)
      .lte('expiry_date', badgeAlertDate)

    if (badgeError) {
      console.error('❌ Error fetching badges:', badgeError)
    } else {
      console.log(`📋 Found ${expiringBadges?.length || 0} expiring badges`)
      expiringBadges?.forEach(badge => {
        console.log(`  - ${badge.name} (${badge.expiry_date}) - Status: ${badge.status}`)
      })
    }

    // 📨 Create notifications for expiring documents
    console.log('📨 Creating notifications for expiring documents...')
    let notificationsCreated = 0

    // Helper function to calculate days until expiry and determine notification type
    const getDaysUntilExpiry = (validityDate: string) => {
      const today = new Date()
      const expiry = new Date(validityDate)
      const diffTime = expiry.getTime() - today.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const getNotificationConfig = (daysLeft: number, documentName: string) => {
      if (daysLeft <= 0) {
        return {
          type: 'error',
          title: 'Documento Vencido',
          message: `${documentName} venceu há ${Math.abs(daysLeft)} dia(s).`
        }
      } else if (daysLeft <= 14) {
        return {
          type: 'error',
          title: 'Urgente: Documento Vence em Breve',
          message: `${documentName} vence em ${daysLeft} dia(s).`
        }
      } else if (daysLeft <= 29) {
        return {
          type: 'warning',
          title: 'Atenção: Documento Vencendo',
          message: `${documentName} vence em ${daysLeft} dia(s).`
        }
      } else {
        return {
          type: 'info',
          title: 'Documento Vence em Breve',
          message: `${documentName} vence em ${daysLeft} dia(s).`
        }
      }
    }

    // Helper function to check if notification already exists for this document
    const hasRecentNotification = async (userId: string, documentId: string, documentType: string) => {
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('related_document_id', documentId)
        .eq('related_document_type', documentType)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .limit(1)
      
      return data && data.length > 0
    }

    // Process certifications
    if (expiringCertifications && expiringCertifications.length > 0) {
      console.log('📧 Processing certification notifications...')
      for (const cert of expiringCertifications) {
        try {
          const hasNotification = await hasRecentNotification(cert.user_id, cert.id, 'certification')
          if (hasNotification) {
            console.log(`⏭️ Skipping certification ${cert.name} - notification already exists`)
            continue
          }

          const daysLeft = getDaysUntilExpiry(cert.validity_date)
          const config = getNotificationConfig(daysLeft, cert.name)
          
          console.log(`🔍 Debug: Cert ID = ${cert.id}, User ID = ${cert.user_id}`)
          
          const insertData = {
            user_id: cert.user_id,
            title: config.title,
            message: config.message,
            notification_type: config.type,
            related_document_id: cert.id,
            related_document_type: 'certification',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          }
          
          console.log('📝 Inserting notification data:', JSON.stringify(insertData, null, 2))
          
          const { data: insertResult, error: notifError } = await supabase
            .from('notifications')
            .insert(insertData)
            .select('id, related_document_id')

          if (notifError) {
            console.error(`❌ Error creating notification for certification ${cert.name}:`, notifError)
          } else {
            notificationsCreated++
            console.log(`✅ Notification created for certification: ${cert.name} (${daysLeft} days left)`)
            console.log(`📊 Insert result:`, JSON.stringify(insertResult, null, 2))
          }
        } catch (error) {
          console.error(`❌ Error processing certification ${cert.name}:`, error)
        }
      }
    }

    // Process technical attestations
    if (expiringTechnical && expiringTechnical.length > 0) {
      console.log('📧 Processing technical attestation notifications...')
      for (const tech of expiringTechnical) {
        try {
          const hasNotification = await hasRecentNotification(tech.user_id, tech.id, 'technical_attestation')
          if (hasNotification) {
            console.log(`⏭️ Skipping technical attestation ${tech.project_object} - notification already exists`)
            continue
          }

          const daysLeft = getDaysUntilExpiry(tech.validity_date)
          const config = getNotificationConfig(daysLeft, tech.project_object)
          
          console.log(`🔍 Debug: Tech ID = ${tech.id}, User ID = ${tech.user_id}`)
          
          const insertData = {
            user_id: tech.user_id,
            title: config.title,
            message: config.message,
            notification_type: config.type,
            related_document_id: tech.id,
            related_document_type: 'technical_attestation',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          }
          
          console.log('📝 Inserting tech notification data:', JSON.stringify(insertData, null, 2))
          
          const { data: insertResult, error: notifError } = await supabase
            .from('notifications')
            .insert(insertData)
            .select('id, related_document_id')

          if (notifError) {
            console.error(`❌ Error creating notification for technical attestation ${tech.project_object}:`, notifError)
          } else {
            notificationsCreated++
            console.log(`✅ Notification created for technical attestation: ${tech.project_object} (${daysLeft} days left)`)
            console.log(`📊 Tech insert result:`, JSON.stringify(insertResult, null, 2))
          }
        } catch (error) {
          console.error(`❌ Error processing technical attestation ${tech.project_object}:`, error)
        }
      }
    }

    // Process legal documents
    if (expiringLegal && expiringLegal.length > 0) {
      console.log('📧 Processing legal document notifications...')
      for (const legal of expiringLegal) {
        try {
          const hasNotification = await hasRecentNotification(legal.user_id, legal.id, 'legal_document')
          if (hasNotification) {
            console.log(`⏭️ Skipping legal document ${legal.document_name} - notification already exists`)
            continue
          }

          const daysLeft = getDaysUntilExpiry(legal.validity_date)
          const config = getNotificationConfig(daysLeft, legal.document_name)
          
          console.log(`🔍 Debug: Legal ID = ${legal.id}, User ID = ${legal.user_id}`)
          
          const insertData = {
            user_id: legal.user_id,
            title: config.title,
            message: config.message,
            notification_type: config.type,
            related_document_id: legal.id,
            related_document_type: 'legal_document',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          }
          
          console.log('📝 Inserting legal notification data:', JSON.stringify(insertData, null, 2))
          
          const { data: insertResult, error: notifError } = await supabase
            .from('notifications')
            .insert(insertData)
            .select('id, related_document_id')

          if (notifError) {
            console.error(`❌ Error creating notification for legal document ${legal.document_name}:`, notifError)
          } else {
            notificationsCreated++
            console.log(`✅ Notification created for legal document: ${legal.document_name} (${daysLeft} days left)`)
            console.log(`📊 Legal insert result:`, JSON.stringify(insertResult, null, 2))
          }
        } catch (error) {
          console.error(`❌ Error processing legal document ${legal.document_name}:`, error)
        }
      }
    }

    // Process badges
    if (expiringBadges && expiringBadges.length > 0) {
      console.log('📧 Processing badge notifications...')
      for (const badge of expiringBadges) {
        try {
          const hasNotification = await hasRecentNotification(badge.user_id, badge.id, 'badge')
          if (hasNotification) {
            console.log(`⏭️ Skipping badge ${badge.name} - notification already exists`)
            continue
          }

          const daysLeft = getDaysUntilExpiry(badge.expiry_date)
          const config = getNotificationConfig(daysLeft, badge.name)
          
          console.log(`🔍 Debug: Badge ID = ${badge.id}, User ID = ${badge.user_id}`)
          
          const insertData = {
            user_id: badge.user_id,
            title: config.title,
            message: config.message,
            notification_type: config.type,
            related_document_id: badge.id,
            related_document_type: 'badge',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          }
          
          console.log('📝 Inserting badge notification data:', JSON.stringify(insertData, null, 2))
          
          const { data: insertResult, error: notifError } = await supabase
            .from('notifications')
            .insert(insertData)
            .select('id, related_document_id')

          if (notifError) {
            console.error(`❌ Error creating notification for badge ${badge.name}:`, notifError)
          } else {
            notificationsCreated++
            console.log(`✅ Notification created for badge: ${badge.name} (${daysLeft} days left)`)
            console.log(`📊 Badge insert result:`, JSON.stringify(insertResult, null, 2))
          }
        } catch (error) {
          console.error(`❌ Error processing badge ${badge.name}:`, error)
        }
      }
    }

    // 📧 Create consolidated admin notifications
    console.log('📧 Creating admin consolidated notifications...')
    const totalExpiring = (expiringCertifications?.length || 0) + (expiringTechnical?.length || 0) + (expiringLegal?.length || 0) + (expiringBadges?.length || 0);
    
    if (totalExpiring > 0) {
      // Get all admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
      
      if (adminError) {
        console.error('❌ Error fetching admin users:', adminError)
      } else if (adminUsers && adminUsers.length > 0) {
        console.log(`👤 Found ${adminUsers.length} admin users`)
        
        const adminNotifications = adminUsers.map(admin => ({
          user_id: admin.user_id,
          title: '🔔 Alerta: Documentos Expirando',
          message: `${totalExpiring} documento(s) expirando: ${expiringCertifications?.length || 0} certificações, ${expiringBadges?.length || 0} badges, ${expiringTechnical?.length || 0} atestados técnicos, ${expiringLegal?.length || 0} documentos legais.`,
          notification_type: totalExpiring > 10 ? 'warning' : 'info',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }))
        
        const { error: adminNotifError } = await supabase
          .from('notifications')
          .insert(adminNotifications)
        
        if (adminNotifError) {
          console.error('❌ Error creating admin notifications:', adminNotifError)
        } else {
          console.log(`✅ Created ${adminNotifications.length} admin notifications`)
        }
      }
    }

    console.log(`📧 Total notifications created: ${notificationsCreated}`)

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
    // Reuse the 'today' variable already declared at line 58
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
    console.log(`  - Expiring badges: ${expiringBadges?.length || 0}`)
    console.log(`  - Notifications created today: ${notificationCount || 0}`)
    console.log(`  - New notifications created this run: ${notificationsCreated}`)
    console.log(`  - Old notifications cleaned: ${deletedCount || 0}`)
    console.log(`  - Alert periods: Cert=${certAlertDays}d, Tech=${techAlertDays}d, Legal=${legalAlertDays}d, Badge=${badgeAlertDays}d`)

    const jobCompletedAt = new Date().toISOString()
    console.log('🎉 Daily notification job completed successfully at:', jobCompletedAt)

    // 🔧 Create admin test notification if in test mode
    let adminTestNotification = null;
    if (requestBody && typeof requestBody === 'object' && 'test_mode' in requestBody) {
      try {
        console.log('🧪 Creating admin test notification...');
        const { data: testNotif, error: testError } = await supabase
          .from('notifications')
          .insert({
            user_id: '3164a91d-e1ab-49a7-946a-4c85b00cadbc', // Current admin user
            title: 'Teste do Sistema de Notificações',
            message: `Sistema testado com sucesso! Encontradas ${(expiringCertifications?.length || 0) + (expiringTechnical?.length || 0) + (expiringLegal?.length || 0)} notificações de vencimento. ${notificationsCreated} novas notificações criadas nesta execução.`,
            notification_type: 'success',
            related_document_type: null,
            related_document_id: null,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expires in 24 hours
          })
          .select()
          .single();
        
        if (testError) {
          console.error('❌ Error creating admin test notification:', testError);
        } else {
          adminTestNotification = testNotif;
          console.log('✅ Admin test notification created:', testNotif?.id);
        }
      } catch (error) {
        console.error('💥 Exception creating admin test notification:', error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily notification job completed successfully',
      timestamp: jobCompletedAt,
      test_mode: requestBody && typeof requestBody === 'object' && 'test_mode' in requestBody,
      admin_test_notification: adminTestNotification?.id || null,
      statistics: {
        expiringCertifications: expiringCertifications?.length || 0,
        expiringTechnicalAttestations: expiringTechnical?.length || 0,
        expiringLegalDocuments: expiringLegal?.length || 0,
        notificationsToday: notificationCount || 0,
        newNotificationsCreated: notificationsCreated,
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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error stack:', errorStack)
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      stack: errorStack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})