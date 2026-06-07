import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlanGuardProps {
  children: React.ReactNode
  requiredPlan: 'basico' | 'profissional' | 'enterprise'
}

export function PlanGuard({ children, requiredPlan }: PlanGuardProps) {
  const { company } = useAuth()
  
  if (!company) return null

  const plan = company.plan || 'enterprise'

  let isAllowed = true
  if (requiredPlan === 'profissional' && plan === 'basico') isAllowed = false
  if (requiredPlan === 'enterprise' && plan !== 'enterprise') isAllowed = false

  if (!isAllowed) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 slide-in">
        <div className="max-w-md w-full text-center space-y-6 bg-card/50 backdrop-blur-md border border-border p-8 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Recurso Premium</h2>
            <p className="text-muted-foreground">
              Esta funcionalidade é exclusiva para assinantes do plano <strong>{requiredPlan === 'enterprise' ? 'Enterprise' : 'Profissional'}</strong>.
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-sm text-left">
            <h3 className="font-semibold mb-2">Por que fazer o upgrade?</h3>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              {requiredPlan === 'profissional' && (
                <>
                  <li>Módulo completo de Expedição e Cargas</li>
                  <li>Controle de conferência na saída</li>
                  <li>Montagem de Romaneios avançados</li>
                </>
              )}
              {requiredPlan === 'enterprise' && (
                <>
                  <li>Aplicativo exclusivo para Motoristas</li>
                  <li>Assinatura digital na tela do celular</li>
                  <li>Comprovantes (POD) gerados em PDF</li>
                  <li>Acompanhamento em tempo real das entregas</li>
                </>
              )}
            </ul>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold h-12 text-lg shadow-lg shadow-purple-500/25"
            onClick={() => window.open('https://api.whatsapp.com/send?phone=559999999999&text=Ol%C3%A1!%20Gostaria%20de%20fazer%20o%20upgrade%20do%20meu%20plano%20no%20Estoque%20F%C3%A1cil.', '_blank')}
          >
            Falar com o Comercial
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
