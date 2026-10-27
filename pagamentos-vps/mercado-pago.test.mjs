import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPix} from './mercado-pago.mjs';
const input={cents:1234,email:'teste@example.com',description:'Mensalidade',idempotencyKey:'abcdefghijklmnop'};
test('envia valor e idempotência ao provedor e retorna o código',async()=>{let request;const out=await createPix(input,{accessToken:'fake',fetchImpl:async(url,options)=>{request={url,options};return {ok:true,json:async()=>({id:42,status:'pending',point_of_interaction:{transaction_data:{qr_code:'pix-teste'}}})}}});assert.equal(JSON.parse(request.options.body).transaction_amount,12.34);assert.equal(request.options.headers['X-Idempotency-Key'],input.idempotencyKey);assert.equal(out.pixCopiaECola,'pix-teste')});
test('rejeita valor e não revela conteúdo do erro',async()=>{await assert.rejects(createPix({...input,cents:-1},{accessToken:'fake'}),/Valor inválido/);await assert.rejects(createPix(input,{accessToken:'fake',fetchImpl:async()=>({ok:false,status:401})}),/HTTP 401/)});
