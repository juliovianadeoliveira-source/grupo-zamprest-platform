// Regras puras para o servidor. Os registros precisam vir de consultas autenticadas ao provedor.
export function conferirPagamento(cobranca, pagamento) {
 if (!cobranca || !pagamento) return {confirmado:false,motivo:'dados_ausentes'};
 if (['provedor','contaProvedorId','pagamentoId'].some(k=>typeof cobranca[k]!=='string'||!cobranca[k].trim()||cobranca[k]!==pagamento[k])) return {confirmado:false,motivo:'conta_ou_cobranca_divergente'};
 if (pagamento.status !== 'approved') return {confirmado:false,motivo:'pagamento_nao_confirmado'};
 if (cobranca.moeda !== 'BRL' || pagamento.moeda !== 'BRL') return {confirmado:false,motivo:'moeda_divergente'};
 if (!Number.isSafeInteger(cobranca.valorCentavos) || cobranca.valorCentavos<=0 || !Number.isSafeInteger(pagamento.valorCentavos) || cobranca.valorCentavos!==pagamento.valorCentavos) return {confirmado:false,motivo:'valor_divergente'};
 return {confirmado:true,motivo:'confirmado_pelo_provedor'};
}

// Um arquivo de comprovante não autentica pagamento nem pode liberar o serviço.
export function comprovanteRecebido() {
 return {confirmado:false,motivo:'aguardando_consulta_ao_provedor'};
}
