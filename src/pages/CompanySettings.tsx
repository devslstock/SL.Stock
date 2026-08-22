import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi } from '@/api/companies'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { Building, MapPin, Save, Phone, Mail, FileText, Info, Key, RefreshCw } from 'lucide-react'
import { geocodeAddress } from '@/api/routing'

import { backupApi } from '@/api/backup'
import { saasApi } from '@/api/saas'
import { focusIntegrationApi } from '@/api/focusIntegration'
import { supabase } from '@/lib/supabase'
import { Database, Download, Upload, Crown, Star, CheckCircle2, ArrowUpCircle, Image as ImageIcon, Receipt, Key as KeyIcon, ShieldCheck, AlertTriangle } from 'lucide-react'
import { isValidCPFOrCNPJ, formatDocument } from '@/utils/documentValidation'
import { getErrorMessage } from '@/utils/errorMessage'

export default function CompanySettings() {
  const queryClient = useQueryClient()
  const { user, company } = useAuth()
  
  // Apenas gestores podem editar isso
  const isMaster = user?.role === 'master'
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || isMaster

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company_settings', company?.id],
    queryFn: () => company?.id ? companiesApi.getCompany(company.id) : null,
    enabled: !!company?.id && isManager
  })

  const [isGeocoding, setIsGeocoding] = useState(false)
  // Backup & Restore
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState('')
  
  // Integração Fiscal
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [certificatePassword, setCertificatePassword] = useState('')
  const [isSyncingFiscal, setIsSyncingFiscal] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    fantasy_name: '',
    cnpj: '',
    state_registration: '',
    phone: '',
    email: '',
    garage_cep: '',
    garage_street: '',
    garage_number: '',
    garage_complement: '',
    garage_neighborhood: '',
    garage_city: '',
    garage_state: '',
    garage_lat: '',
    garage_lng: '',
    additional_info: '',
    logo_url: '',
    exibir_logo_nf: false,
    focusnfe_env: 'homologacao' as 'producao' | 'homologacao',
    focusnfe_token: '',
    asaas_env: 'sandbox' as 'sandbox' | 'producao',
    asaas_api_key: '',
    asaas_webhook_token: ''
  })

  useEffect(() => {
    if (companyData) {
      setFormData({
        name: companyData.name || '',
        fantasy_name: companyData.fantasy_name || '',
        cnpj: companyData.cnpj || '',
        state_registration: companyData.state_registration || '',
        phone: companyData.phone || '',
        email: companyData.email || '',
        garage_cep: companyData.garage_cep || '',
        garage_street: companyData.garage_street || '',
        garage_number: companyData.garage_number || '',
        garage_complement: companyData.garage_complement || '',
        garage_neighborhood: companyData.garage_neighborhood || '',
        garage_city: companyData.garage_city || '',
        garage_state: companyData.garage_state || '',
        garage_lat: companyData.garage_lat ? companyData.garage_lat.toString() : '',
        garage_lng: companyData.garage_lng ? companyData.garage_lng.toString() : '',
        additional_info: companyData.additional_info || '',
        logo_url: companyData.logo_url || '',
        exibir_logo_nf: companyData.exibir_logo_nf || false,
        focusnfe_env: companyData.focusnfe_env || 'homologacao',
        focusnfe_token: companyData.focusnfe_token || '',
        asaas_env: companyData.asaas_env || 'sandbox',
        asaas_api_key: companyData.asaas_api_key || '',
        asaas_webhook_token: companyData.asaas_webhook_token || ''
      })
    }
  }, [companyData])

  const handleCepBlur = async () => {
    const cep = formData.garage_cep.replace(/\D/g, '')
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            garage_street: data.logradouro || prev.garage_street,
            garage_neighborhood: data.bairro || prev.garage_neighborhood,
            garage_city: data.localidade || prev.garage_city,
            garage_state: data.uf || prev.garage_state
          }))
          toast.success('Endereço preenchido pelo CEP')
        }
      } catch (e) {
        // ignore
      }
    }
  }

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<typeof companyData>) => {
      if (!company?.id) throw new Error('Empresa não identificada')
      return companiesApi.updateCompany(company.id, updates as any)
    },
    onSuccess: () => {
      toast.success('Dados da empresa atualizados com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['company_settings'] })
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err))
  })

  const requestUpgradeMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id || !user) throw new Error('Dados não encontrados');
      return saasApi.createLead({
        name: user.name || 'Usuário Sistema',
        email: user.email || user.username || 'N/A',
        phone: formData.phone || company?.phone || 'N/A',
        message: `SOLICITAÇÃO DE UPGRADE: A empresa ${company.name || company.fantasy_name} (${company.cnpj || 'CNPJ não inf.'}) deseja conhecer os planos superiores para expandir suas operações. Plano atual: ${(company.plan || 'platina').toUpperCase()}.`
      });
    },
    onSuccess: () => {
      toast.success('Solicitação enviada com sucesso! Nossa equipe comercial entrará em contato em breve para apresentar os benefícios do Upgrade.');
    },
    onError: (err: unknown) => toast.error(`Erro ao enviar solicitação: ${getErrorMessage(err)}`)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.cnpj && !isValidCPFOrCNPJ(formData.cnpj)) {
      toast.error('CNPJ/CPF inválido. Verifique o número digitado.')
      return
    }

    const payload: any = {
      ...formData,
      garage_address: `${formData.garage_street}, ${formData.garage_number}, ${formData.garage_neighborhood}, ${formData.garage_city} - ${formData.garage_state}`,
      garage_lat: formData.garage_lat ? parseFloat(formData.garage_lat) : null,
      garage_lng: formData.garage_lng ? parseFloat(formData.garage_lng) : null
    }

    if (!isMaster) {
      delete payload.name
      delete payload.cnpj
    }
    
    updateMutation.mutate(payload)
  }



  async function handleExportBackup() {
    if (!company?.id) return
    setIsBackingUp(true)
    toast.success('Gerando backup, isso pode levar alguns segundos...', { duration: 5000 })
    try {
      const backupData = await backupApi.generateBackup(company.id)
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup_${company.slug}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Backup gerado e baixado com sucesso!')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Erro ao gerar backup')
    } finally {
      setIsBackingUp(false)
    }
  }

  async function handleSyncFiscal() {
    if (!company?.id) return
    if (certificateFile && !certificatePassword) {
      toast.error('Informe a senha do certificado para prosseguir.')
      return
    }
    
    setIsSyncingFiscal(true)
    try {
      await focusIntegrationApi.syncCompany(company.id, false, certificateFile || undefined, certificatePassword || undefined)
      toast.success('Sincronização fiscal concluída!')
      setCertificateFile(null)
      setCertificatePassword('')
      queryClient.invalidateQueries({ queryKey: ['company_settings'] })
    } catch (err: unknown) {
      toast.error('Erro na sincronização fiscal: ' + getErrorMessage(err))
    } finally {
      setIsSyncingFiscal(false)
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem da logo não pode ter mais de 2MB')
      return
    }

    const img = new Image()
    const reader = new FileReader()
    
    reader.onload = (event) => {
      img.src = event.target?.result as string
    }
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > 200 || height > 200) {
        if (width > height) {
          height = Math.round((height * 200) / width)
          width = 200
        } else {
          width = Math.round((width * 200) / height)
          height = 200
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        // Forçar PNG para compatibilidade com Focus NFe
        const base64Png = canvas.toDataURL('image/png')
        setFormData(prev => ({ ...prev, logo_url: base64Png }))
      }
    }
    
    reader.readAsDataURL(file)
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !company?.id) return

    setIsRestoring(true)
    setRestoreProgress('Lendo arquivo...')
    
    try {
      const text = await file.text()
      const backupData = JSON.parse(text)
      
      if (!backupData.version || !backupData.companyId || backupData.companyId !== company.id) {
        throw new Error('Arquivo de backup inválido ou pertence a outra empresa.')
      }

      await backupApi.restoreBackup(company.id, backupData, (msg) => {
        setRestoreProgress(msg)
      })

      toast.success('Backup restaurado com sucesso!')
      queryClient.invalidateQueries()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Erro ao restaurar backup')
    } finally {
      setIsRestoring(false)
      setRestoreProgress('')
      if (e.target) e.target.value = '' // reset file input
    }
  }


  const planDetails: Record<string, any> = {
    bronze: { name: 'Bronze', desc: 'Funcionalidades Básicas', icon: Star, color: 'text-amber-700 dark:text-amber-600', bg: 'bg-amber-700/10', border: 'border-t-amber-700', perms: ['Dashboard Básico', 'Configurações de Empresa', 'Gestão de Usuários'] },
    prata: { name: 'Prata', desc: 'Gestão de Cargas e Operações', icon: Star, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500/10', border: 'border-t-slate-500', perms: ['Dashboard Básico', 'Configurações de Empresa', 'Módulo de Cargas', 'Controle Operacional'] },
    ouro: { name: 'Ouro', desc: 'Entregas, Rotas e Conferência', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-t-amber-500', perms: ['Módulo de Cargas', 'Módulo de Entregas', 'Acompanhamento de Rotas', 'Comprovantes Digitais'] },
    platina: { name: 'Platina (Premium)', desc: 'Sistema Completo e Ilimitado', icon: Crown, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-t-emerald-500', perms: ['Todos os módulos anteriores', 'Módulo de Vendas (CRM)', 'Cadastros Completos', 'Acesso Total e Ilimitado'] }
  }
  
  const currentPlanKey = (company?.plan || 'platina') as string;
  const activePlan = planDetails[currentPlanKey] || planDetails.platina;

  if (!isManager) {
    return <div className="p-8 text-center text-muted-foreground">Acesso negado. Apenas gestores podem configurar a empresa.</div>
  }

  if (isLoading) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 slide-in">
      <div className="flex items-center gap-3 mb-6">
        <Building className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Minha Empresa</h1>
          <p className="text-sm text-muted-foreground">Gerencie os dados e configurações da sua organização</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Plano e Assinatura */}
        <div className={`glass-card p-6 border-t-4 ${activePlan.border}`}>
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <activePlan.icon className={`h-6 w-6 ${activePlan.color}`} />
                <h2 className={`text-xl font-bold ${activePlan.color}`}>Plano {activePlan.name}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{activePlan.desc}</p>
              
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-foreground mb-2">Permissões Atuais:</p>
                {activePlan.perms.map((perm: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className={`h-4 w-4 ${activePlan.color}`} />
                    {perm}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 max-w-xs text-center w-full md:w-auto">
              <h3 className="font-bold text-foreground mb-2">Deseja expandir suas operações?</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Faça um upgrade e tenha acesso a roteirização inteligente, gestão de vendas e relatórios avançados.
              </p>
              <Button 
                type="button" 
                onClick={() => requestUpgradeMutation.mutate()}
                disabled={requestUpgradeMutation.isPending || currentPlanKey === 'platina'}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
              >
                {requestUpgradeMutation.isPending ? 'Enviando...' : (
                  <>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    {currentPlanKey === 'platina' ? 'Você já possui o melhor plano!' : 'Solicitar Upgrade'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Dados Principais */}
        <div className="glass-card p-6 border-t-4 border-t-primary">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <Building className="h-5 w-5 text-primary" />
            Dados Principais
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Razão Social *</label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required
                disabled={!isMaster}
              />
            </div>
            <div className="md:col-span-4">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Inscrição Estadual</label>
              <Input 
                value={formData.state_registration} 
                onChange={e => setFormData({...formData, state_registration: e.target.value})} 
                placeholder="Isento ou Número"
                disabled={!isMaster}
              />
            </div>
            <div className="md:col-span-4">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">CNPJ</label>
              <Input 
                value={formData.cnpj} 
                onChange={e => setFormData({...formData, cnpj: formatDocument(e.target.value)})} 
                placeholder="00.000.000/0000-00"
                disabled={!isMaster}
              />
            </div>
            <div className="md:col-span-12">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Nome Fantasia</label>
              <Input 
                value={formData.fantasy_name} 
                onChange={e => setFormData({...formData, fantasy_name: e.target.value})} 
                placeholder="Nome Fantasia"
              />
            </div>
            <div className="md:col-span-12 mt-2">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Logo da Empresa</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {formData.logo_url ? (
                  <div className="relative group rounded-md border border-border p-2 bg-background flex items-center justify-center w-32 h-32 overflow-hidden">
                    <img src={formData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({...prev, logo_url: ''}))}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-muted-foreground/50 p-4 bg-muted/20 flex flex-col items-center justify-center w-32 h-32 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-xs text-center">Nenhuma logo</span>
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    A logo aparecerá nos PDFs gerados pelo sistema, como pedidos de venda e comprovantes.
                  </p>
                  <div className="relative inline-block">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleLogoUpload}
                    />
                    <Button type="button" variant="outline" className="w-full sm:w-auto">
                      <Upload className="h-4 w-4 mr-2" />
                      Anexar Logo
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Máx. 2MB. Formatos JPG ou PNG.</p>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between bg-muted/20 p-4 rounded-md border border-border">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Exibir logo da empresa na NF
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Quando ativado, a logo cadastrada será enviada para a Receita e exibida no cabeçalho do DANFE.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={!!formData.exibir_logo_nf}
                      disabled={!formData.logo_url}
                      onChange={(e) => setFormData({...formData, exibir_logo_nf: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                  <span className="text-sm font-bold w-8 text-foreground">{formData.exibir_logo_nf ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="glass-card p-6 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <Phone className="h-5 w-5 text-blue-500" />
            Contato
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block flex items-center gap-2">
                Telefone
              </label>
              <Input 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block flex items-center gap-2">
                E-mail
              </label>
              <Input 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="email@empresa.com.br"
                type="email"
              />
            </div>
          </div>
        </div>

        {/* Logística & Endereço */}
        <div className="glass-card p-6 border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <MapPin className="h-5 w-5 text-emerald-500" />
            Logística e Endereço Base
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            <div className="md:col-span-12">
              <p className="text-xs text-muted-foreground mb-2">
                Este endereço será utilizado como o ponto de partida e chegada para a otimização de rotas de entregas da sua frota.
              </p>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">CEP</label>
              <Input 
                value={formData.garage_cep} 
                onChange={e => setFormData({...formData, garage_cep: e.target.value})} 
                onBlur={handleCepBlur}
                placeholder="00000-000"
              />
            </div>
            <div className="md:col-span-9">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Endereço (Logradouro)</label>
              <Input 
                value={formData.garage_street} 
                onChange={e => setFormData({...formData, garage_street: e.target.value})} 
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Número</label>
              <Input 
                value={formData.garage_number} 
                onChange={e => setFormData({...formData, garage_number: e.target.value})} 
              />
            </div>
            <div className="md:col-span-9">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Complemento</label>
              <Input 
                value={formData.garage_complement} 
                onChange={e => setFormData({...formData, garage_complement: e.target.value})} 
                placeholder="Galpão, Sala..."
              />
            </div>

            <div className="md:col-span-5">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Bairro</label>
              <Input 
                value={formData.garage_neighborhood} 
                onChange={e => setFormData({...formData, garage_neighborhood: e.target.value})} 
              />
            </div>
            <div className="md:col-span-5">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Município</label>
              <Input 
                value={formData.garage_city} 
                onChange={e => setFormData({...formData, garage_city: e.target.value})} 
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">UF</label>
              <Input 
                value={formData.garage_state} 
                onChange={e => setFormData({...formData, garage_state: e.target.value})} 
                maxLength={2}
                className="uppercase text-center"
              />
            </div>

            <div className="md:col-span-12 mt-2 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Coordenadas Geográficas (Latitude e Longitude)
                </label>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                  disabled={isGeocoding || !formData.garage_street || !formData.garage_city}
                  onClick={async () => {
                    setIsGeocoding(true)
                    try {
                      const fullAddress = `${formData.garage_street}, ${formData.garage_number || ''}, ${formData.garage_neighborhood || ''}, ${formData.garage_city} - ${formData.garage_state}`.replace(/,\s*,/g, ',').trim()
                      const coords = await geocodeAddress(fullAddress)
                      if (coords) {
                        setFormData({...formData, garage_lat: coords.lat.toString(), garage_lng: coords.lng.toString()})
                        toast.success('Coordenadas localizadas com sucesso!')
                      } else {
                        toast.error('Não foi possível localizar este endereço.')
                      }
                    } catch (e) {
                      toast.error('Erro na busca de coordenadas.')
                    } finally {
                      setIsGeocoding(false)
                    }
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {isGeocoding ? 'Buscando...' : 'Localizar a partir do Endereço'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase block">Latitude</label>
                  <Input 
                    value={formData.garage_lat} 
                    onChange={e => setFormData({...formData, garage_lat: e.target.value})} 
                    placeholder="-23.5505"
                    type="number"
                    step="any"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase block">Longitude</label>
                  <Input 
                    value={formData.garage_lng} 
                    onChange={e => setFormData({...formData, garage_lng: e.target.value})} 
                    placeholder="-46.6333"
                    type="number"
                    step="any"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-12 mt-2">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block flex items-center gap-1">
                Informações Adicionais
              </label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.additional_info}
                onChange={e => setFormData({...formData, additional_info: e.target.value})}
                placeholder="Adicione aqui quaisquer informações adicionais sobre sua empresa."
              />
            </div>
          </div>
        </div>



        {/* Integração Fiscal */}
        <div className="glass-card p-6 border-t-4 border-t-purple-500">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <ShieldCheck className="h-5 w-5 text-purple-500" />
            Integração Fiscal e Certificado Digital
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Para que o sistema consiga emitir notas fiscais, você precisa sincronizar os dados da sua empresa com a Receita Federal através da nossa mensageria. Envie seu Certificado Digital A1.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4 bg-muted/20 p-4 rounded-md border border-border">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Ambiente Fiscal (SEFAZ)
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.focusnfe_env || 'homologacao'}
                  onChange={e => setFormData({...formData, focusnfe_env: e.target.value as 'producao' | 'homologacao'})}
                >
                  <option value="homologacao">Homologação (Testes sem valor fiscal)</option>
                  <option value="producao">Produção (Notas com valor fiscal real)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <KeyIcon className="h-4 w-4" /> Token de Integração Fiscal
                </label>
                <Input
                  placeholder="Cole aqui o Token correspondente ao ambiente acima"
                  value={formData.focusnfe_token || ''}
                  onChange={e => setFormData({...formData, focusnfe_token: e.target.value})}
                  type="password"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtenha seu token no painel do sistema fiscal. Se você trocar de ambiente, certifique-se de colar o token correto (Homologação ou Produção).
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-muted/20 p-4 rounded-md border border-border">
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                <FileText className="h-4 w-4" /> Arquivo do Certificado (A1 / .pfx)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pfx,.p12"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) setCertificateFile(file)
                  }}
                />
                <Button type="button" variant="outline" className="w-full justify-start text-left bg-background pointer-events-none">
                  {certificateFile ? certificateFile.name : 'Clique para selecionar o certificado...'}
                </Button>
              </div>
            </div>

            <div className="space-y-4 bg-muted/20 p-4 rounded-md border border-border">
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                <KeyIcon className="h-4 w-4" /> Senha do Certificado
              </label>
              <Input
                type="password"
                placeholder="Senha de instalação do certificado"
                value={certificatePassword}
                onChange={e => setCertificatePassword(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="button"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleSyncFiscal}
                disabled={isSyncingFiscal}
              >
                {isSyncingFiscal ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {isSyncingFiscal ? 'Sincronizando...' : 'Salvar e Sincronizar com a Receita Federal'}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Ao clicar em sincronizar, todas as alterações salvas acima também serão enviadas para a mensageria.
              </p>

              {companyData?.focus_nfe_cert_expires_at && (
                (() => {
                  const daysLeft = Math.ceil((new Date(companyData.focus_nfe_cert_expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                  if (daysLeft < 0) {
                    return (
                      <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start gap-3 text-red-700">
                        <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold">Certificado Digital Vencido!</h4>
                          <p className="text-sm">O certificado digital expirou em {new Date(companyData.focus_nfe_cert_expires_at).toLocaleDateString()}. Você não conseguirá emitir novas notas até renovar.</p>
                        </div>
                      </div>
                    )
                  }
                  if (daysLeft <= 30) {
                    return (
                      <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-md flex items-start gap-3 text-amber-700">
                        <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold">Certificado Próximo do Vencimento</h4>
                          <p className="text-sm">O certificado digital irá expirar em {daysLeft} dias ({new Date(companyData.focus_nfe_cert_expires_at).toLocaleDateString()}). Providencie a renovação.</p>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-500 rounded-r-md flex items-center gap-3 text-green-700 text-sm">
                      <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                      <span>Certificado válido até {new Date(companyData.focus_nfe_cert_expires_at).toLocaleDateString()}</span>
                    </div>
                  )
                })()
              )}

              <div className="mt-6 border-t border-border pt-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg">
                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-purple-500" />
                      Webhooks de Retorno
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Receba atualizações de status da SEFAZ em tempo real.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="whitespace-nowrap"
                    onClick={async () => {
                      if (!companyData?.focus_nfe_status || companyData.focus_nfe_status !== 'SINCRONIZADA') {
                        toast.error('Você precisa primeiro salvar e sincronizar a empresa.')
                        return
                      }
                      try {
                        await focusIntegrationApi.criarWebhook(companyData.cnpj!)
                        toast.success('Webhooks configurados com sucesso!')
                      } catch (e: unknown) {
                        toast.error(getErrorMessage(e))
                      }
                    }}
                  >
                    Ativar Notificações
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integração de Cobrança (Asaas) */}
        <div className="glass-card p-6 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <Receipt className="h-5 w-5 text-blue-500" />
            Integração de Cobrança (Asaas)
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            A cobrança via boleto é configurada pelo administrador SaaS, que cria uma subconta Asaas para sua empresa. Assim que ativa, você já pode emitir boletos pela tela de Contas a Receber.
          </p>

          <div className="bg-muted/20 p-4 rounded-md border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Status da Integração
              </label>
              {companyData?.asaas_subaccount_status === 'ativa' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Ativa</span>
              ) : companyData?.asaas_subaccount_status === 'pendente_avaliacao' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Pendente de avaliação</span>
              ) : companyData?.asaas_subaccount_status === 'erro' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Erro na configuração</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">Não configurada</span>
              )}
            </div>

            {companyData?.asaas_subaccount_id ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-muted-foreground">Ambiente</span>
                  <span className="font-medium">{companyData.asaas_env === 'producao' ? 'Produção' : 'Sandbox'}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground">Configurada em</span>
                  <span className="font-medium">
                    {companyData.asaas_subaccount_created_at ? new Date(companyData.asaas_subaccount_created_at).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma subconta Asaas configurada ainda. Fale com o administrador SaaS para habilitar a emissão de boletos.
              </p>
            )}

            {companyData?.asaas_subaccount_status === 'erro' && companyData.asaas_subaccount_last_error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                {companyData.asaas_subaccount_last_error}
              </p>
            )}
          </div>
        </div>

        {/* Backup de Dados */}
        <div className="glass-card p-6 border-t-4 border-t-orange-500">
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground">
            <Database className="h-5 w-5 text-orange-500" />
            Backup e Restauração de Dados
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Exporte ou importe seus cadastros mestres (Clientes, Produtos, Usuários, etc). O arquivo de backup estará no formato JSON.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              type="button" 
              variant="default"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleExportBackup} 
              disabled={isBackingUp || isRestoring}
            >
              {isBackingUp ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isBackingUp ? 'Gerando Backup...' : 'Exportar Backup'}
            </Button>

            <div className="relative">
              <input 
                type="file" 
                accept=".json"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={handleImportBackup}
                disabled={isBackingUp || isRestoring}
              />
              <Button 
                type="button" 
                variant="outline"
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                disabled={isBackingUp || isRestoring}
              >
                {isRestoring ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isRestoring ? 'Restaurando...' : 'Importar Backup'}
              </Button>
            </div>
          </div>
          
          {isRestoring && restoreProgress && (
            <p className="text-sm font-medium text-orange-600 mt-4 animate-pulse">
              {restoreProgress}
            </p>
          )}
          
          <p className="text-[11px] text-muted-foreground mt-4">
            Atenção: A restauração fará atualização dos registros (Upsert). Registros com o mesmo identificador serão sobrescritos com as informações do backup para evitar perdas ou duplicações.
          </p>
        </div>

        {/* Floating Finalize Bar */}
        <div className="flex justify-end gap-3 sticky bottom-4 z-10 bg-background/80 p-4 backdrop-blur-md rounded-xl border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <Button type="submit" className="min-w-[200px] shadow-lg shadow-primary/20 h-11 text-base font-bold" disabled={updateMutation.isPending}>
            <Save className="h-5 w-5 mr-2" />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
