/**
 * CareerOS — Vercel serverless proxy (same-origin /api/rpc).
 * The Google Apps Script URL stays in the Vercel environment, not the browser.
 * Add GAS_WEB_APP_URL environment variable in Vercel project settings.
 */
export async function POST(request) {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
  try {
    const endpoint = process.env.GAS_WEB_APP_URL || '';
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint)) {
      return new Response(JSON.stringify({ok:false,error:{code:'CONFIG_ERROR',message:'GAS_WEB_APP_URL not configured in Vercel.'}}),{status:503,headers});
    }
    if (!String(request.headers.get('content-type') || '').startsWith('application/json')) {
      return new Response(JSON.stringify({ok:false,error:{code:'INVALID_CONTENT_TYPE',message:'Expected JSON.'}}),{status:415,headers});
    }
    const body=await request.text();
    if (!body || body.length>80000) return new Response(JSON.stringify({ok:false,error:{code:'PAYLOAD_INVALID',message:'Request body too large.'}}),{status:413,headers});
    const parsed=JSON.parse(body);
    if (!parsed.token || !parsed.action) return new Response(JSON.stringify({ok:false,error:{code:'UNAUTHORIZED',message:'Authentication required.'}}),{status:401,headers});
    const ctrl=new AbortController();
    const timeout=setTimeout(()=>ctrl.abort(),27000);
    let upstream;
    try {
      upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body,redirect:'follow',signal:ctrl.signal,cache:'no-store'});
    } finally{clearTimeout(timeout);}
    const raw=await upstream.text();
    if(!upstream.ok){
      return new Response(JSON.stringify({ok:false,error:{code:'UPSTREAM_ERROR',message:'Apps Script returned HTTP '+upstream.status}}),{status:502,headers});
    }
    let payload;
    try {payload=JSON.parse(raw);}catch(_){return new Response(JSON.stringify({ok:false,error:{code:'UPSTREAM_FORMAT',message:'Apps Script did not return JSON. Check deployment access and Apps Script executions.'}}),{status:502,headers});}
    return new Response(JSON.stringify(payload),{status:200,headers});
  } catch (err) {
    return new Response(JSON.stringify({ok:false,error:{code:'PROXY_ERROR',message:err?.name==='AbortError'?'Backend timed out. Retry or check Apps Script execution.':'Failed contacting Apps Script backend.'}}),{status:502,headers});
  }
}
export function GET(){return Response.json({ok:true,service:'CareerOS Vercel API gateway'}, {headers:{'Cache-Control':'no-store'}});}
