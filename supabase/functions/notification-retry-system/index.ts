import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RetryQueueItem {
  id: string;
  notification_id: string;
  user_id: string;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  next_retry_at: string;
  notification_data: any;
}

interface RetryResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting notification retry system...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const result: RetryResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    // Get items ready for retry (next_retry_at <= now)
    const { data: retryItems, error: fetchError } = await supabase
      .from('notification_retry_queue')
      .select('*')
      .lte('next_retry_at', new Date().toISOString())
      .lt('retry_count', 'max_retries')
      .order('next_retry_at', { ascending: true })
      .limit(50); // Process max 50 at a time

    if (fetchError) {
      console.error('❌ Error fetching retry queue:', fetchError);
      throw fetchError;
    }

    if (!retryItems || retryItems.length === 0) {
      console.log('✅ No items to retry');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No items to retry',
          result,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`📊 Found ${retryItems.length} items to retry`);

    // Process each item
    for (const item of retryItems as RetryQueueItem[]) {
      result.processed++;
      
      try {
        // Try to insert/recreate the notification
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(item.notification_data);

        if (insertError) {
          throw insertError;
        }

        // Success! Remove from retry queue
        await supabase
          .from('notification_retry_queue')
          .delete()
          .eq('id', item.id);

        result.succeeded++;
        console.log(`✅ Successfully retried notification ${item.notification_id}`);
        
      } catch (error: any) {
        result.failed++;
        const errorMessage = error.message || 'Unknown error';
        
        console.error(`❌ Failed to retry notification ${item.notification_id}:`, errorMessage);
        result.errors.push({ id: item.id, error: errorMessage });

        // Calculate next retry time with exponential backoff
        const newRetryCount = item.retry_count + 1;
        const backoffSeconds = Math.pow(2, newRetryCount); // 2^retry_count seconds
        const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

        if (newRetryCount >= item.max_retries) {
          // Max retries reached, mark as failed and notify admins
          console.log(`⚠️ Max retries reached for notification ${item.notification_id}`);
          
          // Get admins
          const { data: admins } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin');

          if (admins && admins.length > 0) {
            const failureNotifications = admins.map(admin => ({
              user_id: admin.user_id,
              title: '⚠️ Falha no Sistema de Notificações',
              message: `Notificação ${item.notification_id} falhou após ${item.max_retries} tentativas. Erro: ${errorMessage}`,
              notification_type: 'error',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }));

            await supabase.from('notifications').insert(failureNotifications);
          }

          // Delete from retry queue
          await supabase
            .from('notification_retry_queue')
            .delete()
            .eq('id', item.id);
            
        } else {
          // Update retry queue with new attempt info
          await supabase
            .from('notification_retry_queue')
            .update({
              retry_count: newRetryCount,
              last_error: errorMessage,
              next_retry_at: nextRetryAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
        }
      }
    }

    console.log('📊 Retry Results:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        result,
        message: `Processed ${result.processed} items: ${result.succeeded} succeeded, ${result.failed} failed`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Retry system failed:', error);
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
