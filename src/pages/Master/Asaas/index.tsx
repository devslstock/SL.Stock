import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Landmark, CheckCircle2, AlertCircle, Clock, Save, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { asaasMasterApi } from '@/api/asaasMaster'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { getErrorMessage } from '@/utils/errorMessage'
import type { Company } from '@/types/database'

export default function SaaSAsaas() {
  const [searchTerm, setSearchTerm] = useState('')
  const [provisioningCompany, setProvisioningCompany] = useState<Company | null>(null)
  const queryClient = useQueryClient()

  const { data: companies, isLoading } = useQuery({
    queryKey: ['asaas_companies', searchTerm],
    queryFn: async () => {
      let query = supabase.from('companies').select('*').order('name')
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data as Company[]
    }
  })

  const getStatusBadge = (status: Company['asaas_subaccount_status']) => {
    switch (status) {
      case 'ativa': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 gap-1"><CheckCircle2 className="w-3 h-3" /> Ativa</Badge>
      case 'pendente_avaliacao': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 gap-1"><Clock className="w-3 h-3" /> Pendente avaliação</Badge>
      case 'erro': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 gap-1"><AlertCircle className="w-3 h-3" /> Erro</Badge>
      default: return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">Não criada</Badge>
    }
  }

  return (
    <div className="flex-1 h-screen overflow-auto bg-gray-50/50 flex flex-col">
      <div className="bg-white border-b px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Landmark className="h-6 w-6 text-purple-600" />
          Cobrança (Asaas)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Provisione subcontas Asaas para as empresas-cliente. Cada subconta emite boletos em nome próprio e recebe direto na sua carteira — sua conta master nunca movimenta esse dinheiro.
        </p>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <MasterSettingsCard />

          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">CNPJ</th>
                    <th className="px-4 py-3">Status Subconta</th>
                    <th className="px-4 py-3">ID Asaas</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Carregando empresas...</td></tr>
                  ) : companies?.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nenhuma empresa encontrada.</td></tr>
                  ) : (
                    companies?.map((company) => (
                      <tr key={company.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            {company.name.substring(0, 2).toUpperCase()}
                          </div>
                          {company.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{company.cnpj || '-'}</td>
                        <td className="px-4 py-3">
                          {getStatusBadge(company.asaas_subaccount_status)}
                          {company.asaas_subaccount_status === 'erro' && company.asaas_subaccount_last_error && (
                            <p className="text-xs text-red-500 mt-1 max-w-[240px] truncate" title={company.asaas_subaccount_last_error}>
                              {company.asaas_subaccount_last_error}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{company.asaas_subaccount_id || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant={company.asaas_subaccount_id ? 'outline' : 'default'}
                            size="sm"
                            className={company.asaas_subaccount_id ? 'h-8 gap-1.5' : 'h-8 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white'}
                            onClick={() => setProvisioningCompany(company)}
                          >
                            <Landmark className="w-3.5 h-3.5" />
                            {company.asaas_subaccount_id ? 'Reconfigurar' : 'Criar subconta Asaas'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ProvisionDialog
        company={provisioningCompany}
        onOpenChange={(open) => !open && setProvisioningCompany(null)}
        onSuccess={() => {
          setProvisioningCompany(null)
          queryClient.invalidateQueries({ queryKey: ['asaas_companies'] })
        }}
      />
    </div>
  )
}

function MasterSettingsCard() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['asaas_master_settings'],
    queryFn: () => asaasMasterApi.getMasterSettings(),
  })

  const [apiKey, setApiKey] = useState('')
  const [environment, setEnvironment] = useState<'sandbox' | 'producao'>('sandbox')

  useEffect(() => {
    if (settings) {
      setApiKey(settings.api_key || '')
      setEnvironment(settings.environment)
    }
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings) throw new Error('Configurações ainda não carregadas')
      return asaasMasterApi.updateMasterSettings(settings.id, { api_key: apiKey, environment })
    },
    onSuccess: () => {
      toast.success('Chave master salva com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['asaas_master_settings'] })
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e))
  })

  if (isLoading) return null

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-gray-500" />
        <h2 className="font-semibold text-gray-900">Conta Master Asaas</h2>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <label className="block text-sm font-medium mb-1">Chave de API (sua conta principal)</label>
          <Input
            type="password"
            placeholder="Cole aqui a API Key da sua conta Asaas"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Usada para criar as subcontas das empresas-cliente. Nunca é exposta ao cliente final.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ambiente</label>
          <select
            className="w-full h-10 border rounded-md px-3 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
            value={environment}
            onChange={e => setEnvironment(e.target.value as 'sandbox' | 'producao')}
          >
            <option value="sandbox">Sandbox (Testes sem valor real)</option>
            <option value="producao">Produção (Boletos reais)</option>
          </select>
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-purple-600 hover:bg-purple-700 gap-2 text-white">
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}

function ProvisionDialog({ company, onOpenChange, onSuccess }: {
  company: Company | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [mobilePhone, setMobilePhone] = useState('')
  const [incomeValue, setIncomeValue] = useState('')
  const [address, setAddress] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [province, setProvince] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const provisionMutation = useMutation({
    mutationFn: async () => {
      if (!company) throw new Error('Empresa não selecionada')
      const result = await asaasMasterApi.provisionarSubconta({
        companyId: company.id,
        mobilePhone,
        incomeValue: Number(incomeValue),
        address: address || undefined,
        addressNumber: addressNumber || undefined,
        province: province || undefined,
        postalCode: postalCode || undefined,
      })
      if (!result.success) throw new Error(result.error || 'Erro ao criar subconta')
      return result
    },
    onSuccess: () => {
      toast.success('Subconta Asaas criada com sucesso!')
      onSuccess()
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e))
  })

  if (!company) return null

  return (
    <Dialog open={!!company} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar subconta Asaas — {company.name}</DialogTitle>
          <DialogDescription>
            Nome, CNPJ e e-mail vêm do cadastro da empresa. Preencha os dados abaixo, exigidos pela Asaas para abrir a subconta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Celular *</label>
              <Input placeholder="11999999999" value={mobilePhone} onChange={e => setMobilePhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Faturamento mensal (R$) *</label>
              <Input type="number" placeholder="10000" value={incomeValue} onChange={e => setIncomeValue(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">CEP</label>
              <Input placeholder={company.garage_cep || 'Opcional'} value={postalCode} onChange={e => setPostalCode(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bairro</label>
              <Input placeholder={company.garage_neighborhood || 'Opcional'} value={province} onChange={e => setProvince(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <Input placeholder={company.garage_street || 'Opcional'} value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Número</label>
              <Input placeholder={company.garage_number || 'Opcional'} value={addressNumber} onChange={e => setAddressNumber(e.target.value)} />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Campos de endereço em branco usam o endereço já cadastrado da empresa (garagem), se houver.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!mobilePhone || !incomeValue || provisionMutation.isPending}
            onClick={() => provisionMutation.mutate()}
          >
            {provisionMutation.isPending ? 'Criando...' : 'Criar subconta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
