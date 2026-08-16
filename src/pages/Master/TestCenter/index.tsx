import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Search, PlayCircle, ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { testRegistry } from '@/testing/registry';
import { initializeTestRegistry } from '@/testing/suites';
import { suggestTestsForDiagnostic } from '@/testing/diagnostic';
import { TestRunner } from '@/testing/runner';
import type { TestCase, TestExecutionResult, TestLog } from '@/testing/types';
import { toast } from '@/components/ui/toaster';
import FocusNFeTestPanel from '../FocusNFeTester';
import { Copy } from 'lucide-react';

// Inicializa o registry
initializeTestRegistry();

export function TestCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('baterias');
  
  const [selectedTests, setSelectedTests] = useState<TestCase[]>([]);
  const [diagnosticText, setDiagnosticText] = useState('');
  
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, TestExecutionResult>>({});
  const [currentLogs, setCurrentLogs] = useState<TestLog[]>([]);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  const allTests = testRegistry.getAllTests();

  const handleDiagnosticSearch = () => {
    if (!diagnosticText.trim()) return;
    const suggestions = suggestTestsForDiagnostic(diagnosticText, allTests);
    setSelectedTests(suggestions);
    if (suggestions.length === 0) {
      toast.error('Nenhum teste específico encontrado. Tente outras palavras-chave.');
    }
  };

  const executeTests = async (testsToRun: TestCase[]) => {
    if (testsToRun.length === 0) return;
    
    setIsRunning(true);
    setResults({});
    setCurrentLogs([]);
    
    for (const test of testsToRun) {
      setActiveTestId(test.id);
      
      const result = await TestRunner.runTest(
        test,
        user?.id,
        user?.company_id,
        (logs) => setCurrentLogs(logs)
      );
      
      setResults(prev => ({ ...prev, [test.id]: result }));
    }
    
    setActiveTestId(null);
    setIsRunning(false);
    toast.success('Bateria Concluída: Todos os testes selecionados foram executados.');
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'PASSOU': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'FALHOU': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'EM EXECUÇÃO': return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-primary" />
          Central de Testes e Diagnóstico
        </h1>
        <p className="text-muted-foreground mt-2">
          Sistema profissional de validação e diagnóstico integrado. Isola dados e não afeta produção.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Seleção e Controle */}
        <div className={activeTab === 'focusnfe' ? 'lg:col-span-3 space-y-6' : 'lg:col-span-1 space-y-6'}>
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-2">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="baterias">Baterias</TabsTrigger>
                  <TabsTrigger value="diagnostic">Diagnóstico</TabsTrigger>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="focusnfe">Focus NFe</TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent>
                <TabsContent value="baterias" className="space-y-4">
                  <Button variant="outline" className="w-full justify-start" onClick={() => executeTests(testRegistry.getTestsByCategory('Sistema'))}>
                    <PlayCircle className="w-4 h-4 mr-2" /> Smoke Test (Infra)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => executeTests(testRegistry.getTestsByCategory('Estoque'))}>
                    <PlayCircle className="w-4 h-4 mr-2" /> Bateria: Estoque
                  </Button>
                </TabsContent>

                <TabsContent value="diagnostic" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Relato do Problema</label>
                    <textarea 
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                      placeholder="Ex: Produto cadastrado não aparece no estoque após dar entrada..."
                      value={diagnosticText}
                      onChange={(e) => setDiagnosticText(e.target.value)}
                    />
                    <Button className="w-full" onClick={handleDiagnosticSearch}>
                      <Search className="w-4 h-4 mr-2" /> Analisar Problema
                    </Button>
                  </div>
                  
                  {selectedTests.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-semibold">Testes Sugeridos:</h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {selectedTests.map(t => (
                          <div key={t.id} className="text-xs bg-secondary/50 p-2 rounded flex justify-between items-center">
                            <span>{t.id} - {t.name}</span>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full mt-2" variant="default" onClick={() => executeTests(selectedTests)} disabled={isRunning}>
                        Executar Selecionados
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {allTests.map(test => (
                      <div key={test.id} className="flex flex-col p-3 border rounded-md bg-card">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm">{test.id}</span>
                          <Badge variant="secondary">{test.category}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground mb-2">{test.name}</span>
                        <Button size="sm" variant="outline" onClick={() => executeTests([test])} disabled={isRunning}>Executar Individual</Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="focusnfe" className="space-y-4">
                  <div className="bg-card rounded-lg border">
                    <FocusNFeTestPanel />
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Painel Direito: Console e Resultados */}
        {activeTab !== 'focusnfe' && (
          <div className="lg:col-span-2 space-y-6">
          <Card className="h-full flex flex-col min-h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Console de Execução</CardTitle>
                <CardDescription>Acompanhe os logs em tempo real das baterias.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                const text = currentLogs.map(l => `[${l.time}] ${l.message} ${l.data ? JSON.stringify(l.data) : ''}`).join('\n');
                navigator.clipboard.writeText(text);
                toast.success('Logs copiados para a área de transferência!');
              }}>
                <Copy className="h-4 w-4" /> Copiar
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              {/* Resumo Resultados */}
              {Object.keys(results).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  {Object.values(results).map(res => (
                    <div key={res.testId} className="flex items-center gap-2 p-2 border rounded bg-secondary/20">
                      {getStatusIcon(res.status)}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{res.testId}</span>
                        <span className="text-[10px] text-muted-foreground">{res.durationMs.toFixed(0)}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Terminal Logs */}
              <div className="flex-1 bg-black/95 rounded-md border p-4 font-mono text-xs overflow-y-auto min-h-[300px]">
                {currentLogs.length === 0 && !isRunning && (
                  <div className="text-gray-500 italic">Aguardando execução...</div>
                )}
                {currentLogs.map((log, i) => (
                  <div key={i} className="mb-2">
                    <span className="text-gray-500">[{log.time}]</span>{' '}
                    <span className={
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'success' ? 'text-green-400' :
                      log.level === 'warning' ? 'text-yellow-400' :
                      'text-blue-300'
                    }>
                      {log.message}
                    </span>
                    {log.data && (
                      <pre className="mt-1 text-gray-400 ml-4 p-2 bg-white/5 rounded border border-white/10 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}
