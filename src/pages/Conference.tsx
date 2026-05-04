import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockOperations, mockOperationItems } from '@/data/mockData'
import type { OperationItem } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, ScanLine, CheckCircle2, AlertTriangle, Camera, Search, Check, FileSignature, Zap } from 'lucide-react'

export default function Conference() {
  const { id } = useParams()
  const navigate = useNavigate()
  const scanRef = useRef<HTMLInputElement>(null)
  const [scanInput, setScanInput] = useState('')
  const [activeTab, setActiveTab] = useState('scan')
  const [lastScanned, setLastScanned] = useState<OperationItem | null>(null)
  const [items, setItems] = useState<OperationItem[]>(() => mockOperationItems.filter(i => i.operation_id === id))
  const op = mockOperations.find(o => o.id === id)

  useEffect(() => { if (activeTab === 'scan') scanRef.current?.focus() }, [activeTab])

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanInput.trim()) return
    const code = scanInput.trim()
    setScanInput('')
    const item = items.find(i => i.product_code === code)
    if (!item) { toast.error(`Produto não encontrado: ${code}`); return }
    const cur = item.quantity_scanned || 0
    if (cur >= item.quantity_expected) { toast.warning(`${item.description}: Já atingido!`); return }
    const nq = cur + 1
    const ns = nq === item.quantity_expected ? 'ok' : 'pending'
    if (ns === 'ok') toast.success(`${item.description}: Conferido! ✓`)
    else toast.info(`${item.description}: +1 (${nq}/${item.quantity_expected})`)
    const updated = { ...item, quantity_scanned: nq, status: ns } as OperationItem
    setItems(prev => prev.map(i => i.id === item.id ? updated : i))
    setLastScanned(updated)
  }

  const progress = () => {
    if (!items.length) return 0
    const t = items.reduce((a, i) => a + i.quantity_expected, 0)
    const s = items.reduce((a, i) => a + (i.quantity_scanned || 0), 0)
    return Math.min(Math.round((s / t) * 100), 100)
  }
  const totalS = items.reduce((a, i) => a + (i.quantity_scanned || 0), 0)
  const totalE = items.reduce((a, i) => a + i.quantity_expected, 0)

  const handleFinish = () => {
    const missing = items.filter(i => i.quantity_scanned < i.quantity_expected)
    if (missing.length > 0) {
      const ok = window.confirm(`Faltam ${missing.length} item(ns). Finalizar mesmo assim?`)
      if (!ok) return
    }
    navigate(`/comprovante/${id}`)
  }

  if (!op) return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
      <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
      <p>Operação não encontrada</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/cargas')}>Voltar</Button>
    </div>
  )

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground truncate">{op.client_name}</h1>
            <span className="text-xs text-muted-foreground">Carga: {op.load_number}</span>
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{totalS}/{totalE}</span>
                <span className="font-bold text-primary">{progress()}%</span>
              </div>
            </div>
            <Progress value={progress()} />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="scan"><ScanLine className="h-4 w-4 mr-1.5" />Conferência</TabsTrigger>
          <TabsTrigger value="list"><CheckCircle2 className="h-4 w-4 mr-1.5" />Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="flex-1 flex flex-col gap-4 mt-4">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <form onSubmit={handleScan} className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="absolute left-3 top-3.5 h-5 w-5 text-primary/50 scan-pulse" />
                  <Input ref={scanRef} value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Bipar código..." className="pl-11 h-12 text-lg font-mono" autoFocus />
                </div>
                <Button type="submit" size="icon" className="h-12 w-12"><Search className="h-5 w-5" /></Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-2">Use câmera ou leitor bluetooth</p>
            </CardContent>
          </Card>

          {lastScanned ? (
            <div className={`glass-card p-4 flex items-center gap-4 slide-up ${lastScanned.status === 'ok' ? 'border-emerald-500/30' : ''}`}>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${lastScanned.status === 'ok' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-primary/15 text-primary'}`}>
                {lastScanned.status === 'ok' ? <Check className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate">{lastScanned.description}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground font-mono">{lastScanned.product_code}</span>
                  <span className="font-mono font-bold text-lg">{lastScanned.quantity_scanned}/{lastScanned.quantity_expected}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40 glass-card min-h-[200px]">
              <Camera className="h-14 w-14 mb-3 opacity-30" />
              <p className="text-sm">Aguardando leitura...</p>
            </div>
          )}

          <div className="mt-auto pt-4">
            <Button className="w-full h-12 text-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 glow-success" onClick={handleFinish}>
              <FileSignature className="mr-2 h-5 w-5" /> Finalizar & Assinar
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="list" className="flex-1 mt-4">
          <div className="space-y-2 pb-20">
            {items.map((item, i) => {
              const done = item.quantity_scanned >= item.quantity_expected
              return (
                <div key={item.id} className={`glass-card p-3 flex items-center justify-between slide-up ${done ? 'border-emerald-500/20' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium truncate ${done ? 'text-emerald-300' : 'text-foreground'}`}>{item.description}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.product_code}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className={`text-lg font-bold font-mono ${done ? 'text-emerald-400' : 'text-foreground'}`}>{item.quantity_scanned || 0}</span>
                      <span className="text-muted-foreground text-sm">/{item.quantity_expected}</span>
                    </div>
                    {done ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
