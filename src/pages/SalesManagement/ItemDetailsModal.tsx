import React, { useState, useEffect } from 'react'
import { X, Save, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ItemDetailsModalProps {
  item: any
  isOpen: boolean
  onClose: () => void
  onSave: (updatedItem: any) => void
}

export function ItemDetailsModal({ item, isOpen, onClose, onSave }: ItemDetailsModalProps) {
  const [formData, setFormData] = useState<any>({})
  const [openSections, setOpenSections] = useState({
    fiscal: true,
    impostos: true
  })

  useEffect(() => {
    if (item && isOpen) {
      setFormData({ ...item })
    }
  }, [item, isOpen])

  if (!isOpen || !item) return null

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-background w-full max-w-5xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b bg-muted/40">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            Item do pedido <span className="text-muted-foreground font-normal">#{item.product?.code || ''} - {item.product?.description || 'Produto'}</span>
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Header Info */}
          <div className="grid grid-cols-12 gap-3 pb-4 border-b">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Código</Label>
              <Input value={item.product?.code || ''} disabled className="h-8 bg-muted/30" />
            </div>
            <div className="col-span-6 space-y-1">
              <Label className="text-xs">Descrição</Label>
              <Input value={item.product?.description || ''} disabled className="h-8 bg-muted/30" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Quantidade</Label>
              <Input type="number" value={formData.quantity || 0} onChange={e => handleChange('quantity', Number(e.target.value))} className="h-8" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Valor Unitário</Label>
              <Input type="number" step="0.01" value={formData.unit_price || 0} onChange={e => handleChange('unit_price', Number(e.target.value))} className="h-8" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Desconto (%)</Label>
              <Input type="number" step="0.01" value={formData.discount_percent || 0} onChange={e => handleChange('discount_percent', Number(e.target.value))} className="h-8 text-red-600 font-medium" />
            </div>
          </div>

          {/* Dados Fiscais Section */}
          <div className="border rounded-md overflow-hidden">
            <button 
              className="w-full flex items-center p-2 bg-muted/50 hover:bg-muted/80 text-sm font-medium transition-colors"
              onClick={() => toggleSection('fiscal')}
            >
              {openSections.fiscal ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Dados Fiscais
            </button>
            
            {openSections.fiscal && (
              <div className="p-3 bg-card border-t grid grid-cols-12 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">NCM</Label>
                  <Input 
                    placeholder={item.product?.ncm || ''} 
                    value={formData.ncm || ''} 
                    onChange={e => handleChange('ncm', e.target.value)} 
                    className="h-8" 
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">CEST</Label>
                  <Input 
                    placeholder={item.product?.cest || ''} 
                    value={formData.cest || ''} 
                    onChange={e => handleChange('cest', e.target.value)} 
                    className="h-8" 
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Origem da Mercadoria</Label>
                  <Input 
                    placeholder={item.product?.origin || '0 - Nacional'} 
                    value={formData.origin || ''} 
                    onChange={e => handleChange('origin', e.target.value)} 
                    className="h-8" 
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">CFOP</Label>
                  <Input 
                    placeholder={item.product?.cfop || 'Ex: 5102'} 
                    value={formData.cfop || ''} 
                    onChange={e => handleChange('cfop', e.target.value)} 
                    className="h-8" 
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Operação Fiscal (CSOSN/CST)</Label>
                  <Input 
                    placeholder={item.product?.csosn || item.product?.cst || 'Ex: 101, 102, 500'} 
                    value={formData.csosn || ''} 
                    onChange={e => handleChange('csosn', e.target.value)} 
                    className="h-8" 
                  />
                </div>
                <div className="col-span-12 mt-2">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" /> Deixe em branco para usar o padrão do produto ou do cabeçalho da nota.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Impostos Section */}
          <div className="border rounded-md overflow-hidden">
            <button 
              className="w-full flex items-center p-2 bg-muted/50 hover:bg-muted/80 text-sm font-medium transition-colors"
              onClick={() => toggleSection('impostos')}
            >
              {openSections.impostos ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Impostos (Alíquotas)
            </button>
            
            {openSections.impostos && (
              <div className="p-0 bg-card border-t overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/30 text-xs border-b">
                    <tr>
                      <th className="p-2 font-semibold">Imposto</th>
                      <th className="p-2 font-semibold">CST/CSOSN Específico</th>
                      <th className="p-2 font-semibold">Alíquota (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-muted/20">
                      <td className="p-2 font-medium border-r bg-amber-50 dark:bg-amber-900/10">ICMS</td>
                      <td className="p-2">
                        <Input 
                          placeholder={item.product?.csosn || ''} 
                          value={formData.csosn || ''} 
                          onChange={e => handleChange('csosn', e.target.value)}
                          className="h-7 text-xs bg-transparent border-transparent hover:border-border focus:bg-background" 
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" step="0.01" 
                          placeholder={item.product?.icms_rate?.toString() || ''} 
                          value={formData.icms_rate || ''} 
                          onChange={e => handleChange('icms_rate', Number(e.target.value))}
                          className="h-7 text-xs bg-transparent border-transparent hover:border-border focus:bg-background" 
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-2 font-medium border-r">PIS</td>
                      <td className="p-2">
                        <Input 
                          placeholder={item.product?.pis_cst || ''} 
                          value={formData.pis_cst || ''} 
                          onChange={e => handleChange('pis_cst', e.target.value)}
                          className="h-7 text-xs bg-transparent border-transparent hover:border-border focus:bg-background" 
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" step="0.01" 
                          placeholder={item.product?.pis_rate?.toString() || ''} 
                          value={formData.pis_rate || ''} 
                          onChange={e => handleChange('pis_rate', Number(e.target.value))}
                          className="h-7 text-xs bg-transparent border-transparent hover:border-border focus:bg-background" 
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-2 font-medium border-r">COFINS</td>
                      <td className="p-2">
                        <Input 
                          placeholder={item.product?.cofins_cst || ''} 
                          value={formData.cofins_cst || ''} 
                          onChange={e => handleChange('cofins_cst', e.target.value)}
                          className="h-7 text-xs bg-transparent border-transparent hover:border-border focus:bg-background" 
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" step="0.01" 
                          placeholder={item.product?.cofins_rate?.toString() || ''} 
                          value={formData.cofins_rate || ''} 
                          onChange={e => handleChange('cofins_rate', Number(e.target.value))}
                          className="h-7 text-xs bg-transparent border-transparent hover:border-border focus:bg-background" 
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-2 font-medium border-r">IPI</td>
                      <td className="p-2 text-muted-foreground text-xs italic pl-4">Apenas Alíquota</td>
                      <td className="p-2">
                        <Input 
                          type="number" step="0.01" 
                          placeholder={item.product?.ipi_rate?.toString() || ''} 
                          value={formData.ipi_rate || ''} 
                          onChange={e => handleChange('ipi_rate', Number(e.target.value))}
                          className="h-7 text-xs bg-transparent border-transparent hover:border-border focus:bg-background" 
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/20 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="default" size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}
