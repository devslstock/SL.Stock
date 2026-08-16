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
  
  if (conditionStr === 'fixa') {
    return { installments: [], isValid: true }
  }

  // Pre-process: replace / and , with space
  const normalized = conditionStr.replace(/[/,;]/g, ' ')
  
  // Split into tokens
  const rawTokens = normalized.split(/\s+/).filter(t => t.length > 0)
  
  const items: { days: number, percentage: number | null }[] = []
  let currentPercentage: number | null = null
  let lastDay = 0
  
  // Also support "à vista" or "dinheiro" or "pix" as "0"
  if (rawTokens.length === 1 && (conditionStr.includes('vista') || conditionStr.includes('dinheiro') || conditionStr.includes('pix'))) {
    rawTokens[0] = '0'
  }

  let errorMsg: string | undefined = undefined

  for (const token of rawTokens) {
    if (token.endsWith('%')) {
      const val = parseFloat(token.replace('%', ''))
      if (!isNaN(val)) {
        currentPercentage = val / 100
      }
    } else if (token.endsWith('x')) {
      const val = parseInt(token.replace('x', ''), 10)
      if (!isNaN(val) && val > 0) {
        const interval = defaultInterval > 0 ? defaultInterval : 30
        for (let i = 1; i <= val; i++) {
          items.push({ 
            days: lastDay + (i * interval), 
            percentage: currentPercentage !== null ? currentPercentage / val : null 
          })
        }
        currentPercentage = null
      } else {
        errorMsg = `Número de parcelas inválido: ${token}`
        break
      }
    } else {
      const val = parseInt(token, 10)
      if (!isNaN(val)) {
        items.push({ days: val, percentage: currentPercentage })
        lastDay = val
        currentPercentage = null
      } else {
        // Ignora tokens que não são números válidos como "dias", "parcelas", "em"
        // ex: "30 dias" -> ["30", "dias"]
      }
    }
  }

  if (errorMsg) {
    return { installments: [], isValid: false, error: errorMsg }
  }

  if (items.length === 0) {
    return { installments: [], isValid: false, error: "Formato de condição não reconhecido." }
  }

  // Distribute remaining percentages
  let explicitSum = 0
  let nullCount = 0
  
  for (const item of items) {
    if (item.percentage !== null) {
      explicitSum += item.percentage
    } else {
      nullCount++
    }
  }

  if (explicitSum > 1.001) {
    return { installments: [], isValid: false, error: "A soma das porcentagens excede 100%." }
  }

  if (nullCount > 0) {
    // There's remaining amount to distribute
    const remaining = Math.max(0, 1 - explicitSum)
    const defaultPct = remaining / nullCount
    for (const item of items) {
      if (item.percentage === null) {
        item.percentage = defaultPct
      }
    }
  } else if (explicitSum < 0.999) {
    return { installments: [], isValid: false, error: "A soma das porcentagens informadas não atinge 100%." }
  }

  // Generate installments
  const installments: PaymentInstallment[] = items.map((item, index) => {
    const dueDate = new Date(baseDate.getTime())
    dueDate.setUTCDate(dueDate.getUTCDate() + item.days)
    
    return {
      installmentNumber: index + 1,
      days: item.days,
      dueDate,
      amount: totalAmount * (item.percentage || 0)
    }
  })

  // Round amounts and fix last installment rounding difference
  let sumAmounts = 0
  for (let i = 0; i < installments.length; i++) {
    // keep 2 decimal places
    installments[i].amount = Math.round(installments[i].amount * 100) / 100
    if (i < installments.length - 1) {
      sumAmounts += installments[i].amount
    }
  }
  
  if (installments.length > 0) {
    const lastAmount = totalAmount - sumAmounts
    installments[installments.length - 1].amount = Math.round(lastAmount * 100) / 100
  }

  return { installments, isValid: true }
}
