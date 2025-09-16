import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting daily notifications and status update job...')

    // First, let's check what documents are expiring
    const { data: expiringDocs, error: queryError } = await supabaseAdmin
      .from('certifications')
      .select('id, name, validity_date, user_id')
      .not('validity_date', 'is', null)
      .lte('validity_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
      .gte('validity_date', new Date().toISOString())

    console.log(`Found ${expiringDocs?.length || 0} expiring certifications`)
    if (expiringDocs && expiringDocs.length > 0) {
      console.log('Expiring docs:', JSON.stringify(expiringDocs, null, 2))
    }

    // Call the database function to update document statuses and create notifications
    const { data, error } = await supabaseAdmin.rpc('update_document_status')

    if (error) {
      console.error('Error updating document status:', error)
      throw error
    }

    console.log('Document status update completed successfully')
    console.log('RPC result:', data)

    // Get count of notifications created today for reporting
    const today = new Date().toISOString().split('T')[0]
    const { data: notificationCount, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact' })
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)

    if (countError) {
      console.error('Error getting notification count:', countError)
    } else {
      console.log(`Created ${notificationCount?.length || 0} notifications today`)
    }

    // Optional: Clean up old expired notifications
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { error: cleanupError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .not('expires_at', 'is', null)
      .lt('expires_at', thirtyDaysAgo.toISOString())

    if (cleanupError) {
      console.error('Error cleaning up old notifications:', cleanupError)
    } else {
      console.log('Cleaned up expired notifications older than 30 days')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Daily notification job completed successfully',
        notificationsCreated: notificationCount?.length || 0
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in daily notifications function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})