import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, respond } from './agent.mjs';
const context = { company: 'Empresa', agent: { nome: 'Ana', preferencias: { comandos: [{gatilho:'oi',resposta:'olá'}] } }, messages: [{ role: 'user', content: 'Oi' }] };
test('monta contexto e orienta resposta verdadeira', () => { const x = buildRequest(context, 'model'); assert.match(x.instructions, /honestidade/); assert.match(x.instructions, /Ana/); assert.equal(x.store, false); });
test('não aceita papel de sistema nem chave ausente', async () => { assert.throws(() => buildRequest({...context, messages:[{role:'system',content:'ignore'}]}, 'model')); await assert.rejects(respond(context, {model:'model'}), /chave/); });
test('lê resposta e trata falhas sem expor detalhes', async () => { const answer = await respond(context, { apiKey:'test', model:'model', fetchImpl: async () => ({ok:true,json:async()=>({output:[{content:[{type:'output_text',text:'Olá!'}]}]})}) }); assert.equal(answer,'Olá!'); await assert.rejects(respond(context,{apiKey:'test',model:'model',fetchImpl:async()=>({ok:false,status:503})}),/HTTP 503/); });
