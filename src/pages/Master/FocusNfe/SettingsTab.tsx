import { useState } from 'react'
import { Save, Server, Shield, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { focusIntegrationApi } from '@/api/focusIntegration'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toaster'
import type { FocusNfeSettings } from '@/types/database'
import { getErrorMessage } from '@/utils/errorMessage'

interface Props {
  initialSettings: FocusNfeSettings | null
}

export function SettingsTab({ initialSettings }: Props) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<Partial<FocusNfeSettings>>(initialSettings || {
    is_active: false,
    environment: 'homologacao',
    auto_register: false,
    auto_sync: false,
    enable_nfe: false,
    enable_nfce: false,
    enable_nfse: false,
    enable_receive_nfe: false,
    enable_receive_cte: false
  })

  // Para o Token, não salvamos no banco (já que está no env), mas permitimos que o admin teste
  const [testToken, setTestToken] = useState('')

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (initialSettings?.id) {
        return focusIntegrationApi.updateSettings(initialSettings.id, formData)
      } else {
        return focusIntegrationApi.createSettings(formData as any)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus_nfe_settings'] })
      toast.success('Configurações salvas com sucesso!')
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e))
  })

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  const handleTestConnection = async () => {
    setTestStatus('testing')
    try {
      const res = await focusIntegrationApi.testConnection(testToken || undefined)
      setTestStatus('success')
      setTestMessage(res.message || 'Conexão bem sucedida!')
    } catch (e: unknown) {
      setTestStatus('error')
      setTestMessage(getErrorMessage(e))
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Autenticação e Conexão</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Status da Integração</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="is_active" 
                    checked={formData.is_active === true}
                    onChange={() => setFormData({ ...formData, is_active: true })}
                    className="text-purple-600 focus:ring-purple-600"
                  />
                  Ativada
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="is_active" 
                    checked={formData.is_active === false}
                    onChange={() => setFormData({ ...formData, is_active: false })}
                    className="text-purple-600 focus:ring-purple-600"
                  />
                  Desativada
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ambiente</label>
              <select
                className="w-full h-10 border rounded-md px-3 text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                value={formData.environment}
                onChange={e => setFormData({ ...formData, environment: e.target.value as any })}
              >
                <option value="homologacao">Homologação (Testes)</option>
                <option value="producao">Produção</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Testar Conexão</h3>
            <p className="text-sm text-gray-500 mb-4">
              O Token Principal (Master) está configurado com segurança nas variáveis de ambiente do backend (`FOCUS_NFE_TOKEN`). 
              Você pode testar a conexão com a API clicando abaixo. Se quiser testar outro token temporariamente, cole-o aqui:
            </p>
            <div className="flex items-center gap-3">
              <Input 
                type="password" 
                placeholder="Deixe em branco para usar o token do ambiente" 
                className="max-w-md"
                value={testToken}
                onChange={e => setTestToken(e.target.value)}
              />
              <Button onClick={handleTestConnection} disabled={testStatus === 'testing'} variant="outline" className="gap-2">
                <Server className="w-4 h-4" />
                {testStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </div>
            
            {testStatus === 'success' && (
              <div className="mt-3 text-sm text-green-600 flex items-center gap-1.5 bg-green-50 px-3 py-2 rounded-md max-w-md border border-green-100">
                <CheckCircle2 className="w-4 h-4" /> {testMessage}
              </div>
            )}
            {testStatus === 'error' && (
              <div className="mt-3 text-sm text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-md max-w-md border border-red-100">
                <XCircle className="w-4 h-4" /> {testMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Regras de Sincronização</h2>
        </div>
        <div className="p-6 grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Automações</h3>
            
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.auto_register}
                onChange={e => setFormData({ ...formData, auto_register: e.target.checked })}
                className="mt-1 rounded text-purple-600 focus:ring-purple-600"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900">Cadastro Automático</span>
                <span className="block text-sm text-gray-500">Ao criar uma nova empresa no SL.Stock, cadastrá-la automaticamente na Focus NFe.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.auto_sync}
                onChange={e => setFormData({ ...formData, auto_sync: e.target.checked })}
                className="mt-1 rounded text-purple-600 focus:ring-purple-600"
              />
              <div>
                <span className="block text-sm font-medium text-gray-900">Sincronização de Alterações</span>
                <span className="block text-sm text-gray-500">Sincronizar automaticamente quando os dados cadastrais da empresa forem alterados.</span>
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Habilitações Padrão na Focus</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.enable_nfe} onChange={e => setFormData({ ...formData, enable_nfe: e.target.checked })} className="rounded text-purple-600" />
                <span className="text-sm text-gray-700">Habilitar NF-e</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.enable_nfce} onChange={e => setFormData({ ...formData, enable_nfce: e.target.checked })} className="rounded text-purple-600" />
                <span className="text-sm text-gray-700">Habilitar NFC-e</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.enable_nfse} onChange={e => setFormData({ ...formData, enable_nfse: e.target.checked })} className="rounded text-purple-600" />
                <span className="text-sm text-gray-700">Habilitar NFS-e</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.enable_receive_nfe} onChange={e => setFormData({ ...formData, enable_receive_nfe: e.target.checked })} className="rounded text-purple-600" />
                <span className="text-sm text-gray-700">Recebimento NF-e</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.enable_receive_cte} onChange={e => setFormData({ ...formData, enable_receive_cte: e.target.checked })} className="rounded text-purple-600" />
                <span className="text-sm text-gray-700">Recebimento CT-e</span>
              </label>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-purple-600 hover:bg-purple-700 gap-2 text-white">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  )
}
