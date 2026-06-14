import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi } from '@/api/companies'
import { useAuth, currentCompanyId } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { Building, MapPin, Save, Phone, Mail, FileText, Info } from 'lucide-react'
import { geocodeAddress } from '@/api/routing'

export default function CompanySettings() {
  const queryClient = useQueryClient()
  const { user, company } = useAuth()
  
  // Apenas gestores podem editar isso
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master'

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company_settings', currentCompanyId],
    queryFn: () => currentCompanyId ? companiesApi.getCompany(currentCompanyId) : null,
    enabled: !!currentCompanyId && isManager
  })

  const [isGeocoding, setIsGeocoding] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    fantasy_name: '',
    cnpj: '',
    phone: '',
    email: '',
    garage_address: '',
    garage_lat: '',
    garage_lng: '',
    additional_info: ''
  })

  useEffect(() => {
    if (companyData) {
      setFormData({
        name: companyData.name || '',
        fantasy_name: companyData.fantasy_name || '',
        cnpj: companyData.cnpj || '',
        phone: companyData.phone || '',
        email: companyData.email || '',
        garage_address: companyData.garage_address || '',
        garage_lat: companyData.garage_lat ? companyData.garage_lat.toString() : '',
        garage_lng: companyData.garage_lng ? companyData.garage_lng.toString() : '',
        additional_info: companyData.additional_info || ''
      })
    }
  }, [companyData])

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<typeof companyData>) => {
      if (!currentCompanyId) throw new Error('Empresa não identificada')
      return companiesApi.updateCompany(currentCompanyId, updates as any)
    },
    onSuccess: () => {
      toast.success('Dados da empresa atualizados com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['company_settings'] })
    },
    onError: (err: any) => toast.error(err.message)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      garage_lat: formData.garage_lat ? parseFloat(formData.garage_lat) : null,
      garage_lng: formData.garage_lng ? parseFloat(formData.garage_lng) : null
    }
    updateMutation.mutate(payload as any)
  }

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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Gerais</CardTitle>
          <CardDescription>Dados principais da empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Razão Social *</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input 
                  value={formData.fantasy_name} 
                  onChange={e => setFormData({...formData, fantasy_name: e.target.value})} 
                  placeholder="Nome Fantasia"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> Telefone</Label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> E-mail</Label>
                <Input 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="email@empresa.com.br"
                  type="email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input 
                  value={formData.cnpj} 
                  onChange={e => setFormData({...formData, cnpj: e.target.value})} 
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Endereço Base da Garagem (Ponto de Partida e Chegada)
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={formData.garage_address} 
                  onChange={e => setFormData({...formData, garage_address: e.target.value})} 
                  placeholder="Rua, Número, Bairro, Cidade - Estado"
                />
                <Button 
                  type="button"
                  variant="outline"
                  className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 whitespace-nowrap"
                  disabled={isGeocoding || !formData.garage_address}
                  onClick={async () => {
                    setIsGeocoding(true)
                    try {
                      const coords = await geocodeAddress(formData.garage_address)
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
                  {isGeocoding ? 'Buscando...' : 'Localizar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Este endereço será utilizado como o ponto de partida e chegada para a otimização de rotas de entregas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Latitude da Garagem</Label>
                <Input 
                  value={formData.garage_lat} 
                  onChange={e => setFormData({...formData, garage_lat: e.target.value})} 
                  placeholder="-23.5505"
                  type="number"
                  step="any"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Longitude da Garagem</Label>
                <Input 
                  value={formData.garage_lng} 
                  onChange={e => setFormData({...formData, garage_lng: e.target.value})} 
                  placeholder="-46.6333"
                  type="number"
                  step="any"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Info className="h-4 w-4 text-muted-foreground" /> Informações Adicionais</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.additional_info}
                onChange={e => setFormData({...formData, additional_info: e.target.value})}
                placeholder="Adicione aqui quaisquer informações adicionais sobre sua empresa."
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
