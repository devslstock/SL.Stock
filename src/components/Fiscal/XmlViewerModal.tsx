import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Download, XCircle } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { downloadOrShareFile } from '@/utils/fileDownloader'

interface XmlViewerModalProps {
  isOpen: boolean
  onClose: () => void
  xmlString: string | null
  filename?: string
}

export function XmlViewerModal({ isOpen, onClose, xmlString, filename = 'nota_fiscal.xml' }: XmlViewerModalProps) {
  
  const handleCopy = () => {
    if (!xmlString) return;
    navigator.clipboard.writeText(xmlString).then(() => {
      toast.success('XML copiado para a área de transferência!');
    }).catch(() => {
      toast.error('Erro ao copiar XML.');
    });
  }

  const handleDownload = async () => {
    if (!xmlString) return;
    const blob = new Blob([xmlString], { type: 'application/xml' });
    await downloadOrShareFile(blob, filename);
  }

  // Basic pretty print for XML if it's minified
  const formatXml = (xml: string) => {
    let formatted = '';
    let pad = 0;
    xml.split(/>\s*</).forEach((node, index) => {
      if (node.match(/^\/\w/)) pad -= 1;
      let padding = '';
      for (let i = 0; i < pad; i++) padding += '  ';
      formatted += padding + '<' + node + '>\r\n';
      if (node.match(/^<?\w[^>]*[^\/]$/)) pad += 1;
    });
    // Remove the extra < and > added by split
    return formatted.substring(1, formatted.length - 3);
  }

  const displayXml = xmlString ? (xmlString.includes('\n') ? xmlString : formatXml(xmlString)) : 'XML não disponível';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] md:max-w-4xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden bg-gray-50 border-none rounded-xl">
        <DialogHeader className="p-4 bg-white border-b flex-shrink-0 flex flex-row items-center justify-between shadow-sm z-10 rounded-t-xl">
          <DialogTitle className="text-xl font-bold text-gray-800">Visualizador de XML</DialogTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 shadow-sm" onClick={handleCopy} disabled={!xmlString}>
              <Copy className="h-4 w-4 mr-2" /> Copiar
            </Button>
            <Button variant="outline" size="sm" className="h-8 shadow-sm text-primary border-primary/20 hover:bg-primary/5" onClick={handleDownload} disabled={!xmlString}>
              <Download className="h-4 w-4 mr-2" /> Baixar
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2" onClick={onClose} aria-label="Fechar">
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 bg-gray-900 text-gray-100 font-mono text-xs sm:text-sm">
          <pre className="whitespace-pre-wrap break-all">
            <code>{displayXml}</code>
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
