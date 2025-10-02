import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  documentId: string;
  documentType: 'legal_document' | 'certification' | 'badge' | 'technical_attestation';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Unauthorized');
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { documentId, documentType } = body;

    if (!documentId || !documentType) {
      throw new Error('Missing documentId or documentType');
    }

    console.log(`Generating signed URL for ${documentType} ${documentId} for user ${user.id}`);

    // Verify user has access to this document
    let hasAccess = false;
    let documentUrl = '';
    let isSensitive = false;

    if (documentType === 'legal_document') {
      const { data: doc, error: docError } = await supabaseClient
        .from('legal_documents')
        .select('user_id, document_url, is_sensitive')
        .eq('id', documentId)
        .maybeSingle();

      if (docError) {
        console.error('Error fetching document:', docError);
        throw new Error('Document not found');
      }

      if (!doc) {
        throw new Error('Document not found');
      }

      // Get user role
      const { data: roleData } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const isAdmin = roleData?.role === 'admin';
      const isOwner = doc.user_id === user.id;

      // Check access: owner, admin, or team leader (for non-sensitive docs)
      if (isOwner || isAdmin) {
        hasAccess = true;
      } else if (!doc.is_sensitive) {
        // Check if user is team leader
        const { data: isLeader } = await supabaseClient
          .rpc('is_direct_team_leader', {
            leader_id: user.id,
            member_id: doc.user_id
          });
        
        if (isLeader) {
          hasAccess = true;
        }
      }

      documentUrl = doc.document_url;
      isSensitive = doc.is_sensitive;
    }

    if (!hasAccess) {
      // Log unauthorized access attempt
      await supabaseClient.rpc('log_audit_event', {
        p_table_name: 'legal_documents',
        p_record_id: documentId,
        p_action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        p_new_values: {
          user_id: user.id,
          document_type: documentType,
          timestamp: new Date().toISOString()
        }
      });

      throw new Error('Access denied');
    }

    // Extract storage path from URL
    // URLs are typically: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const urlParts = documentUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      throw new Error('Invalid document URL format');
    }

    const [bucket, ...pathParts] = urlParts[1].split('/');
    const path = pathParts.join('/');

    // Generate signed URL (expires in 1 hour)
    const { data: signedUrlData, error: signedError } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 3600 seconds = 1 hour

    if (signedError) {
      console.error('Error creating signed URL:', signedError);
      throw new Error('Failed to generate signed URL');
    }

    // Log successful access
    await supabaseClient.rpc('log_audit_event', {
      p_table_name: 'legal_documents',
      p_record_id: documentId,
      p_action: 'DOCUMENT_ACCESS',
      p_new_values: {
        user_id: user.id,
        document_type: documentType,
        is_sensitive: isSensitive,
        access_granted: true,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        signedUrl: signedUrlData.signedUrl,
        expiresIn: 3600,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        isSensitive
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in get-signed-document-url:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' || error.message === 'Access denied' ? 403 : 500,
      }
    );
  }
});
