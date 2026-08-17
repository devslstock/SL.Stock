export interface NfeProdutoParsed {
  codigo: string
  ean: string
  descricao: string
  ncm: string
  cfop: string
  unidade: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

export interface NfeFaturaParsed {
  numero: string
  vencimento: string
  valor: number
}

export interface NfeParsed {
  chave: string
  emitente: {
    cnpj: string
    razaoSocial: string
    fantasia?: string
  }
  destinatario: {
    cnpj: string
    razaoSocial: string
  }
  produtos: NfeProdutoParsed[]
  faturas: NfeFaturaParsed[]
  totais: {
    valorProdutos: number
    valorNota: number
  }
}

export function parseNfeXml(xmlString: string): NfeParsed | null {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, "text/xml")

    // Check for parsing errors
    const errorNode = xmlDoc.querySelector("parsererror")
    if (errorNode) {
      console.error("Erro ao fazer parse do XML:", errorNode.textContent)
      return null
    }

    const getText = (node: Element | Document, selector: string) => node.querySelector(selector)?.textContent || ''
    
    // NFe or nfeProc
    const nfeNode = xmlDoc.querySelector("NFe") || xmlDoc.querySelector("nfeProc")
    if (!nfeNode) return null

    const infNFe = nfeNode.querySelector("infNFe")
    if (!infNFe) return null

    const chave = infNFe.getAttribute("Id")?.replace("NFe", "") || ""

    // Emitente
    const emit = infNFe.querySelector("emit")
    const emitente = {
      cnpj: getText(emit!, "CNPJ"),
      razaoSocial: getText(emit!, "xNome"),
      fantasia: getText(emit!, "xFant")
    }

    // Destinatario
    const dest = infNFe.querySelector("dest")
    const destinatario = {
      cnpj: getText(dest!, "CNPJ"),
      razaoSocial: getText(dest!, "xNome")
    }

    // Produtos
    const detNodes = infNFe.querySelectorAll("det")
    const produtos: NfeProdutoParsed[] = Array.from(detNodes).map(det => {
      const prod = det.querySelector("prod")!
      return {
        codigo: getText(prod, "cProd"),
        ean: getText(prod, "cEAN"),
        descricao: getText(prod, "xProd"),
        ncm: getText(prod, "NCM"),
        cfop: getText(prod, "CFOP"),
        unidade: getText(prod, "uCom"),
        quantidade: parseFloat(getText(prod, "qCom")) || 0,
        valorUnitario: parseFloat(getText(prod, "vUnCom")) || 0,
        valorTotal: parseFloat(getText(prod, "vProd")) || 0,
      }
    })

    // Totais
    const total = infNFe.querySelector("total ICMSTot")
    const totais = {
      valorProdutos: parseFloat(getText(total!, "vProd")) || 0,
      valorNota: parseFloat(getText(total!, "vNF")) || 0
    }

    // Cobrança (Faturas/Duplicatas)
    const cobr = infNFe.querySelector("cobr")
    const faturas: NfeFaturaParsed[] = []
    if (cobr) {
      const dupNodes = cobr.querySelectorAll("dup")
      dupNodes.forEach(dup => {
        faturas.push({
          numero: getText(dup, "nDup"),
          vencimento: getText(dup, "dVenc"), // YYYY-MM-DD
          valor: parseFloat(getText(dup, "vDup")) || 0
        })
      })
    }

    return {
      chave,
      emitente,
      destinatario,
      produtos,
      faturas,
      totais
    }
  } catch (error) {
    console.error("Erro no parser de XML NFe:", error)
    return null
  }
}
