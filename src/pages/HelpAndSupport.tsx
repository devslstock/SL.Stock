import { useState, useMemo } from 'react';
import { HelpCircle, Mail, MessageCircle, Search, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FAQ_DATA, FAQ_CATEGORIES } from '@/data/faqData';
import type { FAQItem } from '@/data/faqData';

// Componente simples de Accordion
const FAQAccordion = ({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) => {
  return (
    <div className="border rounded-lg mb-3 overflow-hidden bg-card transition-all">
      <button 
        className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/30 focus:outline-none focus:bg-muted/30"
        onClick={onClick}
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t bg-muted/10 text-muted-foreground text-sm animate-in slide-in-from-top-2">
          {item.answer}
        </div>
      )}
    </div>
  );
};

export default function HelpAndSupport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todas as dúvidas');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const handleWhatsApp = () => {
    window.open('https://wa.me/message/O6LYT6ROKXS5C1', '_blank');
  };

  const handleEmail = () => {
    window.open('mailto:comercial.sl.stock@gmail.com', '_blank');
  };

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtragem dos dados
  const filteredData = useMemo(() => {
    return FAQ_DATA.filter(item => {
      // Filtro de Categoria
      const matchCategory = activeCategory === 'Todas as dúvidas' || item.category === activeCategory;
      
      // Filtro de Busca (ignorando case)
      const query = searchQuery.toLowerCase();
      const matchSearch = 
        !query || 
        item.question.toLowerCase().includes(query) || 
        (typeof item.answer === 'string' && item.answer.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query) ||
        item.tags.some(t => t.toLowerCase().includes(query));

      return matchCategory && matchSearch;
    });
  }, [searchQuery, activeCategory]);

  const commonQuestions = useMemo(() => {
    return FAQ_DATA.filter(item => item.isCommon).slice(0, 4);
  }, []);

  const isSearching = searchQuery.length > 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header e Busca */}
      <div className="text-center space-y-6 bg-card border rounded-2xl p-8 shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Tire suas dúvidas
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Encontre respostas rápidas para suas dúvidas sobre o SL.Stock.
          </p>
        </div>

        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="text"
            placeholder="O que você está procurando?" 
            className="w-full pl-12 h-14 text-lg rounded-full border-2 focus-visible:ring-primary shadow-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Quando começa a pesquisar, reseta a categoria para procurar em tudo
              if (e.target.value && activeCategory !== 'Todas as dúvidas') {
                setActiveCategory('Todas as dúvidas');
              }
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navegação de Categorias (Sidebar) */}
        {!isSearching && (
          <div className="lg:col-span-1 space-y-2">
            <h2 className="font-semibold text-lg mb-4">Categorias</h2>
            <div className="flex flex-col gap-1">
              <Button
                variant={activeCategory === 'Todas as dúvidas' ? 'default' : 'ghost'}
                className="justify-start w-full"
                onClick={() => setActiveCategory('Todas as dúvidas')}
              >
                Todas as dúvidas
              </Button>
              {FAQ_CATEGORIES.map(category => (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'ghost'}
                  className="justify-start w-full text-left"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo Principal (FAQ) */}
        <div className={isSearching ? "lg:col-span-4 space-y-6" : "lg:col-span-3 space-y-8"}>
          
          {/* Seção: Resultados da Busca ou Categoria Selecionada */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {isSearching ? 'Resultados da busca' : activeCategory}
                {filteredData.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{filteredData.length}</Badge>
                )}
              </h2>
            </div>

            {filteredData.length > 0 ? (
              <div className="space-y-1">
                {filteredData.map(item => (
                  <FAQAccordion 
                    key={item.id} 
                    item={item} 
                    isOpen={!!openItems[item.id]} 
                    onClick={() => toggleItem(item.id)} 
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed bg-muted/10">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">Não encontramos uma resposta para sua busca.</h3>
                    <p className="text-muted-foreground">Tente pesquisar por outro termo ou entre em contato com nosso suporte.</p>
                  </div>
                  <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4">
                    Limpar pesquisa
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Seção: Dúvidas Mais Comuns (Só aparece se não estiver pesquisando e estiver em "Todas as dúvidas") */}
          {!isSearching && activeCategory === 'Todas as dúvidas' && (
            <div className="pt-6 border-t">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-primary" />
                Dúvidas mais comuns
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {commonQuestions.map(item => (
                  <Card key={item.id} className="hover:border-primary/50 cursor-pointer transition-colors" onClick={() => {
                    setActiveCategory(item.category);
                    setOpenItems(prev => ({ ...prev, [item.id]: true }));
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base flex items-start gap-2 leading-tight">
                        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                        {item.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {typeof item.answer === 'string' ? item.answer : 'Clique para ver a resposta completa...'}
                      </p>
                      <div className="mt-3">
                        <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Suporte / Contato Direto */}
      <div className="mt-12 pt-8 border-t">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Ainda precisa de ajuda?</h2>
          <p className="text-muted-foreground mt-2">
            Nossa equipe pode ajudar você.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Button 
            onClick={handleWhatsApp} 
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-2 h-14 text-lg shadow-sm"
          >
            <MessageCircle className="h-6 w-6" />
            Falar com o suporte
          </Button>
          
          <Button 
            onClick={handleEmail}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-14 text-lg hover:bg-primary/5 shadow-sm"
          >
            <Mail className="h-6 w-6" />
            Enviar E-mail
          </Button>
        </div>
      </div>
    </div>
  );
}
