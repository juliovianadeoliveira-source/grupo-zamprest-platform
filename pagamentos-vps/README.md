# Preparação: Pix pelo Mercado Pago

Este código é apenas um componente de servidor. Não está ligado ao painel, não oferece conexão de contas e não deve ser exposto diretamente para usuários. Não cria cobranças sem ser chamado por um servidor com credencial.

Antes de uso real: implementar autenticação e autorização por empresa; conexão segura individual da conta do provedor; armazenamento protegido de credenciais; cadastro de cobrança com chave de idempotência persistente e exclusiva por empresa e operação; recuperação de estados incertos; verificação de notificações e consulta ao provedor antes de confirmar pagamento; testes em ambiente de teste e revisão de dados e reconciliação. Não usar o estado retornado pelo navegador para marcar pagamento como confirmado. Não registrar credenciais ou dados Pix em logs.

Executar testes locais simulados com Node 20+: `node --test pagamentos-vps/mercado-pago.test.mjs`. Os testes simulam a API e não comprovam integração com o Mercado Pago. Cada cliente precisará conectar sua própria conta. PagBank e outras instituições ainda não possuem implementação neste projeto.

Referência: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-payments/integration-configuration/integrate-pix
