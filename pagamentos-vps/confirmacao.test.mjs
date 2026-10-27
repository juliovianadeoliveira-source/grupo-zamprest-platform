import {test} from 'node:test';
import assert from 'node:assert/strict';
import {conferirPagamento,comprovanteRecebido} from './confirmacao.mjs';
const c={provedor:'mercado_pago',contaProvedorId:'vendedor-a',pagamentoId:'p1',moeda:'BRL',valorCentavos:5000};
const p={...c,status:'approved'};
test('confirma somente cobrança e valor equivalentes do provedor',()=>{assert.equal(conferirPagamento(c,p).confirmado,true);for(const alteration of [{contaProvedorId:'outro'},{pagamentoId:'p2'},{valorCentavos:4999},{moeda:'USD'},{status:'pending'}])assert.equal(conferirPagamento(c,{...p,...alteration}).confirmado,false)});
test('comprovante sozinho não confirma o pagamento',()=>{assert.equal(comprovanteRecebido().confirmado,false)});
