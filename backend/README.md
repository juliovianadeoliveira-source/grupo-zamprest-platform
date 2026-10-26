# Base operacional Grupo Zamprest

API inicial em Python e SQLite, criada para desenvolvimento local. Inclui autenticação por senha, sessão, empresas separadas por conta, clientes com endereço, referência e localização, agenda e ordens de serviço.

O código ainda não está ligado ao painel publicado. Não inclui WhatsApp, IA, pagamentos, edição, exclusão, confirmação de horários, envio de mensagens, acesso de equipe, integrações ou multiempresa com múltiplos membros. Não utilizar em produção sem TLS, armazenamento persistente, controle de tentativas de login, auditoria, testes de segurança e configuração de hospedagem apropriada. SQLite local na Vercel não serve como banco persistente.

Para rodar localmente com Python 3.12+, execute `python server.py --create-admin EMAIL` e informe a senha no terminal, depois `python server.py`. A API escuta apenas em 127.0.0.1. Para produção será necessário adaptar a implantação e a persistência. Execute `python -m unittest -v test_server` para verificar autenticação, isolamento entre contas e fluxo básico.
