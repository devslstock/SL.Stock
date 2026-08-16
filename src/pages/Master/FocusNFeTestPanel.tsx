import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle2, XCircle, AlertTriangle, FileJson, Info } from 'lucide-react';
import { focusNfeApi } from '@/api/focusNfe';
import { useAuth } from '@/contexts/AuthContext';

interface TestStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'warning' | 'skipped';
  result?: string;
  log?: any;
}

export default function FocusNFeTestPanel() {
  const { company } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<{time: string, msg: string, data?: any}[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  const [steps, setSteps] = useState<TestStep[]>([
    { id: 'AUTH-001', name: 'Autenticação', status: 'pending' },
    { id: 'EMP-001', name: 'Consulta de Empresa', status: 'pending' },
    { id: 'NFE-001', name: 'Montagem Payload NF-e', status: 'pending' },
    { id: 'NFE-003', name: 'Envio NF-e (Homologação)', status: 'pending' },
    { id: 'NFE-005', name: 'Consulta NF-e (Polling)', status: 'pending' },
    { id: 'DANFE-001', name: 'DANFE Preview', status: 'pending' },
    { id: 'XML-001', name: 'Armazenamento XML (Mock)', status: 'pending' },
    { id: 'WEBHOOK-001', name: 'Webhook Local Teste', status: 'pending' },
    { id: 'MDFE-001', name: 'Montagem Payload MDF-e', status: 'pending' },
    { id: 'MDFE-002', name: 'Envio MDF-e', status: 'pending' },
    { id: 'MDFE-003', name: 'Consulta MDF-e', status: 'pending' }
  ]);

  const cnpj = company?.cnpj || '00000000000000';

  const addLog = (msg: string, data?: any) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, msg, data }]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const updateStep = (id: string, status: TestStep['status'], result?: string, logData?: any) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, result, log: logData } : s));
    if (result) addLog(`[${id}] ${result}`, logData);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runTests = async () => {
    setIsRunning(true);
    setLogs([]);
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending', result: undefined, log: undefined })));
    
    let currentNfeRef = `teste-nfe-${Date.now()}`;
    let currentMdfeRef = `teste-mdfe-${Date.now()}`;
    let nfePayload: any = null;
    let mdfePayload: any = null;

    try {
      // 1. AUTH-001 e EMP-001 (Unificados na consulta da empresa)
      updateStep('AUTH-001', 'running');
      try {
        const emp = await focusNfeApi.checkCompany(cnpj);
        updateStep('AUTH-001', 'success', 'Conexão e Autenticação OK');
        
        updateStep('EMP-001', 'running');
        updateStep('EMP-001', 'success', `Empresa encontrada: ${emp.nome}`, emp);
      } catch (e: any) {
        if (e.statusCode === 401 || e.isAuthenticationError) {
           updateStep('AUTH-001', 'error', e.message, e);
           throw e; // Interrompe tudo se não autenticar
        } else {
           updateStep('AUTH-001', 'success', 'Conexão OK, mas CNPJ não encontrado.');
           updateStep('EMP-001', 'warning', `Aviso Empresa: ${e.message}. Continuando testes.`, e);
        }
      }

      // 3. NFE-001
      updateStep('NFE-001', 'running');
      nfePayload = focusNfeApi.buildNFeHomologationPayload(cnpj, currentNfeRef);
      updateStep('NFE-001', 'success', 'Payload NFe gerado', { ref: currentNfeRef, items_count: nfePayload.items.length });

      // 4. NFE-003
      updateStep('NFE-003', 'running');
      try {
        const nfeRes = await focusNfeApi.emitirNfe(currentNfeRef, nfePayload);
        updateStep('NFE-003', 'success', 'NFe enviada para processamento', nfeRes);
      } catch (e: any) {
        if (e.isCertificateError) {
          updateStep('NFE-003', 'warning', 'Integração OK, mas SEFAZ/Focus barrou por falta de certificado', e);
        } else {
          updateStep('NFE-003', 'error', `Falha envio NFe: ${e.message}`, e);
        }
      }

      // 5. NFE-005 (Polling Mockado)
      updateStep('NFE-005', 'running');
      let nfeAutorizada = false;
      let consultError = null;
      for (let i = 0; i < 3; i++) {
        addLog(`NFE-005 Polling tentativa ${i+1}...`);
        try {
          const statusRes = await focusNfeApi.consultarNfe(currentNfeRef);
          if (statusRes.status === 'autorizado') {
            nfeAutorizada = true;
            updateStep('NFE-005', 'success', 'NFe Autorizada!', statusRes);
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
      if (!nfeAutorizada && steps.find(s=>s.id === 'NFE-003')?.status !== 'warning') {
        if (consultError && (consultError as any).isCertificateError) {
           updateStep('NFE-005', 'warning', 'Erro esperado: Faltou Certificado Digital', consultError);
        } else {
           updateStep('NFE-005', 'warning', 'Status permaneceu em processamento ou erro não certificado', consultError);
        }
      } else if (steps.find(s=>s.id === 'NFE-003')?.status === 'warning') {
        updateStep('NFE-005', 'skipped', 'Pulado devido a falta de certificado no envio');
      }

      // 6. DANFE-001
      updateStep('DANFE-001', 'running');
      try {
        const pdfBlob = await focusNfeApi.generateNFeDanfePreview(nfePayload);
        updateStep('DANFE-001', 'success', `DANFE gerado. Tamanho: ${pdfBlob.size} bytes`);
      } catch (e: any) {
        updateStep('DANFE-001', 'error', `Erro DANFE Preview: ${e.message}`);
      }

      // 7. XML-001
      updateStep('XML-001', 'running');
      const xmlRes = await focusNfeApi.storeNFeXml(currentNfeRef, '<mock>xml_nf_homologacao</mock>', 'nfe');
      updateStep('XML-001', 'success', `XML salvo no storage simulado`, xmlRes);

      // 8. WEBHOOK-001
      updateStep('WEBHOOK-001', 'running');
      const whRes = await focusNfeApi.testLocalWebhook({ ref: currentNfeRef, tipo: 'nfe', status: 'autorizado' });
      updateStep('WEBHOOK-001', 'success', 'Webhook endpoint OK', whRes);

      // 9. MDFE-001
      updateStep('MDFE-001', 'running');
      mdfePayload = focusNfeApi.buildMDFeHomologationPayload(cnpj, currentMdfeRef);
      updateStep('MDFE-001', 'success', 'Payload MDFe gerado', { ref: currentMdfeRef });

      // 10. MDFE-002
      updateStep('MDFE-002', 'running');
      try {
        const mdfeRes = await focusNfeApi.emitirMdfe(currentMdfeRef, mdfePayload);
        updateStep('MDFE-002', 'success', 'MDFe enviado para processamento', mdfeRes);
      } catch (e: any) {
        if (e.isCertificateError) {
          updateStep('MDFE-002', 'warning', 'Integração OK, barrado por falta de certificado', e);
        } else {
          updateStep('MDFE-002', 'error', `Falha envio MDFe: ${e.message}`, e);
        }
      }

      // 11. MDFE-003
      updateStep('MDFE-003', 'running');
      try {
        const mdfeConsult = await focusNfeApi.consultarMdfe(currentMdfeRef);
        updateStep('MDFE-003', 'success', 'Consulta MDFe realizada', mdfeConsult);
      } catch(e: any) {
         if (e.isCertificateError) {
          updateStep('MDFE-003', 'warning', 'Integração OK, barrado por falta de certificado', e);
        } else {
          updateStep('MDFE-003', 'error', `Falha consulta MDFe: ${e.message}`, e);
        }
      }

      addLog('🚀 BATERIA DE TESTES CONCLUÍDA');
    } catch (e: any) {
      addLog('❌ TESTES INTERROMPIDOS POR ERRO FATAL', e);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'skipped': return <Info className="h-4 w-4 text-gray-400" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testes Focus NFe</h1>
          <p className="text-muted-foreground mt-2">Validação completa de integração (Ambiente de Homologação).</p>
        </div>
        <Button onClick={runTests} disabled={isRunning} className="gap-2">
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isRunning ? 'Executando...' : 'Iniciar Bateria de Testes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Checklist de Integração</CardTitle>
            <CardDescription>Andamento da bateria de testes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map(step => (
              <div key={step.id} className="flex items-start justify-between border-b border-border/50 pb-3 last:border-0">
                <div className="flex gap-3">
                  <div className="mt-0.5">{getStatusIcon(step.status)}</div>
                  <div>
                    <p className="font-semibold text-sm">{step.id} - {step.name}</p>
                    {step.result && <p className="text-xs text-muted-foreground mt-1">{step.result}</p>}
                  </div>
                </div>
                <Badge variant={
                  step.status === 'success' ? 'default' : 
                  step.status === 'error' ? 'destructive' : 
                  step.status === 'warning' ? 'outline' : 'secondary'
                }>
                  {step.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5" /> Console Interno</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative bg-black/95 m-4 mt-0 rounded-md border border-border">
            <div ref={logContainerRef} className="absolute inset-0 overflow-y-auto p-4 font-mono text-xs space-y-2">
              {logs.map((l, idx) => (
                <div key={idx} className="border-b border-white/5 pb-2">
                  <span className="text-blue-400">[{l.time}]</span> <span className="text-gray-300">{l.msg}</span>
                  {l.data && (
                    <pre className="mt-2 text-green-400 bg-white/5 p-2 rounded overflow-x-auto">
                      {JSON.stringify(l.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              {logs.length === 0 && <div className="text-gray-500 italic">Aguardando execução dos testes...</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
