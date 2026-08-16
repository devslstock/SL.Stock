import React, { useState, useEffect } from 'react'
import { X, Save, ChevronDown, ChevronRight, Info, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ItemDetailsModalProps {
  item: any
  isOpen: boolean
  isEditable?: boolean
  hasNextItem?: boolean
  onClose: () => void
  onSave: (updatedItem: any) => void
  onSaveAndNext?: (updatedItem: any) => void
}

const PIS_COFINS_OPTIONS = [
  { value: "01", label: "01 - Operação tributável com alíquota básica" },
  { value: "02", label: "02 - Operação tributável com alíquota diferenciada" },
  { value: "03", label: "03 - Operação tributável com alíquota por unidade de medida de produto" },
  { value: "04", label: "04 - Operação tributável monofásica - revenda a alíquota zero" },
  { value: "05", label: "05 - Operação tributável por substituição tributária" },
  { value: "06", label: "06 - Operação tributável a alíquota zero" },
  { value: "07", label: "07 - Operação isenta da contribuição" },
  { value: "08", label: "08 - Operação sem incidência da contribuição" },
  { value: "09", label: "09 - Operação com suspensão da contribuição" },
  { value: "49", label: "49 - Outras operações de saída" },
  { value: "99", label: "99 - Outras operações" }
]

const ICMS_OPTIONS = [
  { value: "101", label: "101 - Tributada pelo simples nacional com permissão de crédito" },
  { value: "102", label: "102 - Tributada pelo simples nacional sem permissão de crédito" },
  { value: "103", label: "103 - Isenção do icms no simples nacional para faixa de receita bruta" },
  { value: "201", label: "201 - Tributada pelo simples nacional com permissão de crédito e com cobrança do icms por substituição tributária" },
  { value: "202", label: "202 - Tributada pelo simples nacional sem permissão de crédito e com cobrança do icms por substituição tributária" },
  { value: "203", label: "203 - Isenção do icms no simples nacional para faixa de receita bruta e com cobrança do icms por substituição tributária" },
  { value: "300", label: "300 - Imune" },
  { value: "400", label: "400 - Não tributada pelo simples nacional" },
  { value: "500", label: "500 - Icms cobrado anteriormente por substituição tributária (substituído) ou por antecipação" },
  { value: "900", label: "900 - Outros" }
]

export function ItemDetailsModal({ item, isOpen, isEditable = true, hasNextItem = false, onClose, onSave, onSaveAndNext }: ItemDetailsModalProps) {
  const [formData, setFormData] = useState<any>({})
  const [openSections, setOpenSections] = useState({
    fiscal: false,
    impostos: false
  })

  useEffect(() => {
    if (item && isOpen) {
      setFormData({ 
        ...item,
        cfop: item.cfop || item.product?.cfop || '',
        ncm: item.ncm || item.product?.ncm || '',
        cest: item.cest || item.product?.cest || '',
        csosn: item.csosn || item.product?.csosn || item.product?.cst || '',
        icms_rate: item.icms_rate !== undefined && item.icms_rate !== null ? item.icms_rate : (item.product?.icms_rate || ''),
        pis_cst: item.pis_cst || item.product?.pis_cst || '',
        pis_rate: item.pis_rate !== undefined && item.pis_rate !== null ? item.pis_rate : (item.product?.pis_rate || ''),
        cofins_cst: item.cofins_cst || item.product?.cofins_cst || '',
        cofins_rate: item.cofins_rate !== undefined && item.cofins_rate !== null ? item.cofins_rate : (item.product?.cofins_rate || ''),
        ipi_rate: item.ipi_rate !== undefined && item.ipi_rate !== null ? item.ipi_rate : (item.product?.ipi_rate || ''),
        origin: item.origin || item.product?.origin || '0'
      })
    }
  }, [item, isOpen])

  if (!isOpen || !item) return null

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev, [field]: value }
      if (['quantity', 'unit_price', 'discount_percent'].includes(field)) {
        const qty = parseFloat(updated.quantity) || 0;
        const price = parseFloat(updated.unit_price) || 0;
        const discount = parseFloat(updated.discount_percent) || 0;
        const subtotal = qty * price;
        updated.total_price = subtotal - (subtotal * (discount / 100));
        updated.net_price = updated.total_price;
      }
      return updated
    })
  }

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  const handleSaveAndNext = () => {
    if (onSaveAndNext) {
      onSaveAndNext(formData)
    }
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
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Main Info */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Quantidade</Label>
              <Input 
                type="number" 
                value={formData.quantity || 0} 
                onChange={e => handleChange('quantity', Number(e.target.value))} 
                disabled={!isEditable}
                className="h-8" 
              />
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Valor Unitário</Label>
              <Input 
                type="number" step="0.01" 
                value={formData.unit_price || 0} 
                onChange={e => handleChange('unit_price', Number(e.target.value))} 
                disabled={!isEditable}
                className="h-8" 
              />
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Desconto (%)</Label>
              <Input 
                type="number" step="0.01" 
                value={formData.discount_percent || 0} 
                onChange={e => handleChange('discount_percent', Number(e.target.value))} 
                disabled={!isEditable}
                className="h-8" 
              />
            </div>
            <div className="col-span-4 space-y-1">
              <Label className="text-xs font-bold text-emerald-600 dark:text-emerald-500">Valor Total</Label>
              <Input 
                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.total_price || 0)} 
                disabled 
                className="h-8 font-bold bg-emerald-50 dark:bg-emerald-950/20" 
              />
            </div>
          </div>

          {/* Fiscal Section */}
          <div className="border rounded-md overflow-hidden">
            <button 
              className="w-full flex items-center p-2 bg-muted/50 hover:bg-muted/80 text-sm font-medium transition-colors"
              onClick={() => toggleSection('fiscal')}
            >
              {openSections.fiscal ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Dados Fiscais Básicos
            </button>
            
            {openSections.fiscal && (
              <div className="p-4 grid grid-cols-12 gap-4 bg-card border-t">
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">NCM</Label>
                  <Input 
                    placeholder={item.product?.ncm || ''} 
                    value={formData.ncm || ''} 
                    onChange={e => handleChange('ncm', e.target.value)} 
                    disabled={!isEditable}
                    className="h-8" 
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">CEST</Label>
                  <Input 
                    placeholder={item.product?.cest || ''} 
                    value={formData.cest || ''} 
                    onChange={e => handleChange('cest', e.target.value)} 
                    disabled={!isEditable}
                    className="h-8" 
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Origem da Mercadoria</Label>
                  <Input 
                    placeholder={item.product?.origin || '0'} 
                    value={formData.origin || ''} 
                    onChange={e => handleChange('origin', e.target.value)} 
                    disabled={!isEditable}
                    className="h-8" 
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">CFOP</Label>
                  <Input 
                    placeholder={item.product?.cfop || 'Ex: 5102'} 
                    value={formData.cfop || ''} 
                    onChange={e => handleChange('cfop', e.target.value)} 
                    disabled={!isEditable}
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
              Impostos (CST/CSOSN e Alíquotas)
            </button>
            
            {openSections.impostos && (
              <div className="p-0 bg-card border-t overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/30 text-xs border-b">
                    <tr>
                      <th className="p-2 font-semibold w-24">Imposto</th>
                      <th className="p-2 font-semibold">CST/CSOSN Específico</th>
                      <th className="p-2 font-semibold w-32 text-right">Base de Cálculo</th>
                      <th className="p-2 font-semibold w-32">Alíquota (%)</th>
                      <th className="p-2 font-semibold w-32 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-muted/20">
                      <td className="p-2 font-medium border-r bg-amber-50 dark:bg-amber-900/10">ICMS</td>
                      <td className="p-2">
                        <select 
                          value={formData.csosn || ''} 
                          onChange={e => handleChange('csosn', e.target.value)}
                          disabled={!isEditable}
                          className="w-full h-8 px-2 text-xs bg-background border rounded-md"
                        >
                          <option value="">Padrão do Produto ({item.product?.csosn || item.product?.cst || 'N/A'})</option>
                          {ICMS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-right font-medium text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.total_price || 0)}
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" step="0.01" 
                          placeholder={item.product?.icms_rate?.toString() || ''} 
                          value={formData.icms_rate || ''} 
                          onChange={e => handleChange('icms_rate', e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={!isEditable}
                          className="h-8 text-xs bg-transparent border-border" 
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600 dark:text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(((formData.total_price || 0) * (Number(formData.icms_rate) || 0)) / 100)}
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-2 font-medium border-r">PIS</td>
                      <td className="p-2">
                        <select 
                          value={formData.pis_cst || ''} 
                          onChange={e => handleChange('pis_cst', e.target.value)}
                          disabled={!isEditable}
                          className="w-full h-8 px-2 text-xs bg-background border rounded-md"
                        >
                          <option value="">Padrão do Produto ({item.product?.pis_cst || 'N/A'})</option>
                          {PIS_COFINS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-right font-medium text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.total_price || 0)}
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" step="0.01" 
                          placeholder={item.product?.pis_rate?.toString() || ''} 
                          value={formData.pis_rate || ''} 
                          onChange={e => handleChange('pis_rate', e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={!isEditable}
                          className="h-8 text-xs bg-transparent border-border" 
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600 dark:text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(((formData.total_price || 0) * (Number(formData.pis_rate) || 0)) / 100)}
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-2 font-medium border-r">COFINS</td>
                      <td className="p-2">
                        <select 
                          value={formData.cofins_cst || ''} 
                          onChange={e => handleChange('cofins_cst', e.target.value)}
                          disabled={!isEditable}
                          className="w-full h-8 px-2 text-xs bg-background border rounded-md"
                        >
                          <option value="">Padrão do Produto ({item.product?.cofins_cst || 'N/A'})</option>
                          {PIS_COFINS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-right font-medium text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.total_price || 0)}
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" step="0.01" 
                          placeholder={item.product?.cofins_rate?.toString() || ''} 
                          value={formData.cofins_rate || ''} 
                          onChange={e => handleChange('cofins_rate', e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={!isEditable}
                          className="h-8 text-xs bg-transparent border-border" 
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600 dark:text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(((formData.total_price || 0) * (Number(formData.cofins_rate) || 0)) / 100)}
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-2 font-medium border-r">IPI</td>
                      <td className="p-2 text-muted-foreground text-xs italic pl-4">Apenas Alíquota</td>
                      <td className="p-2 text-right font-medium text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.total_price || 0)}
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" step="0.01" 
                          placeholder={item.product?.ipi_rate?.toString() || ''} 
                          value={formData.ipi_rate || ''} 
                          onChange={e => handleChange('ipi_rate', e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={!isEditable}
                          className="h-8 text-xs bg-transparent border-border" 
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600 dark:text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(((formData.total_price || 0) * (Number(formData.ipi_rate) || 0)) / 100)}
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
          
          {isEditable && (
            <>
              {hasNextItem && onSaveAndNext && (
                <Button variant="secondary" size="sm" onClick={handleSaveAndNext} className="font-medium">
                  Salvar e Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              <Button variant="default" size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
