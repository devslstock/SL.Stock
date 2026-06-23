import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Helper para buscar todos os registros de uma tabela, ignorando o limite padrão de 1000 do Supabase.
 * @param queryBuilder Uma query do Supabase (ex: supabase.from('table').select('*').order('name'))
 */
export async function fetchAllRows<T = any>(queryBuilder: any, limitPerPage = 1000): Promise<T[]> {
  let allData: T[] = []
  let from = 0
  let to = limitPerPage - 1

  while (true) {
    // A cada iteração aplicamos o range na query original
    const { data, error } = await queryBuilder.range(from, to)
    if (error) throw error
    if (!data || data.length === 0) break
    
    allData = [...allData, ...data]
    
    if (data.length < limitPerPage) break
    
    from += limitPerPage
    to += limitPerPage
  }

  return allData
}
