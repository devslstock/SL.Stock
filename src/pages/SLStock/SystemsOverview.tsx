import { useEffect } from 'react'
import { Boxes, Truck, Briefcase, ClipboardList, CheckCircle2, MessageCircle, Mail, Sparkles, LayoutGrid, Activity, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Logotipo em SVG codificado diretamente para corresponder à imagem fornecida pela SL.Stock
function SLStockLogo({ className = "h-16" }: { className?: string }) {
  const handleLogoClick = () => {
    window.open('https://slstock.com', '_blank')
  }

  return (
    <div 
      onClick={handleLogoClick} 
      className={`flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity ${className}`}
      title="Visitar slstock.com"
    >
      {/* Ícone SVG estruturado idêntico ao logotipo real */}
      <svg viewBox="0 0 150 120" className="w-16 h-16 shrink-0 filter drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoS" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
          <linearGradient id="logoS_Dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="logoL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        
        {/* O 'S' estilizado */}
        <path 
          className="fill-current text-[#0F172A] dark:hidden"
          d="M 28.3 19.3 C 28.3 19.3 47.9 19.3 64.9 19.3 C 74.9 19.3 84.7 19.3 94.2 19.3 C 95.8 19.3 97.2 20.3 97.7 21.8 L 99.4 27.2 C 100.1 29.3 98.5 31.4 96.3 31.4 H 56.4 C 47.5 31.4 43.1 33.7 43.1 39.5 C 43.1 44.8 48.0 46.9 57.0 48.9 C 71.9 52.2 99.3 54.1 99.3 75.3 C 99.3 90.9 83.1 94.6 63.8 94.6 C 45.4 94.6 25.1 94.6 15.3 94.6 C 13.7 94.6 12.3 93.6 11.8 92.1 L 10.1 86.7 C 9.4 84.6 11.0 82.5 13.2 82.5 C 23.0 82.5 45.4 82.5 56.1 82.5 C 65.5 82.5 70.2 80.3 70.2 74.8 C 70.2 69.1 65.2 67.2 55.4 65.1 C 41.5 62.1 11.8 59.5 11.8 38.6 C 11.8 23.3 22.3 19.3 28.3 19.3 Z" 
          fill="url(#logoS)"
        />
        <path 
          className="fill-current text-white hidden dark:block"
          d="M 28.3 19.3 C 28.3 19.3 47.9 19.3 64.9 19.3 C 74.9 19.3 84.7 19.3 94.2 19.3 C 95.8 19.3 97.2 20.3 97.7 21.8 L 99.4 27.2 C 100.1 29.3 98.5 31.4 96.3 31.4 H 56.4 C 47.5 31.4 43.1 33.7 43.1 39.5 C 43.1 44.8 48.0 46.9 57.0 48.9 C 71.9 52.2 99.3 54.1 99.3 75.3 C 99.3 90.9 83.1 94.6 63.8 94.6 C 45.4 94.6 25.1 94.6 15.3 94.6 C 13.7 94.6 12.3 93.6 11.8 92.1 L 10.1 86.7 C 9.4 84.6 11.0 82.5 13.2 82.5 C 23.0 82.5 45.4 82.5 56.1 82.5 C 65.5 82.5 70.2 80.3 70.2 74.8 C 70.2 69.1 65.2 67.2 55.4 65.1 C 41.5 62.1 11.8 59.5 11.8 38.6 C 11.8 23.3 22.3 19.3 28.3 19.3 Z" 
          fill="url(#logoS_Dark)"
        />
        
        {/* O 'L' estilizado e inclinado sobrepondo a cauda do 'S' */}
        <path 
          d="M 68 28 L 81 76 H 105 L 101 88 H 71 L 55 28 H 68 Z" 
          fill="url(#logoL)"
        />
      </svg>

      {/* Nome SL.Stock formatado em conformidade com o logotipo */}
      <div className="flex flex-col select-none font-poppins">
        <div className="flex items-baseline leading-none">
          <span className="text-[32px] font-extrabold tracking-tight text-[#0F172A] dark:text-white">
            SL.
          </span>
          <span className="text-[32px] font-extrabold italic tracking-tight text-[#2563EB]">
            Stock
          </span>
        </div>
        <span className="text-[8px] font-bold tracking-[0.25em] text-[#0F172A]/70 dark:text-slate-400 mt-1">
          SMART LOGISTICS STOCK
        </span>
      </div>
    </div>
  )
}

export default function SystemsOverview() {
  // Carrega fontes modernas do Google Fonts dinamicamente
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Montserrat:wght@400;600;800&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  const handleWhatsApp = () => {
    window.open('https://wa.me/5573999476822', '_blank')
  }

  const handleEmail = () => {
    window.open('mailto:comercial.sl.stock@gmail.com', '_blank')
  }

  const systems = [
    {
      title: 'SL.Stock Coletor',
      subtitle: 'WMS & Logística de Expedição',
      description: 'Sistema completo de controle de armazenagem, separação de cargas e conferência de inventários. Elimine perdas operacionais usando bipagem de códigos de barra e conferência cega.',
      icon: Boxes,
      badge: 'Ativo',
      badgeVariant: 'success' as const,
      color: 'from-[#2563EB]/10 to-[#2563EB]/20 text-[#2563EB] border-[#2563EB]/25',
      features: [
        'Conferência cega e bipagem de carga por código de barras',
        'Inventários rotativos planejados e avulsos',
        'Recebimento de mercadorias com conferência de fornecedores',
        'Histórico completo de movimentação de produtos'
      ],
      target: 'Equipe de Expedição, Conferentes e Operadores de Estoque'
    },
    {
      title: 'SL.Stock Entregas',
      subtitle: 'Aplicativo do Motorista (Last Mile)',
      description: 'Acompanhe as rotas de entrega e de devolução em tempo real. Comprove entregas de forma digital com assinaturas eletrônicas e fotos dos canhotos diretamente pelo aplicativo.',
      icon: Truck,
      badge: 'Ativo',
      badgeVariant: 'success' as const,
      color: 'from-emerald-500/10 to-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
      features: [
        'Roteirização inteligente e lista de clientes por rota',
        'Assinatura digital do cliente na tela do celular',
        'Registro de fotos de comprovantes e localizadores GPS',
        'Módulo de retorno de rota com controle de sobras e devoluções'
      ],
      target: 'Motoristas, Ajudantes e Gestores de Logística'
    },
    {
      title: 'SL.Stock Força de Vendas',
      subtitle: 'CRM Comercial & Pedidos de Venda',
      description: 'Aplicativo robusto para representantes comerciais no campo. Visualize tabelas de preço customizadas, catálogo de produtos digital e histórico financeiro de clientes mesmo sem internet.',
      icon: Briefcase,
      badge: 'Disponível para Upgrade',
      badgeVariant: 'warning' as const,
      color: 'from-amber-500/10 to-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/25',
      features: [
        'Catálogo de produtos interativo com imagens e especificações',
        'Regras comerciais flexíveis e tabelas de preço personalizadas',
        'Definição de rotas e limite de crédito por cliente',
        'Envio rápido de pedidos e sincronização automática em background'
      ],
      target: 'Representantes de Vendas, Vendedores Externos e Equipe Comercial'
    },
    {
      title: 'SL.Stock Comodatos',
      subtitle: 'Gestão de Equipamentos e Ordens de Serviço',
      description: 'Controle o ciclo de vida e a localização de bens cedidos a clientes. Gerencie ordens de serviço de instalação, manutenção corretiva e preventiva, além do estoque de insumos e peças.',
      icon: ClipboardList,
      badge: 'Ativo',
      badgeVariant: 'success' as const,
      color: 'from-purple-500/10 to-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/25',
      features: [
        'Cadastro detalhado de equipamentos com número de série',
        'Abertura e controle de Ordens de Serviço para assistência técnica',
        'Solicitação de peças e insumos com fluxo de aprovação integrado',
        'Termos de comodato vinculados e histórico de manutenção por cliente'
      ],
      target: 'Técnicos de Manutenção, Gestores de Contrato e Suporte Técnico'
    }
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-poppins selection:bg-[#2563EB] selection:text-white">
      
      {/* Banner Principal com cores da SL.Stock */}
      <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-slate-800 bg-[#0F172A] p-6 md:p-12 shadow-xl text-white">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2563EB]/25 border border-[#2563EB]/50 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-[#2563EB] animate-pulse" />
            <span>Ecossistema Corporativo SL.Stock</span>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] font-montserrat">
              Sua operação logística e comercial integrada em um <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-blue-400">único ecossistema.</span>
            </h1>
            <p className="text-slate-300 text-md md:text-lg max-w-3xl leading-relaxed font-light">
              Este sistema pertence ao grupo <strong className="text-white font-semibold">SL.Stock</strong>. Desenvolvemos soluções com tecnologia de ponta para conectar com extrema acurácia e eficiência cada etapa do seu fluxo: da entrada de estoque ao last-mile. Visite nosso portal oficial em <a href="https://slstock.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors">slstock.com</a>.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              <span className="text-xs text-slate-300 font-medium">Confiança & Tecnologia</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              <span className="text-xs text-slate-300 font-medium">Inovação Integrada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-300 font-medium">Pronto para Operar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cabeçalho de Soluções */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB]/80 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] dark:text-white flex items-center gap-2.5 font-montserrat">
              <LayoutGrid className="h-6 w-6 text-[#2563EB]" />
              Sistemas Disponíveis
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Descubra os módulos SL.Stock que integram e automatizam sua cadeia logística.
            </p>
          </div>
          
          <div className="bg-[#E5E7EB]/50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-slate-800 self-start md:self-auto">
            <span className="text-xs font-semibold text-muted-foreground">Provedor Oficial: </span>
            <span className="text-xs font-extrabold text-[#0F172A] dark:text-white">SL.Stock Tech</span>
          </div>
        </div>

        {/* Grid de Soluções com Cores Customizadas */}
        <div className="grid md:grid-cols-2 gap-6">
          {systems.map((sys, idx) => {
            const Icon = sys.icon
            return (
              <Card key={idx} className="border-[#E5E7EB] dark:border-slate-850 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden group">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${sys.color} border shrink-0`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant={sys.badgeVariant} className="mt-1 font-semibold uppercase text-[10px]">
                      {sys.badge}
                    </Badge>
                  </div>
                  
                  <div>
                    <CardTitle className="text-xl font-extrabold text-[#0F172A] dark:text-white group-hover:text-[#2563EB] transition-colors flex items-center gap-1.5 font-montserrat">
                      {sys.title}
                      <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-300 text-[#2563EB]" />
                    </CardTitle>
                    <CardDescription className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 mt-0.5">
                      {sys.subtitle}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 flex-grow">
                  <p className="text-muted-foreground text-sm leading-relaxed font-light">
                    {sys.description}
                  </p>

                  <div className="space-y-3">
                    <span className="text-xs font-extrabold text-[#0F172A] dark:text-white uppercase tracking-wider">Recursos Principais:</span>
                    <ul className="space-y-2">
                      {sys.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4.5 w-4.5 text-[#2563EB] shrink-0 mt-0.5" />
                          <span className="font-light">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-[#E5E7EB] dark:border-slate-800">
                    <span className="text-xs text-muted-foreground block font-medium">
                      <strong className="text-[#0F172A] dark:text-slate-200">Operado por:</strong> {sys.target}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Fluxo de Operação Integrada */}
      <Card className="border-[#E5E7EB] dark:border-slate-850 shadow-sm overflow-hidden bg-gradient-to-br from-card to-slate-50 dark:to-slate-900/20">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2.5 font-montserrat">
              <Activity className="h-5 w-5 text-[#2563EB]" />
              Fluxo Logístico & Comercial Integrado
            </h3>
            <p className="text-muted-foreground text-sm">
              Cada transação se comunica diretamente para evitar redigitação e retrabalho operacional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pt-2">
            <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-background relative shadow-sm hover:border-[#2563EB] transition-colors">
              <span className="absolute top-3 right-3 text-2xl font-black text-[#2563EB]/15 font-montserrat">01</span>
              <h4 className="font-bold text-sm text-[#0F172A] dark:text-white">Venda de Campo</h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-light">Clientes e pedidos criados no app <strong>Força de Vendas</strong> alimentam a retaguarda imediatamente.</p>
            </div>
            
            <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-background relative shadow-sm hover:border-[#2563EB] transition-colors">
              <span className="absolute top-3 right-3 text-2xl font-black text-[#2563EB]/15 font-montserrat">02</span>
              <h4 className="font-bold text-sm text-[#0F172A] dark:text-white">Separação de Cargas</h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-light">O <strong>Coletor</strong> gera a lista de bipagem para que nenhum item saia com divergência do estoque.</p>
            </div>

            <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-background relative shadow-sm hover:border-[#2563EB] transition-colors">
              <span className="absolute top-3 right-3 text-2xl font-black text-[#2563EB]/15 font-montserrat">03</span>
              <h4 className="font-bold text-sm text-[#0F172A] dark:text-white">Confirmação Digital</h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-light">O motorista usa o app de <strong>Entregas</strong> para traçar rotas e registrar canhotos e assinaturas.</p>
            </div>

            <div className="p-5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-background relative shadow-sm hover:border-[#2563EB] transition-colors">
              <span className="absolute top-3 right-3 text-2xl font-black text-[#2563EB]/15 font-montserrat">04</span>
              <h4 className="font-bold text-sm text-[#0F172A] dark:text-white">Ciclo de Equipamentos</h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-light">Máquinas cedidas e ordens de serviço de insumos são gerenciadas no módulo <strong>Comodatos</strong>.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rodapé Branded SL.Stock */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-[#E5E7EB] dark:border-slate-800 bg-[#E5E7EB]/20 dark:bg-slate-900/40">
        <SLStockLogo />
        
        <div className="flex gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
          <Button 
            onClick={() => window.open('https://slstock.com', '_blank')}
            variant="outline"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold hover:bg-background rounded-xl border-[#E5E7EB] dark:border-slate-800 bg-transparent text-[#0F172A] dark:text-white"
          >
            Acessar Site Oficial
          </Button>

          <Button 
            onClick={handleWhatsApp} 
            className="flex-1 md:flex-none bg-[#2563EB] hover:bg-blue-700 text-white flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/10"
          >
            <MessageCircle className="h-4.5 w-4.5" />
            Contatar Comercial
          </Button>
          
          <Button 
            onClick={handleEmail}
            variant="outline"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold hover:bg-background rounded-xl border-[#E5E7EB] dark:border-slate-800 bg-transparent text-[#0F172A] dark:text-white"
          >
            <Mail className="h-4.5 w-4.5" />
            Suporte Técnico
          </Button>
        </div>
      </div>

    </div>
  )
}
