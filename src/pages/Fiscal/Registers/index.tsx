import { Link } from 'react-router-dom'
import { FileText, Truck, Users, Settings, Plus, Tags, Hash, Calculator, Scale, Info, MapPin, Briefcase } from 'lucide-react'

const registers = [
  {
    title: 'Operações Fiscais',
    description: 'Gestão de CFOPs, alíquotas e natureza da operação.',
    icon: Settings,
    path: '/fiscal/cadastros/operacoes',
    ready: true
  },
  {
    title: 'Séries de Documentos Fiscais',
    description: 'Numeração e séries de NF-e, MDF-e, CT-e.',
    icon: Hash,
    path: '/fiscal/cadastros/series',
    ready: true
  },
  {
    title: 'Veículos',
    description: 'Cadastro de placas, RENAVAM e capacidades.',
    icon: Truck,
    path: '/fiscal/cadastros/veiculos',
    ready: true
  },
  {
    title: 'Condutores',
    description: 'Cadastro de motoristas e CNH para emissão de MDF-e.',
    icon: Users,
    path: '/fiscal/cadastros/condutores',
    ready: true
  },
  // Future placeholders
  { title: 'NCMs', description: 'Nomenclatura Comum do Mercosul', icon: Tags, path: '#', ready: false },
  { title: 'NBSs', description: 'Nomenclatura Brasileira de Serviços', icon: Briefcase, path: '#', ready: false },
  { title: 'Valores aproximados dos tributos', description: 'Carga tributária IBPT', icon: Calculator, path: '#', ready: false },
  { title: 'Alíquotas internas de ICMS', description: 'Configurações de ICMS por estado', icon: MapPin, path: '#', ready: false },
  { title: 'Reduções da base de cálculo', description: 'Reduções de ICMS', icon: Scale, path: '#', ready: false },
  { title: 'Informações Adicionais', description: 'Mensagens padrão para NFe', icon: Info, path: '#', ready: false },
]

export default function FiscalRegisters() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          Cadastros Fiscais
        </h1>
        <p className="text-muted-foreground mt-1">Gerencie tabelas, códigos e parâmetros necessários para emissões fiscais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registers.map((item, index) => (
          item.ready ? (
            <Link 
              key={index} 
              to={item.path}
              className="glass-card p-6 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-3 text-foreground font-semibold">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <item.icon className="h-6 w-6" />
                </div>
                {item.title}
              </div>
              <p className="text-sm text-muted-foreground flex-1">
                {item.description}
              </p>
            </Link>
          ) : (
            <div 
              key={index} 
              className="glass-card p-6 flex flex-col gap-3 opacity-60 cursor-not-allowed relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 text-[10px] uppercase font-bold bg-muted px-2 py-1 rounded">Em Breve</div>
              <div className="flex items-center gap-3 text-muted-foreground font-semibold">
                <div className="p-2 rounded-lg bg-muted">
                  <item.icon className="h-6 w-6" />
                </div>
                {item.title}
              </div>
              <p className="text-sm text-muted-foreground flex-1">
                {item.description}
              </p>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
