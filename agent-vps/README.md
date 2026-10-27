# Base da IA para a VPS

Este módulo é uma peça de servidor, preparada para um único provedor de IA. Não conecta WhatsApp, não expõe uma API e não executa ações. Não responde clientes sozinho.

O futuro servidor deve autenticar o usuário ou validar o webhook, identificar a empresa no servidor, carregar somente seus dados e histórico autorizado, verificar se o bot está ativado, e chamar `respond` de `agent.mjs`. Nunca aceite dados de empresa ou instruções de configuração enviados diretamente pelo cliente sem autorização. O serviço de WhatsApp, histórico, controle de duplicação e isolamento por empresa ainda precisam ser implementados e testados.

Passe a chave de API por variável de ambiente protegida no servidor (`OPENAI_API_KEY`), e escolha um modelo disponível na conta (`OPENAI_MODEL`). Não inclua chave no GitHub, navegador ou logs. A API pode gerar cobranças. A chave e o modelo não estão configurados aqui. Nenhum serviço pago foi criado.

Exemplo para uso interno pelo servidor (não executar sem uma integração autorizada):

```js
import { respond } from './agent.mjs';
const resposta = await respond({ company, agent, messages }, {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL
});
```

Teste local sem acesso a serviço externo: `node --test agent-vps/agent.test.mjs` (Node 20 ou superior). O teste usa um provedor simulado; não comprova uma conexão real.

A migração do banco, autenticação e dados do Supabase para PostgreSQL da VPS, e o serviço persistente de WhatsApp, ainda não estão concluídos.
