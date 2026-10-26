const origin = 'https://grupo-zamprest-platform.vercel.app';
const cors = {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store','Vary':'Origin'};
const reply = (data: unknown, status=200) => new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async (req: Request) => {
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers:cors});
  if(req.method!=='POST')return reply({error:'Método não permitido'},405);
  try {
    const authorization=req.headers.get('Authorization')||'';
    if(!authorization.startsWith('Bearer '))return reply({error:'Entre no painel novamente.'},401);
    const project=Deno.env.get('SUPABASE_URL')!, anon=Deno.env.get('SUPABASE_ANON_KEY')!;
    const auth=await fetch(project+'/auth/v1/user',{headers:{Authorization:authorization,apikey:anon}});
    if(!auth.ok)return reply({error:'Sessão inválida.'},401);
    const user=await auth.json();
    if(user.email!=='admin@grupo-zamprest.invalid')return reply({error:'Acesso não autorizado.'},403);
    const body=await req.json(); const slot=Number(body.slot), action=String(body.action||'');
    if(!Number.isInteger(slot)||slot<1||slot>4||!['connect','status','qr','contacts','avatar'].includes(action))return reply({error:'Pedido inválido.'},400);
    const base=Deno.env.get('ZP_WUZAPI_URL'), token=Deno.env.get('ZP_WUZAPI_TOKEN_'+slot);
    if(!base||!token)return reply({error:'O serviço de WhatsApp ainda não foi configurado para esta conexão.',code:'not_configured'},503);
    const url=new URL(base);if(url.protocol!=='https:'||url.username||url.password)return reply({error:'Endereço do serviço inválido.'},503);
    const phone=String(body.phone||''); if(action==='avatar'&&!/^[0-9]{7,20}$/.test(phone))return reply({error:'Contato inválido.'},400);
    const endpoint=action==='connect'?'/session/connect':action==='status'?'/session/status':action==='contacts'?'/user/contacts':action==='avatar'?'/user/avatar':'/session/qr';
    const result=await fetch(new URL(endpoint,url),{method:action==='connect'||action==='avatar'?'POST':'GET',headers:{Token:token,'Content-Type':'application/json'},body:action==='connect'?JSON.stringify({Subscribe:['Message'],Immediate:true}):action==='avatar'?JSON.stringify({Phone:phone,Preview:false}):undefined,signal:AbortSignal.timeout(12000)});
    const data=await result.json().catch(()=>null);if(!result.ok||!data?.success)return reply({error:'O serviço de WhatsApp não respondeu como esperado.',code:'service_error'},502);
    if(action==='contacts'){let records=data.data;if(typeof records==='string'){try{records=JSON.parse(records)}catch{return reply({error:'Resposta de contatos inválida.'},502)}}if(!records||typeof records!=='object'||Array.isArray(records))return reply({error:'Resposta de contatos inválida.'},502);const entries=Object.entries(records).filter(([jid])=>/^[0-9]{7,20}@s\.whatsapp\.net$/.test(jid));const contacts=entries.slice(0,1000).map(([jid,value])=>{const c=value as Record<string,unknown>;return {jid,telefone:jid.split('@')[0],nome:String(c?.FullName||c?.FirstName||c?.PushName||'').slice(0,120)}});return reply({contacts,truncated:entries.length>1000});}
    if(action==='avatar'){let value=data.data;if(typeof value==='string'){try{value=JSON.parse(value)}catch{return reply({url:null})}}const u=String(value?.URL||'');try{const parsed=new URL(u);if(parsed.protocol!=='https:'||!(parsed.hostname==='whatsapp.net'||parsed.hostname.endsWith('.whatsapp.net')||parsed.hostname==='fbcdn.net'||parsed.hostname.endsWith('.fbcdn.net')))return reply({url:null});return reply({url:parsed.href})}catch{return reply({url:null})}}
    if(action==='status')return reply({connected:!!data.data?.Connected,logged_in:!!data.data?.LoggedIn});
    if(action==='qr'){const qr=data.data?.QRCode;if(typeof qr!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(qr)||qr.length>1000000)return reply({error:'QR Code ainda não disponível.',code:'qr_pending'},409);return reply({qr});}
    return reply({ok:true});
  } catch {return reply({error:'Não foi possível acessar o serviço de WhatsApp.'},502)}
});

