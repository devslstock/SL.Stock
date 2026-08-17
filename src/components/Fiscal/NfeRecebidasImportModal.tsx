import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { focusIntegrationApi } from '@/api/focusIntegration'
import { parseNfeXml, NfeParsed } from '@/utils/xmlParser'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { Loader2, FileCheck, AlertTriangle } from 'lucide-react'

interface NfeRecebidasImportModalProps {
  isOpen: boolean
  onClose: () => void
  chaveNfe: string | null
}

export function NfeRecebidasImportModal({ isOpen, onClose, chaveNfe }: NfeRecebidasImportModalProps) {
  const { currentCompany } = useAuth()
  const queryClient = useQueryClient()
  const [parsedData, setParsedData] = useState<NfeParsed | null>(null)
  
  // BAIXAR XML MUTATION
  const baixarXmlMutation = useMutation({
    mutationFn: async () => {
      if (!chaveNfe) throw new Error('Chave não informada')
      // 1. Download XML from Focus
      const { xml } = await focusIntegrationApi.baixarXmlRecebido(chaveNfe)
      if (!xml) throw new Error('XML não retornado pela Focus')

      // 2. Parse XML
      const nfe = parseNfeXml(xml)
      if (!nfe) throw new Error('Falha ao processar o conteúdo do XML')

      // 3. Update DB with XML string (Optional for audit/cache)
      await supabase
        .from('nfe_recebidas')
        .update({ xml_content: xml })
        .eq('company_id', currentCompany?.id)
        .eq('chave_nfe', chaveNfe)

      setParsedData(nfe)
      return nfe
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao baixar XML',
        description: error.message,
        variant: 'destructive',
      })
      onClose()
    }
  })

  // IMPORT TO SYSTEM MUTATION
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsedData || !currentCompany?.id) throw new Error('Dados não disponíveis')
      
      // THIS IS WHERE WE MAP TO SYSTEM:
      // In a real scenario we would:
      // 1. Find or create products by EAN/Name
      // 2. Insert into stock_movements (tipo='entrada', origem='xml')
      // 3. Create accounts payable in financial_transactions from parsedData.faturas

      // For now, we just mark it as imported to conclude the flow
      const { error } = await supabase
        .from('nfe_recebidas')
        .update({ status_importacao: 'importada' })
        .eq('company_id', currentCompany.id)
        .eq('chave_nfe', chaveNfe)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      toast({ title: 'Nota fiscal importada com sucesso!' })
      queryClient.invalidateQueries({ queryKey: ['nfe-recebidas'] })
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao importar',
        description: error.message,
        variant: 'destructive',
      })
    }
  })

  // Start download when modal opens
  if (isOpen && chaveNfe && !parsedData && !baixarXmlMutation.isPending && !baixarXmlMutation.isError) {
    baixarXmlMutation.mutate()
  }

  const handleClose = () => {
    setParsedData(null)
    baixarXmlMutation.reset()
    importMutation.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Importação de XML - Entrada de Mercadorias
          </DialogTitle>
          <DialogDescription>
            {chaveNfe}
          </DialogDescription>
        </DialogHeader>

        {baixarXmlMutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Baixando e processando XML da SEFAZ...</p>
          </div>
        ) : parsedData ? (
          <div className="space-y-6 mt-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md flex gap-3 text-sm text-blue-900">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold">Resumo da Importação</p>
                <p>Verifique os dados abaixo antes de confirmar a entrada no estoque e financeiro.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Fornecedor</span>
                <span className="font-medium text-gray-900">{parsedData.emitente.razaoSocial}</span>
              </div>
              <div>
                <span className="text-gray-500 block">CNPJ</span>
                <span className="font-medium text-gray-900">{parsedData.emitente.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Valor Total</span>
                <span className="font-medium text-emerald-600 text-lg">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsedData.totais.valorNota)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Faturas (Contas a Pagar)</span>
                <span className="font-medium text-gray-900">{parsedData.faturas.length} parcela(s)</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Produtos Encontrados ({parsedData.produtos.length})</h4>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-medium">Código</th>
                      <th className="px-4 py-2 font-medium">Descrição</th>
                      <th className="px-4 py-2 font-medium text-right">Qtd</th>
                      <th className="px-4 py-2 font-medium text-right">V. Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {parsedData.produtos.map((p, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-gray-500">{p.codigo}</td>
                        <td className="px-4 py-2 text-gray-900 truncate max-w-[200px]" title={p.descricao}>{p.descricao}</td>
                        <td className="px-4 py-2 text-right">{p.quantidade} {p.unidade}</td>
                        <td className="px-4 py-2 text-right">R$ {p.valorUnitario.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button 
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar Importação
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
