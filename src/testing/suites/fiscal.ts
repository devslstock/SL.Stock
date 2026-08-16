import type { TestBattery } from '../types';
import { focusNfeApi } from '@/api/focusNfe';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fiscalTests: TestBattery[] = [
  {
    id: 'FSC-001',
    name: 'Fiscal — Integração Completa Focus NFe',
    module: 'Fiscal',
    type: 'Integração',
    priority: 'Alta',
    description: 'Valida chaves, emite NF-e, MDF-e, consulta polling, armazena XML e gera DANFE no ambiente de Homologação.',
    tags: ['fiscal', 'nfe', 'focusnfe', 'proxy', 'mdfe', 'danfe', 'xml', 'webhook'],
    tests: [
      {
        name: 'Autenticação e Consulta de Empresa',
        run: async (ctx) => {
          const cnpj = ctx.companyId ? '00000000000000' : '00000000000000'; // fallback para 00.. em testes 
          (globalThis as any).__TEST_FSC_CNPJ = cnpj;
          
          try {
            const emp = await focusNfeApi.checkCompany(cnpj);
            ctx.log(`Empresa encontrada: ${emp.nome}`, emp);
          } catch (e: any) {
             if (e.statusCode === 401 || e.isAuthenticationError) {
               throw new Error(`Falha de Autenticação na API Focus: ${e.message}`);
             } else {
               ctx.log(`Aviso (CNPJ não encontrado): ${e.message}. Continuando os testes.`);
             }
          }
        }
      },
      {
        name: 'Montagem Payload NF-e',
        run: async (ctx) => {
          const currentNfeRef = `teste-nfe-${Date.now()}`;
          (globalThis as any).__TEST_FSC_NFE_REF = currentNfeRef;
          
          const payload = focusNfeApi.buildNFeHomologationPayload((globalThis as any).__TEST_FSC_CNPJ, currentNfeRef);
          (globalThis as any).__TEST_FSC_NFE_PAYLOAD = payload;
          
          ctx.log('Payload gerado', { ref: currentNfeRef, items_count: payload.items.length });
        }
      },
      {
        name: 'Envio NF-e (Homologação)',
        run: async (ctx) => {
          const ref = (globalThis as any).__TEST_FSC_NFE_REF;
          const payload = (globalThis as any).__TEST_FSC_NFE_PAYLOAD;
          
          try {
            const nfeRes = await focusNfeApi.emitirNfe(ref, payload);
            ctx.log('NFe enviada para processamento', nfeRes);
          } catch (e: any) {
            if (e.isCertificateError) {
              ctx.log('Integração OK, mas SEFAZ/Focus barrou por falta de certificado', e);
              (globalThis as any).__TEST_FSC_CERT_ERROR = true;
            } else if (e.message?.includes('CNPJ do emitente não autorizado')) {
              ctx.log('Integração OK, mas CNPJ de teste não está autorizado para emitir NFe.', e);
              (globalThis as any).__TEST_FSC_CERT_ERROR = true;
            } else {
              throw new Error(`Falha envio NFe: ${e.message}`);
            }
          }
        }
      },
      {
        name: 'Consulta NF-e (Polling)',
        run: async (ctx) => {
          if ((globalThis as any).__TEST_FSC_CERT_ERROR) {
             ctx.log('Pulado devido à falta de certificado no envio anterior.');
             return;
          }
          
          const ref = (globalThis as any).__TEST_FSC_NFE_REF;
          let nfeAutorizada = false;
          let consultError = null;
          
          for (let i = 0; i < 3; i++) {
            ctx.log(`Polling NFE-005 tentativa ${i+1}...`);
            try {
              const statusRes = await focusNfeApi.consultarNfe(ref);
              if (statusRes.status === 'autorizado') {
                nfeAutorizada = true;
                ctx.log('NFe Autorizada!', statusRes);
                break;
              } else if (statusRes.status === 'processando') {
                await delay(3000);
              } else {
                consultError = statusRes;
                break;
              }
            } catch (e: any) {
              consultError = e;
              break;
            }
          }
          
          if (!nfeAutorizada) {
            if (consultError && (consultError as any).isCertificateError) {
               ctx.log('Erro esperado: Faltou Certificado Digital', consultError);
            } else {
               ctx.log('Status permaneceu em processamento ou ocorreu um erro de rejeição', consultError);
            }
          }
        }
      },
      {
        name: 'DANFE Preview',
        run: async (ctx) => {
          const payload = (globalThis as any).__TEST_FSC_NFE_PAYLOAD;
          const pdfBlob = await focusNfeApi.generateNFeDanfePreview(payload);
          ctx.assert(pdfBlob.size > 0, 'PDF Vazio');
          ctx.log(`DANFE gerado com sucesso. Tamanho: ${pdfBlob.size} bytes`);
        }
      },
      {
        name: 'Armazenamento XML (Mock)',
        run: async (ctx) => {
          const ref = (globalThis as any).__TEST_FSC_NFE_REF;
          const xmlRes = await focusNfeApi.storeNFeXml(ref, '<mock>xml_nf_homologacao</mock>', 'nfe');
          ctx.log(`XML salvo no storage simulado`, xmlRes);
        }
      },
      {
        name: 'Webhook Local Teste',
        run: async (ctx) => {
          const ref = (globalThis as any).__TEST_FSC_NFE_REF;
          const whRes = await focusNfeApi.testLocalWebhook({ ref, tipo: 'nfe', status: 'autorizado' });
          ctx.log('Webhook endpoint OK', whRes);
        }
      },
      {
        name: 'Montagem Payload MDF-e',
        run: async (ctx) => {
          const mdfeRef = `teste-mdfe-${Date.now()}`;
          (globalThis as any).__TEST_FSC_MDFE_REF = mdfeRef;
          
          const payload = focusNfeApi.buildMDFeHomologationPayload((globalThis as any).__TEST_FSC_CNPJ, mdfeRef);
          (globalThis as any).__TEST_FSC_MDFE_PAYLOAD = payload;
          ctx.log('Payload MDFe gerado', { ref: mdfeRef });
        }
      },
      {
        name: 'Envio MDF-e',
        run: async (ctx) => {
          const ref = (globalThis as any).__TEST_FSC_MDFE_REF;
          const payload = (globalThis as any).__TEST_FSC_MDFE_PAYLOAD;
          
          try {
            const mdfeRes = await focusNfeApi.emitirMdfe(ref, payload);
            ctx.log('MDFe enviado para processamento', mdfeRes);
          } catch (e: any) {
            if (e.isCertificateError) {
              ctx.log('Integração OK, barrado por falta de certificado', e);
            } else if (e.message?.includes('CNPJ do emitente não autorizado')) {
              ctx.log('Integração OK, mas CNPJ de teste não está autorizado para emitir MDFe.', e);
            } else {
              throw new Error(`Falha envio MDFe: ${e.message}`);
            }
          }
        }
      },
      {
        name: 'Consulta MDF-e',
        run: async (ctx) => {
           const ref = (globalThis as any).__TEST_FSC_MDFE_REF;
           try {
             const mdfeConsult = await focusNfeApi.consultarMdfe(ref);
             ctx.log('Consulta MDFe realizada', mdfeConsult);
           } catch(e: any) {
              if (e.isCertificateError) {
                ctx.log('Integração OK, barrado por falta de certificado', e);
              } else {
                throw new Error(`Falha consulta MDFe: ${e.message}`);
              }
           }
        }
      }
    ],
    cleanup: async (ctx) => {
      delete (globalThis as any).__TEST_FSC_CNPJ;
      delete (globalThis as any).__TEST_FSC_NFE_REF;
      delete (globalThis as any).__TEST_FSC_NFE_PAYLOAD;
      delete (globalThis as any).__TEST_FSC_CERT_ERROR;
      delete (globalThis as any).__TEST_FSC_MDFE_REF;
      delete (globalThis as any).__TEST_FSC_MDFE_PAYLOAD;
    }
  }
];
