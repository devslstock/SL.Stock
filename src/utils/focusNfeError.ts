export class FocusNFeError extends Error {
  statusCode: number;
  endpoint: string;
  reference?: string;
  documentType: 'nfe' | 'mdfe' | 'empresas' | 'auth' | 'webhook';
  apiMessage: string;
  apiResponse: any;

  isAuthenticationError: boolean;
  isCertificateError: boolean;
  isFiscalConfigurationError: boolean;
  isValidationError: boolean;
  isNetworkError: boolean;

  constructor(params: {
    message: string;
    statusCode: number;
    endpoint: string;
    reference?: string;
    documentType: 'nfe' | 'mdfe' | 'empresas' | 'auth' | 'webhook';
    apiMessage: string;
    apiResponse?: any;
    isNetworkError?: boolean;
  }) {
    super(params.message);
    this.name = 'FocusNFeError';
    this.statusCode = params.statusCode;
    this.endpoint = params.endpoint;
    this.reference = params.reference;
    this.documentType = params.documentType;
    this.apiMessage = params.apiMessage;
    this.apiResponse = params.apiResponse;

    this.isNetworkError = params.isNetworkError || false;
    this.isAuthenticationError = this.statusCode === 401 || this.statusCode === 403;
    
    const msgLower = (this.apiMessage || '').toLowerCase();
    this.isCertificateError = msgLower.includes('certificado') || msgLower.includes('não configurado');
    this.isFiscalConfigurationError = msgLower.includes('credenciamento') || msgLower.includes('sefaz');
    this.isValidationError = this.statusCode === 422 || this.statusCode === 400;
  }
}

export function parseFocusError(errorData: any, statusCode: number, endpoint: string, docType: 'nfe' | 'mdfe' | 'empresas' | 'auth' | 'webhook', ref?: string): FocusNFeError {
  let apiMsg = 'Erro desconhecido na comunicação com a SEFAZ';
  
  if (errorData?.mensagem) {
    apiMsg = errorData.mensagem;
  } else if (errorData?.erros && Array.isArray(errorData.erros) && errorData.erros.length > 0) {
    apiMsg = errorData.erros.map((e: any) => e.mensagem || JSON.stringify(e)).join(', ');
  } else if (errorData?.codigo) {
    apiMsg = `Código: ${errorData.codigo}`;
  } else if (errorData?.error) {
    apiMsg = errorData.error;
  } else if (typeof errorData === 'string') {
    apiMsg = errorData;
  }

  let friendlyMessage = apiMsg;

  if (statusCode === 401) {
    friendlyMessage = 'Acesso não autorizado. O Token de integração pode ser inválido ou a empresa não está autorizada.';
  } else if (statusCode === 422) {
    if (apiMsg.toLowerCase().includes('certificado')) {
      friendlyMessage = 'Não foi possível autorizar a NF-e porque o certificado digital da empresa ainda não está configurado.';
    } else {
      friendlyMessage = `Erro de validação (422): ${apiMsg}`;
    }
  } else if (statusCode === 400) {
    friendlyMessage = `Requisição mal formatada (400): ${apiMsg}`;
  } else if (statusCode === 415) {
    friendlyMessage = 'Formato não suportado (415). Verifique o Content-Type.';
  } else if (statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504) {
    friendlyMessage = `Ocorreu uma instabilidade na comunicação com a SEFAZ (Status ${statusCode}). Tente novamente mais tarde.`;
  }

  return new FocusNFeError({
    message: friendlyMessage,
    statusCode,
    endpoint,
    reference: ref,
    documentType: docType,
    apiMessage: apiMsg,
    apiResponse: errorData
  });
}
