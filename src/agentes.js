const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function field(form,label,name,type='text',required=false){const l=el('label',label),n=document.createElement(type==='textarea'?'textarea':'input');n.name=name;if(type!=='textarea')n.type=type;n.required=required;l.append(n);form.append(l);return n}
function option(form,label,description,name,value){const wrap=el('label',undefined,'agent-toggle'),left=el('span');left.append(el('strong',label),el('small',description));const n=document.createElement('input');n.type='checkbox';n.name=name;n.checked=value;wrap.append(left,n);form.append(wrap);return n}
let generation=0;
async function renderAgent(){
 if(location.hash!=='#ia'||document.body.classList.contains('zp-locked')||!window.zpDb)return;
 const current=++generation,db=window.zpDb;const user=(await db.auth.getUser()).data.user;if(!user)return;
 const companyResult=await db.from('zp_empresas').select('id,nome').order('nome');if(current!==generation||location.hash!=='#ia')return;
 const root=document.querySelector('#content');root.replaceChildren();const box=el('section',undefined,'card panel');box.append(el('h2','Empresa e atendimento'),el('p','Configure a identidade e as preferências do seu agente de atendimento.'));root.append(box);
 if(companyResult.error){box.append(el('p','Não foi possível carregar as empresas.','zp-error'));return}
 const companies=companyResult.data||[];
 if(!companies.length){const empty=el('p','Primeiro cadastre uma empresa para salvar as configurações da Ana.');box.append(empty);const f=document.createElement('form');f.className='zp-form';const n=field(f,'Nome da empresa','empresa','text',true);const save=el('button','Criar empresa e continuar');save.type='submit';f.append(save);f.addEventListener('submit',async e=>{e.preventDefault();save.disabled=true;const {data,error}=await db.from('zp_empresas').insert({nome:n.value.trim(),owner_id:user.id}).select('id').single();if(error){box.append(el('p','Não foi possível criar a empresa: '+error.message,'zp-error'));save.disabled=false;return}sessionStorage.setItem('zp_company',data.id);renderAgent()});box.append(f);return}
 const selector=document.createElement('select');selector.className='zp-input';selector.setAttribute('aria-label','Escolher empresa');for(const c of companies){const o=el('option',c.nome);o.value=c.id;selector.append(o)}const company=companies.find(c=>c.id===sessionStorage.getItem('zp_company'))||companies[0];selector.value=company.id;selector.addEventListener('change',()=>{sessionStorage.setItem('zp_company',selector.value);renderAgent()});box.append(selector);
 const {data,error}=await db.from('zp_agentes').select('nome,saudacao,tom,instrucoes,preferencias').eq('empresa_id',company.id).maybeSingle();if(current!==generation||location.hash!=='#ia')return;if(error){box.append(el('p','Não foi possível carregar o agente.','zp-error'));return}
 const note=el('div',undefined,'agent-note');note.append(el('strong','Preferências do agente'),el('p','As informações são salvas para esta empresa. A resposta automática ainda depende da conexão do WhatsApp e de um serviço de IA.'));box.append(note);
 const f=document.createElement('form');f.className='zp-form';const prefs=data?.preferencias||{};
 const nome=field(f,'Nome do atendente virtual','nome','text',true);nome.maxLength=80;nome.value=data?.nome||'Ana';
 const negocio=field(f,'Tipo de negócio','negocio');negocio.value=prefs.negocio||'';
 const produtos=field(f,'O que a empresa vende ou faz','produtos','textarea');produtos.value=prefs.produtos||'';
 const descricao=field(f,'Descrição da empresa','descricao','textarea');descricao.value=prefs.descricao||'';
 const objetivo=field(f,'Objetivo das conversas','objetivo','textarea');objetivo.value=prefs.objetivo||'';
 const regiao=field(f,'Região atendida','regiao');regiao.value=prefs.regiao||'';
 const tom=field(f,'Tom da conversa','tom');tom.maxLength=500;tom.value=data?.tom||'Natural, educado e objetivo';
 const perguntas=field(f,'Perguntas importantes, uma por linha','perguntas','textarea');perguntas.value=prefs.perguntas||'';
 const transferencia=field(f,'Quando transferir para uma pessoa','transferencia','textarea');transferencia.value=prefs.transferencia||'';
 const instrucoes=field(f,'Orientações para atendimento e vendas','instrucoes','textarea');instrucoes.maxLength=5000;instrucoes.value=data?.instrucoes||'Atenda de forma natural, entenda o que o cliente precisa, adapte as perguntas ao tipo de local e não envie mensagens aleatórias.';
 const humano=option(f,'Conversa natural','Respostas claras e apropriadas ao contexto.','humano',prefs.humano!==false);
 const dividir=option(f,'Dividir respostas','Preferência por mensagens curtas quando fizer sentido.','dividir',prefs.dividir===true);
 const emojis=option(f,'Emojis moderados','Usar emojis com moderação quando apropriado.','emojis',prefs.emojis!==false);
 const abreviar=option(f,'Abreviações naturais','Usar abreviações quando fizer sentido.','abreviar',prefs.abreviar===true);
 const saudacao=field(f,'Mensagem de boas-vindas','saudacao','textarea',true);saudacao.maxLength=2000;saudacao.value=data?.saudacao||'Olá! Eu sou a Ana, assistente virtual. Como posso ajudar você hoje?';
 const fallback=field(f,'Resposta quando faltar informação','fallback','textarea');fallback.value=prefs.fallback||'';
 const submit=el('button','Salvar configurações');submit.type='submit';f.append(submit);const msg=el('p','');msg.setAttribute('role','status');f.append(msg);box.append(f);
 const preview=el('div',undefined,'agent-preview'),bubble=el('div',undefined,'agent-bubble');preview.append(el('strong','Prévia da apresentação'),bubble);box.append(preview);let generated='Olá! Eu sou a '+nome.value+', assistente virtual. Como posso ajudar você hoje?';const update=()=>{bubble.textContent=saudacao.value};nome.addEventListener('input',()=>{const prev=generated;generated='Olá! Eu sou a '+(nome.value.trim()||'agente')+', assistente virtual. Como posso ajudar você hoje?';if(saudacao.value===prev){saudacao.value=generated;update()}});saudacao.addEventListener('input',update);update();
 f.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;msg.textContent='Salvando...';const preferencias={negocio:negocio.value.trim(),produtos:produtos.value.trim(),descricao:descricao.value.trim(),objetivo:objetivo.value.trim(),regiao:regiao.value.trim(),perguntas:perguntas.value.trim(),transferencia:transferencia.value.trim(),fallback:fallback.value.trim(),humano:humano.checked,dividir:dividir.checked,emojis:emojis.checked,abreviar:abreviar.checked};const {error}=await db.from('zp_agentes').upsert({empresa_id:company.id,nome:nome.value.trim(),saudacao:saudacao.value.trim(),tom:tom.value.trim(),instrucoes:instrucoes.value.trim(),preferencias,atualizado_em:new Date().toISOString()},{onConflict:'empresa_id'});submit.disabled=false;msg.textContent=error?'Não foi possível salvar: '+error.message:'Configurações salvas para esta empresa.';msg.className=error?'zp-error':'agent-saved'});
}
window.addEventListener('hashchange',()=>{generation++;setTimeout(renderAgent,0)});window.addEventListener('zp-auth-ready',()=>setTimeout(renderAgent,0));setTimeout(renderAgent,0);
