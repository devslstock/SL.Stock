import { Button } from './button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = ''
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 ${className}`}>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Exibindo itens {startItem} - {endItem} de {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <Button 
          variant="outline" size="icon" className="h-8 w-8"
          onClick={() => onPageChange(1)} disabled={currentPage === 1}
        >
          <span className="sr-only">Primeira</span>
          <span className="text-xs font-bold">|&lt;</span>
        </Button>
        <Button 
          variant="outline" size="icon" className="h-8 w-8"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="px-3 text-sm font-medium whitespace-nowrap">
          {currentPage} de {totalPages || 1}
        </span>

        <Button 
          variant="outline" size="icon" className="h-8 w-8"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" size="icon" className="h-8 w-8"
          onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
        >
          <span className="sr-only">Última</span>
          <span className="text-xs font-bold">&gt;|</span>
        </Button>
      </div>
    </div>
  )
}
