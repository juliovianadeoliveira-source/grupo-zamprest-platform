# Base para futura migração à máquina Ubuntu

Esta pasta prepara serviços Docker separados: PostgreSQL e WuzAPI, cada um com volume persistente. O WuzAPI escuta somente em 127.0.0.1:8080; ele não está público e não está conectado ao Supabase, ao painel ou a contas WhatsApp. A conexão segura entre painel e serviço, quatro sessões, recebimento de mensagens e a publicação HTTPS ainda precisam ser implementadas e testadas.

A preparação não copia dados existentes: o PostgreSQL inicia vazio. O painel atual usa Supabase Auth e tabelas no Supabase; o backend Python local usa SQLite. Portanto, a migração real exige adaptar a aplicação para PostgreSQL, migrar dados e contas com segurança e testar a restauração antes de trocar o acesso. Nunca se deve apagar dados existentes antes da verificação. Login, revendas e recursos de IA ainda não estão concluídos nesta base.

Para instalação futura, instalar Docker Engine e Compose de fontes oficiais, copiar o projeto para a máquina e executar, dentro desta pasta, `python3 init-secrets.py` seguido de `docker compose up -d`. O primeiro comando não substitui credenciais existentes. Guardar a chave de criptografia e as credenciais em local seguro: perdê-las pode impedir recuperação de sessões criptografadas. Fazer backup protegido e testado do banco PostgreSQL e das sessões WuzAPI; não copiar SQLite em execução como se fosse um backup consistente. A instalação e as versões das imagens devem ser verificadas antes de uso.

Nenhuma porta do PostgreSQL é publicada na rede; as conexões são internas ao Docker. Não exponha a API administrativa do WuzAPI diretamente à internet. O projeto não deve receber clientes reais até haver autenticação, isolamento entre empresas, HTTPS e testes completos.
