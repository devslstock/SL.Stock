import { useState } from 'react'
import { Server, Settings, Building2, TerminalSquare, AlertTriangle, CheckCircle2, Play } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { focusIntegrationApi } from '@/api/focusIntegration'
import { SettingsTab } from './SettingsTab'
import { CompaniesTab } from './CompaniesTab'
import { LogsTab } from './LogsTab'
import { OverviewTab } from './OverviewTab'
import { cn } from '@/lib/utils'

export default function SaaSFocusNfe() {
  const [activeTab, setActiveTab] = useState('overview')

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['focus_nfe_settings'],
    queryFn: () => focusIntegrationApi.getSettings()
  })

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Server },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'logs', label: 'Logs & Eventos', icon: TerminalSquare }
  ]

  if (isLoadingSettings) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
  }

  return (
    <div className="flex-1 h-screen overflow-auto bg-gray-50/50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Server className="h-6 w-6 text-purple-600" />
              Integração Focus NFe
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie a sincronização global de empresas entre o SL.Stock e a API da Focus NFe.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {settings?.is_active ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="w-4 h-4" /> Integração Ativa ({settings.environment})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                <AlertTriangle className="w-4 h-4" /> Integração Desativada
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mt-6 border-b">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative flex items-center gap-2",
                  activeTab === tab.id 
                    ? "text-purple-600" 
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'settings' && <SettingsTab initialSettings={settings} />}
          {activeTab === 'companies' && <CompaniesTab />}
          {activeTab === 'logs' && <LogsTab />}
        </div>
      </div>
    </div>
  )
}
