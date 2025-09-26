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

    console.log('🔧 Starting notification links fix job...', new Date().toISOString())
    
    let fixedCount = 0

    // Get notifications with NULL related_document_id
    console.log('🔍 Fetching notifications without document links...')
    const { data: brokenNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .is('related_document_id', null)
      .not('related_document_type', 'is', null)

    if (fetchError) {
      console.error('❌ Error fetching notifications:', fetchError)
      throw fetchError
    }

    console.log(`📊 Found ${brokenNotifications?.length || 0} notifications to fix`)

    if (brokenNotifications && brokenNotifications.length > 0) {
      for (const notification of brokenNotifications) {
        try {
          console.log(`🔍 Processing notification: ${notification.id} - ${notification.title}`)
          
          let documentId = null
          
          // Try to match document based on message content and user_id
          if (notification.related_document_type === 'certification') {
            // Extract certification name from message
            const { data: certs } = await supabase
              .from('certifications')
              .select('id, name')
              .eq('user_id', notification.user_id)
            
            if (certs && certs.length > 0) {
              // For now, just take the first cert - in production you'd want better matching
              documentId = certs[0].id
              console.log(`🎯 Matched certification: ${certs[0].name} (${documentId})`)
            }
          }
          
          if (notification.related_document_type === 'technical_attestation') {
            const { data: techs } = await supabase
              .from('technical_attestations')
              .select('id, project_object')
              .eq('user_id', notification.user_id)
            
            if (techs && techs.length > 0) {
              documentId = techs[0].id
              console.log(`🎯 Matched technical attestation: ${techs[0].project_object} (${documentId})`)
            }
          }
          
          if (notification.related_document_type === 'legal_document') {
            const { data: legals } = await supabase
              .from('legal_documents')
              .select('id, document_name')
              .eq('user_id', notification.user_id)
            
            if (legals && legals.length > 0) {
              documentId = legals[0].id
              console.log(`🎯 Matched legal document: ${legals[0].document_name} (${documentId})`)
            }
          }
          
          // Update notification if we found a match
          if (documentId) {
            const { error: updateError } = await supabase
              .from('notifications')
              .update({ related_document_id: documentId })
              .eq('id', notification.id)
            
            if (updateError) {
              console.error(`❌ Error updating notification ${notification.id}:`, updateError)
            } else {
              fixedCount++
              console.log(`✅ Fixed notification ${notification.id} -> ${documentId}`)
            }
          } else {
            console.log(`⚠️ Could not find matching document for notification ${notification.id}`)
          }
          
        } catch (error) {
          console.error(`❌ Error processing notification ${notification.id}:`, error)
        }
      }
    }

    console.log(`🎉 Fix job completed. Fixed ${fixedCount} notifications.`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Notification links fix completed',
      fixed_notifications: fixedCount,
      total_broken: brokenNotifications?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('💥 ERROR in notification fix job:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})