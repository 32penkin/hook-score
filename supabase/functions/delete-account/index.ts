declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

type DeleteAccountRequest = {
  confirm?: boolean;
};

type SupabaseUser = {
  id?: string;
  email?: string | null;
};

type AccountDeletionRequestRow = {
  id: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 500,
    readonly payload?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const requireEnv = (name: string) => {
  const value = Deno.env.get(name);

  if (!value) {
    throw new HttpError(`${name} is not configured`, 500);
  }

  return value;
};

const getBearer = (req: Request) => {
  const authorization = req.headers.get('authorization');

  if (!authorization?.toLowerCase().startsWith('bearer ')) {
    throw new HttpError('Authorization bearer token is required', 401);
  }

  return authorization;
};

const parseResponseBody = async (response: Response) => {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
};

const assertResponseOk = async (response: Response, fallbackMessage: string) => {
  const responseBody = await parseResponseBody(response);

  if (response.ok) {
    return responseBody;
  }

  const message =
    responseBody &&
    typeof responseBody === 'object' &&
    'message' in responseBody &&
    typeof responseBody.message === 'string'
      ? responseBody.message
      : fallbackMessage;

  throw new HttpError(message, response.status, responseBody);
};

const getCurrentUser = async (authorization: string): Promise<SupabaseUser> => {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: authorization,
    },
  });

  const user = (await assertResponseOk(
    response,
    'Could not verify the current user'
  )) as SupabaseUser;

  if (!user.id) {
    throw new HttpError('Could not verify the current user', 401);
  }

  if (!user.email) {
    throw new HttpError('Account email is required before deletion', 400);
  }

  return user;
};

const getServiceHeaders = () => {
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };
};

const reserveDeletionRequest = async (user: SupabaseUser) => {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const response = await fetch(
    `${supabaseUrl}/rest/v1/account_deletion_requests?on_conflict=user_id`,
    {
      method: 'POST',
      headers: {
        ...getServiceHeaders(),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([
        {
          user_id: user.id,
          email: user.email,
          status: 'pending',
        },
      ]),
    }
  );

  const rows = (await assertResponseOk(
    response,
    'Could not record account deletion request'
  )) as AccountDeletionRequestRow[];
  const row = rows[0];

  if (!row?.id) {
    throw new HttpError('Could not record account deletion request', 500);
  }

  return row;
};

const markDeletionCompleted = async (requestId: string) => {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const response = await fetch(
    `${supabaseUrl}/rest/v1/account_deletion_requests?id=eq.${encodeURIComponent(requestId)}`,
    {
      method: 'PATCH',
      headers: {
        ...getServiceHeaders(),
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        status: 'completed',
        updated_at: new Date().toISOString(),
      }),
    }
  );

  await assertResponseOk(response, 'Could not mark account deletion completed');
};

const deleteAuthUser = async (userId: string) => {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
      headers: getServiceHeaders(),
    }
  );

  if (response.status === 404) {
    return;
  }

  await assertResponseOk(response, 'Could not delete account');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authorization = getBearer(req);
    const payload = (await req.json()) as DeleteAccountRequest;

    if (payload.confirm !== true) {
      throw new HttpError('Deletion confirmation is required', 400);
    }

    const user = await getCurrentUser(authorization);
    const deletionRequest = await reserveDeletionRequest(user);

    await deleteAuthUser(user.id as string);

    try {
      await markDeletionCompleted(deletionRequest.id);
    } catch (error) {
      console.error('[delete-account] completion update failed', {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return jsonResponse({
      deleted: true,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Account deletion failed';

    console.error('[delete-account] failed', {
      status,
      message,
      payload: error instanceof HttpError ? error.payload : undefined,
    });

    return jsonResponse({ error: message }, status);
  }
});
