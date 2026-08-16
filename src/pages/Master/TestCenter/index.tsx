import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Search, PlayCircle, ShieldAlert, CheckCircle2, XCircle, Clock, Copy, ListFilter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { testRegistry } from '@/testing/registry';
import { initializeTestRegistry } from '@/testing/suites';
import { suggestTestsForDiagnostic } from '@/testing/diagnostic';
import { TestRunner } from '@/testing/runner';
import type { TestBattery, TestExecutionResult, TestLog } from '@/testing/types';
import { toast } from '@/components/ui/toaster';
import { CATEGORIES } from '@/testing/catalog';

// Inicializa o registry
initializeTestRegistry();

export function TestCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('modulos');
  
  const [selectedBatteries, setSelectedBatteries] = useState<TestBattery[]>([]);
  const [diagnosticText, setDiagnosticText] = useState('');
  
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, TestExecutionResult>>({});
  const [currentLogs, setCurrentLogs] = useState<TestLog[]>([]);
  const [activeBatteryId, setActiveBatteryId] = useState<string | null>(null);

  // Filters for complete list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('Todos');

  const allBatteries = testRegistry.getAllBatteries();

  const handleDiagnosticSearch = () => {
    if (!diagnosticText.trim()) return;
    const suggestions = suggestTestsForDiagnostic(diagnosticText, allBatteries as any); // Adaptado no futuro
    setSelectedBatteries(suggestions as any);
    if (suggestions.length === 0) {
      toast.error('Nenhum teste específico encontrado para o relato.');
    }
  };

  const executeBatteries = async (batteriesToRun: TestBattery[]) => {
    if (batteriesToRun.length === 0) return;
    
    setIsRunning(true);
    setResults({});
    setCurrentLogs([]);
    
    for (const battery of batteriesToRun) {
      setActiveBatteryId(battery.id);
      
      const result = await TestRunner.runBattery(
        battery,
        user?.id,
        user?.company_id,
        (logs) => setCurrentLogs(logs)
      );
      
      setResults(prev => ({ ...prev, [battery.id]: result }));
    }
    
    setActiveBatteryId(null);
    setIsRunning(false);
    toast.success('Bateria Concluída: Todas as baterias selecionadas foram executadas.');
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'PASSOU': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'FALHOU': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'EM EXECUÇÃO': return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredBatteries = allBatteries.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchModule = filterModule === 'Todos' || b.module === filterModule;
    return matchSearch && matchModule;
  });

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-primary" />
          Central de Testes e Diagnóstico
        </h1>
        <p className="text-muted-foreground mt-2">
          Sistema profissional de validação de Qualidade (QA). {allBatteries.length} baterias disponíveis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Seleção e Controle */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-2">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="modulos">Módulos</TabsTrigger>
                  <TabsTrigger value="diagnostic">Diagnóstico</TabsTrigger>
                  <TabsTrigger value="all">Catálogo</TabsTrigger>
                  <TabsTrigger value="audit">Auditoria</TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent>
                <TabsContent value="modulos" className="space-y-4">
                  <div className="space-y-2">
                    {CATEGORIES.map(cat => {
                      const batteriesInModule = testRegistry.getBatteriesByModule(cat);
                      if (batteriesInModule.length === 0) return null;
                      return (
                        <div key={cat} className="p-3 border rounded bg-card/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm">{cat}</span>
                            <Badge variant="secondary">{batteriesInModule.length} baterias</Badge>
                          </div>
                          <Button size="sm" variant="outline" className="w-full" onClick={() => executeBatteries(batteriesInModule)} disabled={isRunning}>
                            <PlayCircle className="w-4 h-4 mr-2" /> Rodar Baterias do Módulo
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="diagnostic" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Relato do Problema do Cliente</label>
                    <textarea 
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground min-h-[100px]"
                      placeholder="Ex: Produto cadastrado não aparece no estoque após dar entrada..."
                      value={diagnosticText}
                      onChange={(e) => setDiagnosticText(e.target.value)}
                    />
                    <Button className="w-full" onClick={handleDiagnosticSearch}>
                      <Search className="w-4 h-4 mr-2" /> Analisar Problema
                    </Button>
                  </div>
                  
                  {selectedBatteries.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-semibold">Baterias Sugeridas:</h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {selectedBatteries.map(t => (
                          <div key={t.id} className="text-xs bg-secondary/50 p-2 rounded flex justify-between items-center">
                            <span>{t.id} - {t.name}</span>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full mt-2" variant="default" onClick={() => executeBatteries(selectedBatteries)} disabled={isRunning}>
                        Executar Sugeridas
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Buscar bateria..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8"
                    />
                    <select 
                      className="h-8 rounded-md border bg-background text-sm px-2"
                      value={filterModule}
                      onChange={(e) => setFilterModule(e.target.value)}
                    >
                      <option value="Todos">Todos</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                    {filteredBatteries.map(battery => (
                      <div key={battery.id} className="flex flex-col p-3 border rounded-md bg-card hover:bg-muted/20 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-primary">{battery.id}</span>
                          <Badge variant="outline">{battery.type}</Badge>
                        </div>
                        <span className="text-sm font-medium mb-1">{battery.name}</span>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {battery.tags?.map(t => <span key={t} className="text-[10px] text-muted-foreground bg-secondary/30 px-1 rounded">#{t}</span>)}
                        </div>
                        <Button size="sm" variant="secondary" className="w-full" onClick={() => executeBatteries([battery])} disabled={isRunning}>
                          <PlayCircle className="w-4 h-4 mr-2" /> Executar
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-card/50 p-3 rounded border text-center">
                        <span className="text-2xl font-bold text-primary">{allBatteries.length}</span>
                        <p className="text-xs text-muted-foreground">Baterias</p>
                      </div>
                      <div className="bg-card/50 p-3 rounded border text-center">
                        <span className="text-2xl font-bold text-green-500">
                          {allBatteries.reduce((acc, b) => acc + b.tests.length, 0)}
                        </span>
                        <p className="text-xs text-muted-foreground">Testes Individuais</p>
                      </div>
                    </div>
                    
                    <div className="bg-card/50 p-3 rounded border space-y-3">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <ListFilter className="w-4 h-4" /> Cobertura por Módulo
                      </h3>
                      <div className="space-y-2">
                        {CATEGORIES.map(cat => {
                          const count = testRegistry.getBatteriesByModule(cat).length;
                          const percentage = allBatteries.length > 0 ? Math.round((count / allBatteries.length) * 100) : 0;
                          return (
                            <div key={cat} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>{cat}</span>
                                <span className="font-bold">{count} ({percentage}%)</span>
                              </div>
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Painel Direito: Console e Resultados */}
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
                    <div key={res.batteryId} className="flex flex-col gap-1 p-2 border rounded bg-secondary/20">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(res.status)}
                        <span className="text-xs font-bold truncate" title={res.batteryId}>{res.batteryId}</span>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-muted-foreground">{res.testsPassed}/{res.testsTotal} pass</span>
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
      </div>
    </div>
  );
}
