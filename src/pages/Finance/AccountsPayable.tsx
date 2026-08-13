import { Card, CardContent } from '@/components/ui/card'
import { Banknote, Clock } from 'lucide-react'

export default function AccountsPayable() {
  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md border-border shadow-sm text-center p-8 bg-card">
        <CardContent className="pt-6 flex flex-col items-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Banknote className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Contas a Pagar</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            Em breve! Estamos desenvolvendo este módulo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
