
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
const kv = await Deno.openKv();


async function handler(_req: Request) {

  if( _req.method === "OPTIONS" ) {
    return respondJSON({ok: "OK"});
  }
  
  const { method } = _req;
  const url = new URL(_req.url);
  const id = url.searchParams.get('id');
  
  const routes = {
    '/likes': {
      GET: async (id) => await getLikes(id),
      POST: async (id) => await postLike(id)
    },
    '/likes/reset': {
      GET: async (id) => await resetLikes(id),
    }
  };

  if( routes[url.pathname] && id ) {
    const responseData = await routes[url.pathname]?.[method](id);
    return respondJSON( responseData );
  }

  return respondJSON({ success: false }, 404);
}

serve(handler);


async function getLikes(id) {

  const res = await kv.get(['likes', id]);

  if( res.value === null ) {
    await kv.set(['likes', id], 0);
  }

  return { success:true, id, likes: res.value ?? 0 };
}

async function postLike(id) {

  const { likes } = await getLikes(id);
  const res = await kv.set(['likes', id], likes+1 );
  
  if( !res.ok ) {
    return { success: false, likes }
  }

  return { success: true, id, likes: likes+1 };
}

async function resetLikes(id) {

  const res = await kv.set(['likes', id], 0 );
  
  if( !res.ok ) {
    return { success: false }
  }
  
  return { success: true, id, likes: 0 };
}

function respondJSON( data, status = 200 ) {
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  };

  return new Response(JSON.stringify(data, null, 2),{
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json;charset=UTF-8',
    },
  });
}