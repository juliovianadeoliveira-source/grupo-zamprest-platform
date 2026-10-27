// Uso interno no servidor; não fornece autenticação, armazenamento ou API pública.
function validate({ cents, email, description, idempotencyKey }) {
 if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100000000) throw Error('Valor inválido');
 if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('E-mail inválido');
 if (typeof description !== 'string' || !description.trim() || description.length > 200) throw Error('Descrição inválida');
 if (typeof idempotencyKey !== 'string' || !/^[a-zA-Z0-9_-]{16,64}$/.test(idempotencyKey)) throw Error('Identificador de cobrança inválido');
}
export async function createPix(input, { accessToken, fetchImpl = fetch } = {}) {
 validate(input);
 if (!accessToken || typeof accessToken !== 'string') throw Error('Credencial do Mercado Pago não configurada');
 const response=await fetchImpl('https://api.mercadopago.com/v1/payments',{
  method:'POST',
  headers:{'Authorization':`Bearer ${accessToken}`,'Content-Type':'application/json','X-Idempotency-Key':input.idempotencyKey},
  body:JSON.stringify({transaction_amount:input.cents/100,description:input.description.trim(),payment_method_id:'pix',payer:{email:input.email.trim()}}),
  signal:AbortSignal.timeout(25000)
 });
 if(!response.ok)throw Error(`Mercado Pago não aceitou a solicitação (HTTP ${response.status})`);
 const data=await response.json(),tx=data.point_of_interaction?.transaction_data;
 if(!data.id||typeof tx?.qr_code!=='string'||!tx.qr_code)throw Error('Resposta de cobrança incompleta');
 return {id:String(data.id),status:String(data.status||'pending'),pixCopiaECola:tx.qr_code};
}
