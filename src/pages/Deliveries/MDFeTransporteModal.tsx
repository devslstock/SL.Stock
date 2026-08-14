import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, MapPin, Truck, FileText, ShieldAlert } from 'lucide-react'
import { supabase } from '@/db/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  isOpen: boolean
  onClose: () => void
  routeId: string
}

export function MDFeTransporteModal({ isOpen, onClose, routeId }: Props) {
  const { company } = useAuth()
  const [activeTab, setActiveTab] = useState('rota')
  const [isLoading, setIsLoading] = useState(false)
  const [mdfeRecordId, setMdfeRecordId] = useState<string | null>(null)
  const [routeClients, setRouteClients] = useState<any[]>([])

  // Form State matching Focus NFe MDFe payload
  const [formData, setFormData] = useState<any>({
    uf_inicio: '',
    uf_fim: '',
    municipios_carregamento: [{ codigo_municipio: '', nome_municipio: '' }],
    municipios_descarregamento: [{ codigo_municipio: '', nome_municipio: '' }],
    nfe: [],
    
    // Transporte Rodoviario
    modal_rodoviario: {
      registro_nacional_transporte: '',
      categoria_combinacao_veicular: '02',
      ciot: [],
      dispositivos_vale_pedagio: [],
      contratantes: [],
      pagamentos: [],
      codigo_veiculo: '',
      placa_veiculo: '',
      renavam_veiculo: '',
      tara_veiculo: '',
      capacidade_kg_veiculo: '',
      capacidade_m3_veiculo: '',
      cpf_proprietario_veiculo: '',
      cnpj_proprietario_veiculo: '',
      rntrc_proprietario_veiculo: '',
      razao_social_proprietario_veiculo: '',
      inscricao_estadual_proprietario_veiculo: '',
      uf_proprietario_veiculo: '',
      tipo_proprietario_veiculo: '0',
      condutores: [{ nome: '', cpf: '' }],
      tipo_rodado_veiculo: '01',
      tipo_carroceria_veiculo: '01'
    },

    // Seguros
    seguro: [{
      responsavel_seguro: '1',
      cnpj_seguradora: '',
      nome_seguradora: '',
      numero_apolice: '',
      averbacao: [{ numero: '' }]
    }]
  })

  useEffect(() => {
    if (isOpen && routeId) {
      loadExistingData()
    }
  }, [isOpen, routeId])

  const loadExistingData = async () => {
    try {
      setIsLoading(true)
      
      // Load mdfe record
      const { data: mdfeData, error: mdfeError } = await supabase
        .from('mdfe_records')
        .select('*')
        .eq('delivery_route_id', routeId)
        .maybeSingle()

      if (mdfeError) throw mdfeError

      // Load route clients to get NFe keys
      const { data: clientsData, error: clientsError } = await supabase
        .from('delivery_clients')
        .select('*')
        .eq('delivery_route_id', routeId)

      if (clientsError) throw clientsError
      setRouteClients(clientsData || [])

      if (mdfeData) {
        setMdfeRecordId(mdfeData.id)
        if (mdfeData.payload) {
          setFormData({ ...formData, ...mdfeData.payload })
        }
      } else {
        setMdfeRecordId(null)
        // Pre-fill NFe keys from delivery clients if available
        const nfes = (clientsData || [])
          .filter(c => c.nfe_access_key)
          .map(c => ({
            chave_acesso: c.nfe_access_key,
            codigo_municipio_descarregamento: '' // Needs to be filled by user
          }))
        
        if (nfes.length > 0) {
          setFormData((prev: any) => ({ ...prev, nfe: nfes }))
        }
      }
    } catch (err) {
      console.error('Error loading MDFe config', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      if (!company) throw new Error('Company not found')

      if (mdfeRecordId) {
        const { error } = await supabase
          .from('mdfe_records')
          .update({ payload: formData })
          .eq('id', mdfeRecordId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('mdfe_records').insert({
          company_id: company.id,
          delivery_route_id: routeId,
          status: 'pendente',
          payload: formData
        })
        if (error) throw error
      }
      onClose()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateModalRodoviario = (field: string, val: any) => {
    setFormData({
      ...formData,
      modal_rodoviario: { ...formData.modal_rodoviario, [field]: val }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Painel de Configuração do MDF-e</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">Carregando...</div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="rota"><MapPin className="w-4 h-4 mr-2"/> Rota</TabsTrigger>
              <TabsTrigger value="dfe"><FileText className="w-4 h-4 mr-2"/> DF-e (Notas)</TabsTrigger>
              <TabsTrigger value="veiculo"><Truck className="w-4 h-4 mr-2"/> Veículo / Condutor</TabsTrigger>
              <TabsTrigger value="seguro"><ShieldAlert className="w-4 h-4 mr-2"/> Seguro</TabsTrigger>
            </TabsList>

            <div className="mt-4 border rounded-md p-4 bg-muted/10">
              
              {/* ABA ROTA */}
              <TabsContent value="rota" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>UF Início</Label>
                    <Input value={formData.uf_inicio} onChange={e => setFormData({...formData, uf_inicio: e.target.value.toUpperCase()})} maxLength={2} placeholder="Ex: SP"/>
                  </div>
                  <div className="space-y-2">
                    <Label>UF Fim</Label>
                    <Input value={formData.uf_fim} onChange={e => setFormData({...formData, uf_fim: e.target.value.toUpperCase()})} maxLength={2} placeholder="Ex: RJ"/>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="font-bold">Municípios de Carregamento</Label>
                    <Button variant="outline" size="sm" onClick={() => setFormData({...formData, municipios_carregamento: [...formData.municipios_carregamento, {codigo_municipio: '', nome_municipio: ''}]})}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  {formData.municipios_carregamento.map((m: any, i: number) => (
                    <div key={i} className="flex gap-2 items-end mb-2">
                      <div className="flex-1">
                        <Label className="text-xs">Código IBGE</Label>
                        <Input value={m.codigo_municipio} onChange={e => {
                          const arr = [...formData.municipios_carregamento]; arr[i].codigo_municipio = e.target.value; setFormData({...formData, municipios_carregamento: arr})
                        }} />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Nome do Município</Label>
                        <Input value={m.nome_municipio} onChange={e => {
                          const arr = [...formData.municipios_carregamento]; arr[i].nome_municipio = e.target.value; setFormData({...formData, municipios_carregamento: arr})
                        }} />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setFormData({...formData, municipios_carregamento: formData.municipios_carregamento.filter((_: any, idx: number) => idx !== i)})}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="font-bold">Municípios de Descarregamento</Label>
                    <Button variant="outline" size="sm" onClick={() => setFormData({...formData, municipios_descarregamento: [...formData.municipios_descarregamento, {codigo_municipio: '', nome_municipio: ''}]})}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  {formData.municipios_descarregamento.map((m: any, i: number) => (
                    <div key={i} className="flex gap-2 items-end mb-2">
                      <div className="flex-1">
                        <Label className="text-xs">Código IBGE</Label>
                        <Input value={m.codigo_municipio} onChange={e => {
                          const arr = [...formData.municipios_descarregamento]; arr[i].codigo_municipio = e.target.value; setFormData({...formData, municipios_descarregamento: arr})
                        }} />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Nome do Município</Label>
                        <Input value={m.nome_municipio} onChange={e => {
                          const arr = [...formData.municipios_descarregamento]; arr[i].nome_municipio = e.target.value; setFormData({...formData, municipios_descarregamento: arr})
                        }} />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setFormData({...formData, municipios_descarregamento: formData.municipios_descarregamento.filter((_: any, idx: number) => idx !== i)})}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ABA DF-e (Notas Fiscais) */}
              <TabsContent value="dfe" className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <Label className="font-bold">Notas Fiscais (NFe) Vinculadas</Label>
                  <Button variant="outline" size="sm" onClick={() => setFormData({...formData, nfe: [...formData.nfe, {chave_acesso: '', codigo_municipio_descarregamento: ''}]})}>
                    <Plus className="h-4 w-4 mr-1" /> Add NFe
                  </Button>
                </div>
                {formData.nfe.map((nfe: any, i: number) => (
                  <div key={i} className="flex gap-2 items-end mb-3 border p-2 rounded bg-white dark:bg-slate-900">
                    <div className="flex-[2]">
                      <Label className="text-xs">Chave de Acesso (44 dígitos)</Label>
                      <Input value={nfe.chave_acesso} onChange={e => {
                        const arr = [...formData.nfe]; arr[i].chave_acesso = e.target.value; setFormData({...formData, nfe: arr})
                      }} maxLength={44} />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Cód IBGE Descarreg.</Label>
                      <Input value={nfe.codigo_municipio_descarregamento} onChange={e => {
                        const arr = [...formData.nfe]; arr[i].codigo_municipio_descarregamento = e.target.value; setFormData({...formData, nfe: arr})
                      }} />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setFormData({...formData, nfe: formData.nfe.filter((_: any, idx: number) => idx !== i)})}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </TabsContent>

              {/* ABA VEICULO */}
              <TabsContent value="veiculo" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>RNTRC</Label>
                    <Input 
                      value={formData.modal_rodoviario.registro_nacional_transporte} 
                      onChange={e => updateModalRodoviario('registro_nacional_transporte', e.target.value)} 
                      maxLength={8} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria Combin. Veicular</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.modal_rodoviario.categoria_combinacao_veicular}
                      onChange={e => updateModalRodoviario('categoria_combinacao_veicular', e.target.value)}
                    >
                      <option value="02">02 - 2 eixos</option>
                      <option value="04">04 - 3 eixos</option>
                      <option value="06">06 - 4 eixos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Placa Tração *</Label>
                    <Input value={formData.modal_rodoviario.placa_veiculo} onChange={e => updateModalRodoviario('placa_veiculo', e.target.value.toUpperCase())} maxLength={7} />
                  </div>
                  <div className="space-y-2">
                    <Label>RENAVAM</Label>
                    <Input value={formData.modal_rodoviario.renavam_veiculo} onChange={e => updateModalRodoviario('renavam_veiculo', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tara (KG) *</Label>
                    <Input type="number" value={formData.modal_rodoviario.tara_veiculo} onChange={e => updateModalRodoviario('tara_veiculo', e.target.value)} />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="font-bold">Condutores *</Label>
                    <Button variant="outline" size="sm" onClick={() => updateModalRodoviario('condutores', [...formData.modal_rodoviario.condutores, { nome: '', cpf: '' }])}>
                      <Plus className="h-4 w-4 mr-1" /> Add Condutor
                    </Button>
                  </div>
                  {formData.modal_rodoviario.condutores.map((c: any, i: number) => (
                    <div key={i} className="flex gap-2 items-end mb-2">
                      <div className="flex-1">
                        <Label className="text-xs">Nome</Label>
                        <Input value={c.nome} onChange={e => {
                          const arr = [...formData.modal_rodoviario.condutores]; arr[i].nome = e.target.value; updateModalRodoviario('condutores', arr)
                        }} />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">CPF</Label>
                        <Input value={c.cpf} onChange={e => {
                          const arr = [...formData.modal_rodoviario.condutores]; arr[i].cpf = e.target.value; updateModalRodoviario('condutores', arr)
                        }} maxLength={11} />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => updateModalRodoviario('condutores', formData.modal_rodoviario.condutores.filter((_: any, idx: number) => idx !== i))}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ABA SEGUROS */}
              <TabsContent value="seguro" className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <Label className="font-bold">Seguro da Carga</Label>
                  <Button variant="outline" size="sm" onClick={() => setFormData({...formData, seguro: [...formData.seguro, {responsavel_seguro: '1', cnpj_seguradora: '', nome_seguradora: '', numero_apolice: '', averbacao: []}]})}>
                    <Plus className="h-4 w-4 mr-1" /> Add Seguro
                  </Button>
                </div>
                {formData.seguro.map((seg: any, i: number) => (
                  <div key={i} className="border p-3 rounded-md mb-3 bg-white dark:bg-slate-900 relative">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setFormData({...formData, seguro: formData.seguro.filter((_: any, idx: number) => idx !== i)})}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3 pr-8">
                      <div className="space-y-1">
                        <Label className="text-xs">Responsável do Seguro</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={seg.responsavel_seguro} onChange={e => {
                          const arr = [...formData.seguro]; arr[i].responsavel_seguro = e.target.value; setFormData({...formData, seguro: arr})
                        }}>
                          <option value="1">1 - Emitente do MDF-e</option>
                          <option value="2">2 - Contratante do Transporte</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">CNPJ Responsável (Opcional)</Label>
                        <Input value={seg.cnpj_responsavel || ''} onChange={e => {
                          const arr = [...formData.seguro]; arr[i].cnpj_responsavel = e.target.value; setFormData({...formData, seguro: arr})
                        }} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">CNPJ da Seguradora *</Label>
                        <Input value={seg.cnpj_seguradora} onChange={e => {
                          const arr = [...formData.seguro]; arr[i].cnpj_seguradora = e.target.value; setFormData({...formData, seguro: arr})
                        }} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Nome da Seguradora *</Label>
                        <Input value={seg.nome_seguradora} onChange={e => {
                          const arr = [...formData.seguro]; arr[i].nome_seguradora = e.target.value; setFormData({...formData, seguro: arr})
                        }} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Número da Apólice *</Label>
                        <Input value={seg.numero_apolice} onChange={e => {
                          const arr = [...formData.seguro]; arr[i].numero_apolice = e.target.value; setFormData({...formData, seguro: arr})
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

            </div>
          </Tabs>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isLoading}>Salvar Configuração</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
