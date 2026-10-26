import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm';
const db = createClient('https://yifgptxujimzsjoeghte.supabase.co', 'sb_publishable_TGA26mIiNQ686GJrvQI3aw_PmfP8V1-');
const allowed = 'admin@grupo-zamprest.invalid';
window.zpDb = db;
const gate = document.createElement('div'); gate.className='zp-gate';
gate.innerHTML='<form class="zp-login"><div class="zp-mark">Z.</div><p class="eyebrow">GRUPO ZAMPREST</p><h1>Bem-vindo de volta</h1><p class="subtitle">Entre na central administrativa.</p><label>Usuário<input name="username" autocomplete="username" required></label><label>Senha<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Entrar no painel</button><p class="zp-login-error" role="status"></p></form>';
document.body.append(gate); const form=gate.querySelector('form'), msg=gate.querySelector('.zp-login-error');
function lock(message=''){document.body.classList.add('zp-locked');gate.hidden=false;msg.textContent=message}
async function open(user){if(!user || user.email!==allowed){if(user)await db.auth.signOut();lock(user?'Esta conta não tem acesso ao Grupo Zamprest.':'');return} gate.hidden=true;document.body.classList.remove('zp-locked');window.dispatchEvent(new Event('zp-auth-ready'))}
form.addEventListener('submit',async e=>{e.preventDefault();const btn=form.querySelector('button');btn.disabled=true;msg.textContent='';const username=form.elements.username.value.trim().toLowerCase();if(username!=='admin'){msg.textContent='Usuário ou senha incorretos.';btn.disabled=false;return}const {data,error}=await db.auth.signInWithPassword({email:allowed,password:form.elements.password.value});form.elements.password.value='';btn.disabled=false;if(error){msg.textContent='Usuário ou senha incorretos.';return}await open(data.user)});
const logout=document.createElement('button');logout.className='zp-logout';logout.type='button';logout.textContent='Sair';logout.addEventListener('click',async()=>{await db.auth.signOut();lock()});document.querySelector('.header-right').append(logout);
const {data,error}=await db.auth.getUser();if(error||!data.user)lock();else await open(data.user);
