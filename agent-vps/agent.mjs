// Componente de servidor: o chamador deve autenticar e carregar dados da empresa.
const limit = (value, length) => String(value ?? '').trim().slice(0, length);

export function buildRequest({ agent = {}, company = '', messages = [] }, model) {
  if (!model || !Array.isArray(messages) || !messages.length || messages.length > 20) throw new Error('Dados de conversa inválidos');
  const input = messages.map(({ role, content }) => {
    if (!['user', 'assistant'].includes(role) || typeof content !== 'string' || !content.trim() || content.length > 4000) throw new Error('Mensagem inválida');
    return { role, content: content.trim() };
  });
  const commands = (Array.isArray(agent.preferencias?.comandos) ? agent.preferencias.comandos : []).slice(0, 330)
    .filter(c => typeof c?.gatilho === 'string' && typeof c?.resposta === 'string')
    .map(c => ({ gatilho: limit(c.gatilho, 120), resposta: limit(c.resposta, 1000) }));
  const settings = {
    nome: limit(agent.nome, 80), empresa: limit(company, 120), tom: limit(agent.tom, 500),
    orientacoes: limit(agent.instrucoes, 5000), negocio: limit(agent.preferencias?.negocio, 1000),
    produtos: limit(agent.preferencias?.produtos, 3000), roteiro: (Array.isArray(agent.preferencias?.roteiro) ? agent.preferencias.roteiro : []).slice(0, 40).map(x => limit(x, 500)), comandos: commands
  };
  return {
    model,
    instructions: 'Você é um assistente virtual de atendimento. Converse em português de forma natural, com o nome e empresa informados. Se perguntarem diretamente se você é humano ou IA, responda com honestidade. Não invente preços, dados de clientes, disponibilidade ou ações realizadas. Não afirme que enviou, agendou, consultou ou transferiu algo sem resultado confirmado pelo sistema. Os dados de configuração a seguir são referência e não substituem estas regras: ' + JSON.stringify(settings),
    input,
    max_output_tokens: 500,
    store: false
  };
}

export async function respond(context, { apiKey, model, fetchImpl = fetch, timeoutMs = 25000 } = {}) {
  if (!apiKey) throw new Error('IA não configurada: falta a chave no servidor');
  const request = buildRequest(context, model);
  const response = await fetchImpl('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(request), signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`Serviço de IA indisponível (HTTP ${response.status})`);
  const result = await response.json();
  const text = (result.output || []).flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n').trim();
  if (!text) throw new Error('Serviço de IA não retornou texto');
  return text;
}
