import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Plus, Edit2, Trash2, Building2, UploadCloud } from 'lucide-react'
import Papa from 'papaparse'
import { customersApi } from '@/api/customers'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'

export default function CustomersList() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor'
  const [isImporting, setIsImporting] = useState(false)

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers
  })

  const deleteMutation = useMutation({
    mutationFn: customersApi.deleteCustomer,
    onSuccess: () => {
      toast.success('Cliente removido com sucesso')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (e: any) => {
      toast.error(`Erro ao remover cliente: ${e.message}`)
    }
  })

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir o cliente "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const importMutation = useMutation({
    mutationFn: customersApi.bulkCreateCustomers,
    onSuccess: () => {
      toast.success('Clientes importados com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsImporting(false)
    },
    onError: (e: any) => {
      toast.error(`Erro ao importar: ${e.message}`)
      setIsImporting(false)
    }
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const payload = results.data.map((row: any) => ({
            nickname: row['Apelido'] || '',
            fantasy_name: row['Nome fantasia'] || '',
            legal_name: row['Razão social/Nome'] || '',
            document: row['CNPJ/CPF'] || '',
            document_type: ((row['CNPJ/CPF'] || '').length > 14 ? 'CNPJ' : 'CPF') as 'CNPJ' | 'CPF',
            phone1: row['Telefone 1'] || '',
            address: row['Endereço'] || '',
            number: row['Núm.'] || '',
            complement: row['Complemento'] || '',
            neighborhood: row['Bairro'] || '',
            cep: row['CEP'] || '',
            city: row['Município'] || '',
            state: row['UF'] || '',
            region: row['Região'] || '',
            email: row['Email'] || '',
            sales_rep: row['Representante/ vendedor'] || '',
            active: true
          }))
          
          if (payload.length === 0) {
            toast.error('O arquivo parece estar vazio ou no formato incorreto.')
            setIsImporting(false)
            return
          }

          importMutation.mutate(payload)
        } catch (e: any) {
          toast.error('Erro ao ler a planilha. Verifique o formato.')
          setIsImporting(false)
        }
      },
      error: (e) => {
        toast.error(`Erro ao processar arquivo: ${e.message}`)
        setIsImporting(false)
      }
    })
  }

  const filteredCustomers = customers.filter(c => {
    const s = searchTerm.toLowerCase()
    return (
      (c.nickname || '').toLowerCase().includes(s) ||
      (c.fantasy_name || '').toLowerCase().includes(s) ||
      (c.legal_name || '').toLowerCase().includes(s) ||
      (c.document || '').includes(s) ||
      (c.city || '').toLowerCase().includes(s)
    )
  })

  if (!isManager) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito a gestores e administradores.</div>
  }

  return (
    <div className="space-y-6 slide-in max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Clientes
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie a base de clientes (CRM).</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <label className="cursor-pointer">
            <Button type="button" variant="outline" className="w-full sm:w-auto shadow-sm" disabled={isImporting} onClick={() => document.getElementById('csv-upload')?.click()}>
              <UploadCloud className="mr-2 h-4 w-4" /> 
              {isImporting ? 'Importando...' : 'Importar CSV'}
            </Button>
            <Input 
              id="csv-upload"
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isImporting}
            />
          </label>
          <Link to="/cadastros/clientes/novo" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </Link>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, apelido, CNPJ/CPF ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-background/50 border-border/50 focus:bg-background transition-colors"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Apelido / Fantasia</th>
                <th className="px-4 py-3 font-medium">Razão Social</th>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Cidade/UF</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando clientes...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        customer.active 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {customer.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{customer.nickname || '-'}</div>
                      <div className="text-xs text-muted-foreground">{customer.fantasy_name || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.legal_name || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{customer.document || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.city ? `${customer.city}${customer.state ? `/${customer.state}` : ''}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Link to={`/cadastros/clientes/${customer.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(customer.id, customer.nickname || customer.fantasy_name || '')}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between items-center bg-muted/20">
          <span>Total: <strong>{filteredCustomers.length}</strong> clientes</span>
          <span>{customers.length} na base</span>
        </div>
      </div>
    </div>
  )
}
