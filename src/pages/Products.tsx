import { useState } from 'react'
import { mockProducts } from '@/data/mockData'
import type { Product } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toaster'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Upload,
  Archive,
  FileDown,
} from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isStockEntryOpen, setIsStockEntryOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const filtered = products.filter(p =>
    p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.external_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: Partial<Product> = {
      code: formData.get('code') as string,
      external_code: formData.get('external_code') as string,
      description: formData.get('description') as string,
      stock: Number(formData.get('stock')),
      group: formData.get('group') as string,
      batch: formData.get('batch') as string,
    }

    if (editingProduct) {
      setProducts(prev =>
        prev.map(p => p.id === editingProduct.id ? { ...p, ...data } as Product : p)
      )
      toast.success('Produto atualizado com sucesso')
    } else {
      const newProduct: Product = {
        id: `p${Date.now()}`,
        ...data,
        created_at: new Date().toISOString(),
      } as Product
      setProducts(prev => [...prev, newProduct])
      toast.success('Produto criado com sucesso')
    }
    setIsDialogOpen(false)
    setEditingProduct(null)
  }

  const handleDelete = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.info('Produto removido')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>, type: 'new' | 'stock') => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const lines = text.split('\n')
      let count = 0

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        let parts = trimmed.split(';')
        if (parts.length < 2) parts = trimmed.split(',')
        if (parts.length < 2) continue

        if (type === 'new') {
          const code = parts[0]?.trim()
          const ext = parts[1]?.trim()
          const desc = parts[2]?.trim()
          const group = parts[3]?.trim()
          const qty = parseInt(parts[4]?.trim() || '0')
          const batch = parts[5]?.trim()

          if (code && desc) {
            setProducts(prev => [...prev, {
              id: `imp${Date.now()}-${count}`,
              code,
              external_code: ext,
              description: desc,
              group,
              stock: qty,
              batch,
              created_at: new Date().toISOString(),
            }])
            count++
          }
        } else {
          const codeOrExt = parts[0]?.trim()
          const qtyToAdd = parseInt(parts[2]?.trim() || '0')
          if (codeOrExt && qtyToAdd) {
            setProducts(prev => prev.map(p => {
              if (p.code === codeOrExt || p.external_code === codeOrExt) {
                count++
                return { ...p, stock: (p.stock || 0) + qtyToAdd }
              }
              return p
            }))
          }
        }
      }

      toast.success(type === 'new' ? `${count} produtos importados!` : `${count} estoques atualizados!`)
      setIsImportOpen(false)
      setIsStockEntryOpen(false)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" /> Produtos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produtos cadastrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" /> Importar
          </Button>
          <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => setIsStockEntryOpen(true)}>
            <Archive className="h-4 w-4 mr-1.5" /> Entrada Estoque
          </Button>
          <Button size="sm" onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Novo Produto
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código ou descrição..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <FileDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">
                    <div className="text-foreground">{product.code}</div>
                    {product.external_code && (
                      <div className="text-xs text-muted-foreground">{product.external_code}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.description}</TableCell>
                  <TableCell>
                    {product.group && (
                      <Badge variant="secondary">{product.group}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.stock >= 10 ? 'success' : product.stock >= 3 ? 'warning' : 'destructive'}>
                      {product.stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingProduct(product); setIsDialogOpen(true); }}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingProduct(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código Interno *</Label>
                <Input id="code" name="code" defaultValue={editingProduct?.code} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="external_code">Cód. Externo</Label>
                <Input id="external_code" name="external_code" defaultValue={editingProduct?.external_code} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input id="description" name="description" defaultValue={editingProduct?.description} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="group">Grupo</Label>
                <Input id="group" name="group" defaultValue={editingProduct?.group} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch">Lote</Label>
                <Input id="batch" name="batch" defaultValue={editingProduct?.batch} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque Atual</Label>
              <Input type="number" id="stock" name="stock" defaultValue={editingProduct?.stock || 0} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Produtos (CSV)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Formato: Código; Cód. Externo; Descrição; Grupo; Qtd; Lote
            </p>
            <Input type="file" accept=".csv,.txt" onChange={(e) => handleImport(e, 'new')} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Entry Dialog */}
      <Dialog open={isStockEntryOpen} onOpenChange={setIsStockEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrada de Estoque (CSV)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Formato: Cód (ou Externo); Descrição (ignorada); Qtd a somar
            </p>
            <Input type="file" accept=".csv,.txt" onChange={(e) => handleImport(e, 'stock')} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
