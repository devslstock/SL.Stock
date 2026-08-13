export interface PaymentInstallment {
  installmentNumber: number
  days: number
  dueDate: Date
  amount: number
}

export function parsePaymentCondition(
  text: string, 
  defaultInterval: number, 
  baseDate: Date,
  totalAmount: number
): { installments: PaymentInstallment[], isValid: boolean, error?: string } {
  if (!text || !text.trim()) {
    return { installments: [], isValid: false, error: "Condição de pagamento vazia" }
  }

  const conditionStr = text.trim().toLowerCase()
  let daysArray: number[] = []

  // Regra 4: À vista
  if (
    conditionStr.includes('vista') || 
    conditionStr.includes('dinheiro') || 
    conditionStr.includes('pix')
  ) {
    daysArray = [0]
  }
  // Regras para sequências explícitas (Regra 1) ou parcelas (Regra 2) ou prazo único (Regra 3)
  else {
    // Tenta encontrar uma sequência usando delimitadores explícitos: ;, /, ou ,
    // Ex: "0; 7; 14; 28" ou "30/60/90" ou "30,60"
    if (/[;/,]/.test(conditionStr)) {
      const parts = conditionStr.split(/[;/,]/)
      
      let allValid = true
      const parsedDays = parts.map(p => {
        const num = parseInt(p.replace(/\D/g, ''), 10)
        if (isNaN(num)) allValid = false
        return num
      })

      if (allValid && parsedDays.length > 1) {
        daysArray = parsedDays
      }
    }

    if (daysArray.length === 0) {
      // Extrai todos os números
      const matches = conditionStr.match(/\d+/g)
      
      if (matches) {
        // Se há vários números mas não tinha os delimitadores explícitos, talvez seja algo estranho.
        // Vamos tentar verificar se é Regra 2 (Quantidade de parcelas) ex: "3x", "3 parcelas"
        const isInstallmentsFormat = /x|parcela|vezes/i.test(conditionStr)
        const isDaysFormat = /dia/i.test(conditionStr)

        if (matches.length === 1) {
          const num = parseInt(matches[0], 10)
          
          if (isInstallmentsFormat) {
            // Regra 2: "3x", "3 parcelas" -> usa o intervalo padrão
            const interval = defaultInterval > 0 ? defaultInterval : 30
            for (let i = 1; i <= num; i++) {
              daysArray.push(i * interval)
            }
          } else if (isDaysFormat || num > 12) {
            // Regra 3: "30 Dias" ou apenas "30"
            daysArray = [num]
          } else {
            // Se for apenas um número pequeno sem indicação, assumimos que é uma parcela para X dias.
            // O usuário pode querer dizer 1 parcela de 3 dias, ou 3 parcelas?
            // Para não quebrar o "30", mas ao mesmo tempo evitar ambiguidade com "3"
            daysArray = [num]
          }
        } else if (matches.length > 1) {
          // Ex: "30 60 90" com espaços
          daysArray = matches.map(n => parseInt(n, 10))
        }
      }
    }
  }

  if (daysArray.length === 0) {
    return { 
      installments: [], 
      isValid: false, 
      error: "Não foi possível interpretar a condição de pagamento. Verifique o formato informado." 
    }
  }

  // Gera as parcelas
  const amountPerInstallment = totalAmount / daysArray.length
  
  const installments: PaymentInstallment[] = daysArray.map((days, index) => {
    // Calcula a data de vencimento
    const dueDate = new Date(baseDate.getTime())
    // Remove o fuso horário para não virar o dia anterior se baseDate for YYYY-MM-DDT00:00:00Z
    dueDate.setUTCDate(dueDate.getUTCDate() + days)
    
    return {
      installmentNumber: index + 1,
      days,
      dueDate,
      amount: amountPerInstallment
    }
  })

  return { installments, isValid: true }
}
