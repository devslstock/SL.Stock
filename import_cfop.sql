-- Migration to import fiscal operations


INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1101', 'Compra para industrialização', 'Compra para industrialização', 'Compra para industrialização', '1101', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1102', 'Compra para comercialização', 'Compra para comercialização', 'Compra para comercialização', '1102', '', true,
  true, true, 'Conta: Compra para revenda', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1116', 'Compra para industrialização de recebimento futuro', 'Compra para industrialização de recebimento futuro', 'Compra para industrialização de recebimento futuro', '1116', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1122', 'Compra para industrialização remetida para industrializador', 'Compra para industrialização remetida para industrializador', 'Compra para industrialização remetida para industrializador', '1122', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Em poder de 3º', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1124', 'Industrialização efetuada por outra empresa', 'Industrialização efetuada por outra empresa', 'Industrialização efetuada por outra empresa', '1124', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1125', 'Industrialização por outra empresa sem transitar pelo adq.', 'Industrialização por outra empresa sem transitar pelo adq.', 'Industrialização por outra empresa sem transitar pelo adq.', '1125', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1201', 'Devolução de venda de produção do estabelecimento', 'Devolução de venda de produção do estabelecimento', 'Devolução de venda de produção do estabelecimento', '1201', '', true,
  true, true, 'Conta: CPV (Custo Produtos)', 'Estoque', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1202', 'Devolução de venda de mercadoria adquirida de terceiros', 'Devolução de venda de mercadoria adquirida de terceiros', 'Devolução de venda de mercadoria adquirida de terceiros', '1202', '', true,
  true, true, 'Conta: CMV (Custo Mercad)', 'Estoque: Revenda', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1252', 'Aquisição de energia elétrica', 'Aquisição de energia elétrica', 'Aquisição de energia elétrica', '1252', '', true,
  true, false, 'Conta', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1301', 'Aquisição serviço comunicação p/ exec serviço mesma natureza', 'Aquisição serviço comunicação p/ exec serviço mesma natureza', 'Aquisição serviço comunicação p/ exec serviço mesma natureza', '1301', '', true,
  true, false, 'Conta', 'Estoque', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1302', 'Aquisição de serviço de comunicação por estab. industrial', 'Aquisição de serviço de comunicação por estab. industrial', 'Aquisição de serviço de comunicação por estab. industrial', '1302', '', true,
  true, false, 'Conta', 'Estoque', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1303', 'Aquisição de serviço de comunicação por estab. comercial', 'Aquisição de serviço de comunicação por estab. comercial', 'Aquisição de serviço de comunicação por estab. comercial', '1303', '', true,
  true, false, 'Conta', 'Estoque', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1352', 'Aquisição de serviço de transporte por estab. industrial', 'Aquisição de serviço de transporte por estab. industrial', 'Aquisição de serviço de transporte por estab. industrial', '1352', '', true,
  true, true, 'Conta: Frete compra mat-pri', 'Incorporar valor a outra NF', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1353', 'Aquisição de serviço de transporte por estab. comercial', 'Aquisição de serviço de transporte por estab. comercial', 'Aquisição de serviço de transporte por estab. comercial', '1353', '', true,
  true, true, 'Conta: Frete compra mat-pri', 'Incorporar valor a outra NF', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1401', 'Compra para industrialização com substituição tributária', 'Compra para industrialização com substituição tributária', 'Compra para industrialização com substituição tributária', '1401', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1403', 'Compra para comercialização com substituição tributária', 'Compra para comercialização com substituição tributária', 'Compra para comercialização com substituição tributária', '1403', '', true,
  true, true, 'Conta: Compra para revenda', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1406', 'Compra de ativo imobilizado com substituição tributária', 'Compra de ativo imobilizado com substituição tributária', 'Compra de ativo imobilizado com substituição tributária', '1406', '', true,
  true, false, 'Conta', 'Estoque', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1407', 'Compra para uso ou consumo com substituição tributária', 'Compra para uso ou consumo com substituição tributária', 'Compra para uso ou consumo com substituição tributária', '1407', '', true,
  true, true, 'Conta: Compra uso/consumo', 'Estoque: Uso e consumo', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1410', 'Devolução de venda de produção com substituição tributária', 'Devolução de venda de produção com substituição tributária', 'Devolução de venda de produção com substituição tributária', '1410', '', true,
  true, true, 'Conta: CPV (Custo Produtos)', 'Estoque: Acabado', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1411', 'Devolução de venda de mercadoria com substituição tributária', 'Devolução de venda de mercadoria com substituição tributária', 'Devolução de venda de mercadoria com substituição tributária', '1411', '', true,
  true, true, 'Conta: CMV (Custo Mercad)', 'Estoque', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1551', 'Compra de bem do ativo imobilizado', 'Compra de bem do ativo imobilizado', 'Compra de bem do ativo imobilizado', '1551', '', true,
  true, false, 'Conta', 'Estoque', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1552', 'Transferência de bem do ativo imobilizado', 'Transferência de bem do ativo imobilizado', 'Transferência de bem do ativo imobilizado', '1552', '', true,
  false, false, 'Conta', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1554', 'Retorno de ativo imobilizado remetido p/ fora do estab.', 'Retorno de ativo imobilizado remetido p/ fora do estab.', 'Retorno de ativo imobilizado remetido p/ fora do estab.', '1554', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1556', 'Compra de material para uso ou consumo', 'Compra de material para uso ou consumo', 'Compra de material para uso ou consumo', '1556', '', true,
  true, true, 'Conta: Compra uso/consumo', 'Estoque: Uso e consumo', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1604', 'Crédito relativo à compra de bem para o ativo imobilizado', 'Crédito relativo à compra de bem para o ativo imobilizado', 'Crédito relativo à compra de bem para o ativo imobilizado', '1604', '', true,
  false, false, 'Conta', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1651', 'Compra de combustível para industrialização', 'Compra de combustível para industrialização', 'Compra de combustível para industrialização', '1651', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1652', 'Compra de combustível para comercialização', 'Compra de combustível para comercialização', 'Compra de combustível para comercialização', '1652', '', true,
  true, true, 'Conta: Compra para revenda', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1653', 'Compra de combustível ou lubrificante p/ cons. ou usu. final', 'Compra de combustível ou lubrificante p/ cons. ou usu. final', 'Compra de combustível ou lubrificante p/ cons. ou usu. final', '1653', '', true,
  true, false, 'Conta: Compra uso/consumo', 'Estoque: Uso e consumo', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1660', 'Devolução de venda de combustível para industrialização', 'Devolução de venda de combustível para industrialização', 'Devolução de venda de combustível para industrialização', '1660', '', true,
  true, true, 'Conta: CPV (Custo Produtos)', 'Estoque: Revenda', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1661', 'Devolução de venda de combustível para comercialização', 'Devolução de venda de combustível para comercialização', 'Devolução de venda de combustível para comercialização', '1661', '', true,
  true, true, 'Conta: CMV (Custo Mercad)', 'Estoque: Revenda', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1662', 'Devolução de venda de combustível para consumidor final', 'Devolução de venda de combustível para consumidor final', 'Devolução de venda de combustível para consumidor final', '1662', '', true,
  true, true, 'Conta: CMV (Custo Mercad)', 'Estoque: Revenda', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1664', 'Retorno de combustível remetido para armazenagem', 'Retorno de combustível remetido para armazenagem', 'Retorno de combustível remetido para armazenagem', '1664', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Revenda', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1901', 'Entrada para industrialização por encomenda', 'Entrada para industrialização por encomenda', 'Entrada para industrialização por encomenda', '1901', '', true,
  false, true, 'Conta: Terceiro (ind)', 'Estoque: De 3º a industrializ', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1902', 'Retorno de mercadoria remetida para industrialização', 'Retorno de mercadoria remetida para industrialização', 'Retorno de mercadoria remetida para industrialização', '1902', '', true,
  false, true, 'Estoque em poder de 3º', 'Conta: CPV (Custo Produtos)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1903', 'Retorno mercadoria remetida p/ industrialização e não usada', 'Retorno mercadoria remetida p/ industrialização e não usada', 'Retorno mercadoria remetida p/ industrialização e não usada', '1903', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1906', 'Retorno de mercadoria remetida para armazenagem', 'Retorno de mercadoria remetida para armazenagem', 'Retorno de mercadoria remetida para armazenagem', '1906', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1907', 'Retorno simbólico de mercadoria remetida para depósito', 'Retorno simbólico de mercadoria remetida para depósito', 'Retorno simbólico de mercadoria remetida para depósito', '1907', '', true,
  false, false, 'Estoque em poder de 3º', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1908', 'Entrada de bem por conta de contrato de comodato', 'Entrada de bem por conta de contrato de comodato', 'Entrada de bem por conta de contrato de comodato', '1908', '', true,
  false, false, 'Conta', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1909', 'Retorno de bem remetido por conta de contrato de comodato', 'Retorno de bem remetido por conta de contrato de comodato', 'Retorno de bem remetido por conta de contrato de comodato', '1909', '', true,
  false, false, '', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1910', 'Entrada de bonificação, doação ou brinde', 'Entrada de bonificação, doação ou brinde', 'Entrada de bonificação, doação ou brinde', '1910', '', true,
  false, true, 'Conta: Entrada de amostra', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1911', 'Entrada de amostra grátis', 'Entrada de amostra grátis', 'Entrada de amostra grátis', '1911', '', true,
  false, true, 'Conta: Entrada de amostra', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1912', 'Entrada de mercadoria ou bem recebido para demonstração', 'Entrada de mercadoria ou bem recebido para demonstração', 'Entrada de mercadoria ou bem recebido para demonstração', '1912', '', true,
  false, false, 'Conta', 'Estoque: Revenda', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1913', 'Retorno de mercadoria ou bem remetido para demonstração', 'Retorno de mercadoria ou bem remetido para demonstração', 'Retorno de mercadoria ou bem remetido para demonstração', '1913', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Revenda', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1914', 'Retorno de mercadoria ou bem remetido p/ exposição ou feira', 'Retorno de mercadoria ou bem remetido p/ exposição ou feira', 'Retorno de mercadoria ou bem remetido p/ exposição ou feira', '1914', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1915', 'Entrada para conserto', 'Entrada para conserto', 'Entrada para conserto', '1915', '', true,
  false, false, 'Conta', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1916', 'Retorno de conserto', 'Retorno de conserto', 'Retorno de conserto', '1916', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1924', 'Entrada para industrialização por conta e ordem', 'Entrada para industrialização por conta e ordem', 'Entrada para industrialização por conta e ordem', '1924', '', true,
  false, true, 'Conta: Terceiro (ind)', 'Estoque: De 3º a industrializ', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1925', 'Retorno de merc. remetida p/ industrializ. por conta e ordem', 'Retorno de merc. remetida p/ industrializ. por conta e ordem', 'Retorno de merc. remetida p/ industrializ. por conta e ordem', '1925', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Acabado', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1932', 'Aquisição de transporte iniciado em UF diversa do prestador', 'Aquisição de transporte iniciado em UF diversa do prestador', 'Aquisição de transporte iniciado em UF diversa do prestador', '1932', '', true,
  true, true, 'Conta: Frete compra mat-pri', 'Incorporar valor a outra NF', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1933', 'Aquisição de serviço tributado pelo ISSQN', 'Aquisição de serviço tributado pelo ISSQN', 'Aquisição de serviço tributado pelo ISSQN', '1933', '', true,
  true, false, 'Conta', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1949', 'Outras entradas', 'Outras entradas', 'Outras entradas', '1949', '', true,
  false, false, 'Conta', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '1999', 'Outros documentos', 'Outros documentos', 'Outros documentos', '1999', '', true,
  true, false, 'Conta', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', ''
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2101', 'Compra para industrialização', 'Compra para industrialização', 'Compra para industrialização', '2101', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2102', 'Compra para comercialização', 'Compra para comercialização', 'Compra para comercialização', '2102', '', true,
  true, true, 'Conta: Compra para revenda', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2116', 'Compra para industrialização de recebimento futuro', 'Compra para industrialização de recebimento futuro', 'Compra para industrialização de recebimento futuro', '2116', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2122', 'Compra para industrialização remetida para industrializador', 'Compra para industrialização remetida para industrializador', 'Compra para industrialização remetida para industrializador', '2122', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Em poder de 3º', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2124', 'Industrialização efetuada por outra empresa', 'Industrialização efetuada por outra empresa', 'Industrialização efetuada por outra empresa', '2124', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2125', 'Industrialização por outra empresa sem transitar pelo adq.', 'Industrialização por outra empresa sem transitar pelo adq.', 'Industrialização por outra empresa sem transitar pelo adq.', '2125', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2201', 'Devolução de venda de produção do estabelecimento', 'Devolução de venda de produção do estabelecimento', 'Devolução de venda de produção do estabelecimento', '2201', '', true,
  true, true, 'Conta: CPV (Custo Produtos)', 'Estoque: Acabado', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2202', 'Devolução de venda de mercadoria adquirida de terceiros', 'Devolução de venda de mercadoria adquirida de terceiros', 'Devolução de venda de mercadoria adquirida de terceiros', '2202', '', true,
  true, true, 'Conta: CMV (Custo Mercad)', 'Estoque: Revenda', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2252', 'Aquisição de energia elétrica', 'Aquisição de energia elétrica', 'Aquisição de energia elétrica', '2252', '', true,
  true, false, 'Conta', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2301', 'Aquisição serviço comunicação p/ exec serviço mesma natureza', 'Aquisição serviço comunicação p/ exec serviço mesma natureza', 'Aquisição serviço comunicação p/ exec serviço mesma natureza', '2301', '', true,
  true, false, 'Conta', 'Estoque', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2302', 'Aquisição de serviço de comunicação por estab. industrial', 'Aquisição de serviço de comunicação por estab. industrial', 'Aquisição de serviço de comunicação por estab. industrial', '2302', '', true,
  true, false, 'Conta', 'Estoque', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2303', 'Aquisição de serviço de comunicação por estab. comercial', 'Aquisição de serviço de comunicação por estab. comercial', 'Aquisição de serviço de comunicação por estab. comercial', '2303', '', true,
  true, false, 'Conta', 'Estoque', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2352', 'Aquisição de serviço de transporte por estab. industrial', 'Aquisição de serviço de transporte por estab. industrial', 'Aquisição de serviço de transporte por estab. industrial', '2352', '', true,
  true, true, 'Conta: Frete compra mat-pri', 'Incorporar valor a outra NF', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2353', 'Aquisição de serviço de transporte por estab. comercial', 'Aquisição de serviço de transporte por estab. comercial', 'Aquisição de serviço de transporte por estab. comercial', '2353', '', true,
  true, true, 'Conta: Frete compra mat-pri', 'Incorporar valor a outra NF', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2401', 'Compra para industrialização com substituição tributária', 'Compra para industrialização com substituição tributária', 'Compra para industrialização com substituição tributária', '2401', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2403', 'Compra para comercialização com substituição tributária', 'Compra para comercialização com substituição tributária', 'Compra para comercialização com substituição tributária', '2403', '', true,
  true, true, 'Conta: Compra para revenda', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2406', 'Compra de ativo imobilizado com substituição tributária', 'Compra de ativo imobilizado com substituição tributária', 'Compra de ativo imobilizado com substituição tributária', '2406', '', true,
  true, false, 'Conta', 'Estoque', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2407', 'Compra para uso ou consumo com substituição tributária', 'Compra para uso ou consumo com substituição tributária', 'Compra para uso ou consumo com substituição tributária', '2407', '', true,
  true, true, 'Conta: Compra uso/consumo', 'Estoque: Uso e consumo', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2410', 'Devolução de venda de produção com substituição tributária', 'Devolução de venda de produção com substituição tributária', 'Devolução de venda de produção com substituição tributária', '2410', '', true,
  true, true, 'Conta: CPV (Custo Produtos)', 'Estoque: Acabado', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2411', 'Devolução de venda de mercadoria com substituição tributária', 'Devolução de venda de mercadoria com substituição tributária', 'Devolução de venda de mercadoria com substituição tributária', '2411', '', true,
  true, true, 'Conta: CMV (Custo Mercad)', 'Estoque: Revenda', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2551', 'Compra de bem do ativo imobilizado', 'Compra de bem do ativo imobilizado', 'Compra de bem do ativo imobilizado', '2551', '', true,
  true, false, 'Conta', 'Estoque', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2552', 'Transferência de bem do ativo imobilizado', 'Transferência de bem do ativo imobilizado', 'Transferência de bem do ativo imobilizado', '2552', '', true,
  false, false, 'Conta', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2554', 'Retorno de ativo imobilizado remetido p/ fora do estab.', 'Retorno de ativo imobilizado remetido p/ fora do estab.', 'Retorno de ativo imobilizado remetido p/ fora do estab.', '2554', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2556', 'Compra de material para uso ou consumo', 'Compra de material para uso ou consumo', 'Compra de material para uso ou consumo', '2556', '', true,
  true, true, 'Conta: Compra uso/consumo', 'Estoque: Uso e consumo', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2651', 'Compra de combustível para industrialização', 'Compra de combustível para industrialização', 'Compra de combustível para industrialização', '2651', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2652', 'Compra de combustível para comercialização', 'Compra de combustível para comercialização', 'Compra de combustível para comercialização', '2652', '', true,
  true, true, 'Conta: Compra para revenda', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2653', 'Compra de combustível ou lubrificante p/ cons. ou usu. final', 'Compra de combustível ou lubrificante p/ cons. ou usu. final', 'Compra de combustível ou lubrificante p/ cons. ou usu. final', '2653', '', true,
  true, false, 'Conta: Compra uso/consumo', 'Estoque: Uso e consumo', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2660', 'Devolução de venda de combustível para industrialização', 'Devolução de venda de combustível para industrialização', 'Devolução de venda de combustível para industrialização', '2660', '', true,
  true, true, 'Conta: CPV (Custo Produtos)', 'Estoque: Revenda', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2661', 'Devolução de venda de combustível para comercialização', 'Devolução de venda de combustível para comercialização', 'Devolução de venda de combustível para comercialização', '2661', '', true,
  true, true, 'Conta: CMV (Custo Mercad)', 'Estoque: Revenda', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2662', 'Devolução de venda de combustível para consumidor final', 'Devolução de venda de combustível para consumidor final', 'Devolução de venda de combustível para consumidor final', '2662', '', true,
  true, true, 'Conta: CMV (Custo Mercad)', 'Estoque: Revenda', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2664', 'Retorno de combustível remetido para armazenagem', 'Retorno de combustível remetido para armazenagem', 'Retorno de combustível remetido para armazenagem', '2664', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Revenda', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2901', 'Entrada para industrialização por encomenda', 'Entrada para industrialização por encomenda', 'Entrada para industrialização por encomenda', '2901', '', true,
  false, true, 'Conta: Terceiro (ind)', 'Estoque: De 3º a industrializ', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2902', 'Retorno de mercadoria remetida para industrialização', 'Retorno de mercadoria remetida para industrialização', 'Retorno de mercadoria remetida para industrialização', '2902', '', true,
  false, true, 'Estoque em poder de 3º', 'Conta: CPV (Custo Produtos)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2903', 'Retorno mercadoria remetida p/ industrialização e não usada', 'Retorno mercadoria remetida p/ industrialização e não usada', 'Retorno mercadoria remetida p/ industrialização e não usada', '2903', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2906', 'Retorno de mercadoria remetida para armazenagem', 'Retorno de mercadoria remetida para armazenagem', 'Retorno de mercadoria remetida para armazenagem', '2906', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2907', 'Retorno simbólico de mercadoria remetida para depósito', 'Retorno simbólico de mercadoria remetida para depósito', 'Retorno simbólico de mercadoria remetida para depósito', '2907', '', true,
  false, false, 'Estoque em poder de 3º', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2908', 'Entrada de bem por conta de contrato de comodato', 'Entrada de bem por conta de contrato de comodato', 'Entrada de bem por conta de contrato de comodato', '2908', '', true,
  false, false, 'Conta', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2910', 'Entrada de bonificação, doação ou brinde', 'Entrada de bonificação, doação ou brinde', 'Entrada de bonificação, doação ou brinde', '2910', '', true,
  false, true, 'Conta: Entrada de amostra', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2911', 'Entrada de amostra grátis', 'Entrada de amostra grátis', 'Entrada de amostra grátis', '2911', '', true,
  false, true, 'Conta: Entrada de amostra', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2912', 'Entrada de mercadoria ou bem recebido para demonstração', 'Entrada de mercadoria ou bem recebido para demonstração', 'Entrada de mercadoria ou bem recebido para demonstração', '2912', '', true,
  false, false, 'Conta', 'Estoque: Revenda', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2913', 'Retorno de mercadoria ou bem remetido para demonstração', 'Retorno de mercadoria ou bem remetido para demonstração', 'Retorno de mercadoria ou bem remetido para demonstração', '2913', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Revenda', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2914', 'Retorno de mercadoria ou bem remetido p/ exposição ou feira', 'Retorno de mercadoria ou bem remetido p/ exposição ou feira', 'Retorno de mercadoria ou bem remetido p/ exposição ou feira', '2914', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2915', 'Entrada para conserto', 'Entrada para conserto', 'Entrada para conserto', '2915', '', true,
  false, false, 'Conta', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2916', 'Retorno de conserto', 'Retorno de conserto', 'Retorno de conserto', '2916', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Matéria-prima', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2924', 'Entrada para industrialização por conta e ordem', 'Entrada para industrialização por conta e ordem', 'Entrada para industrialização por conta e ordem', '2924', '', true,
  false, true, 'Conta: Terceiro (ind)', 'Estoque: De 3º a industrializ', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2925', 'Retorno de merc. remetida p/ industrializ. por conta e ordem', 'Retorno de merc. remetida p/ industrializ. por conta e ordem', 'Retorno de merc. remetida p/ industrializ. por conta e ordem', '2925', '', true,
  false, true, 'Estoque em poder de 3º', 'Estoque: Acabado', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2932', 'Aquisição de transporte iniciado em UF diversa do prestador', 'Aquisição de transporte iniciado em UF diversa do prestador', 'Aquisição de transporte iniciado em UF diversa do prestador', '2932', '', true,
  true, true, 'Conta: Frete compra mat-pri', 'Incorporar valor a outra NF', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2933', 'Aquisição de serviço tributado pelo ISSQN', 'Aquisição de serviço tributado pelo ISSQN', 'Aquisição de serviço tributado pelo ISSQN', '2933', '', true,
  true, false, 'Conta', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2949', 'Outras entradas', 'Outras entradas', 'Outras entradas', '2949', '', true,
  false, false, 'Conta', 'Estoque', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '2999', 'Outros documentos', 'Outros documentos', 'Outros documentos', '2999', '', true,
  true, false, 'Conta', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', ''
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '3101', 'Compra para industrialização', 'Compra para industrialização', 'Compra para industrialização', '3101', '', true,
  true, true, 'Conta: Compra matéria-prima', 'Estoque: Matéria-prima', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '3102', 'Compra para comercialização', 'Compra para comercialização', 'Compra para comercialização', '3102', '', true,
  true, true, 'Conta: Compra para revenda', 'Estoque: Revenda', '36 Fornecedores (2.01.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '3201', 'Devolução de venda de produção do estabelecimento', 'Devolução de venda de produção do estabelecimento', 'Devolução de venda de produção do estabelecimento', '3201', '', true,
  true, true, 'Conta: CPV (Custo Produtos)', 'Estoque: Revenda', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '3202', 'Devolução de venda de mercadoria adquirida de terceiros', 'Devolução de venda de mercadoria adquirida de terceiros', 'Devolução de venda de mercadoria adquirida de terceiros', '3202', '', true,
  true, true, 'Conta: CMV (Custo Mercad)', 'Estoque: Revenda', '123 Devoluções de clientes (2.01.03.03)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '3651', 'Compra de combustível para industrialização', 'Compra de combustível para industrialização', 'Compra de combustível para industrialização', '3651', '', true,
  true, true, 'Estoque', 'Estoque: Matéria-prima', '235 Compras de matérias-primas (1.01.03.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '3652', 'Compra de combustível para comercialização', 'Compra de combustível para comercialização', 'Compra de combustível para comercialização', '3652', '', true,
  true, true, 'Estoque', 'Estoque: Revenda', '233 Compras de mercadorias para revenda (1.01.03.01.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '3653', 'Compra de combustível por consumidor final', 'Compra de combustível por consumidor final', 'Compra de combustível por consumidor final', '3653', '', true,
  true, true, 'Estoque', 'Estoque: Revenda', '233 Compras de mercadorias para revenda (1.01.03.01.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '3949', 'Entrada de amostra grátis', 'Entrada de amostra grátis', 'Entrada de amostra grátis', '3949', '', true,
  false, false, 'Conta', 'Estoque: Revenda', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5101', 'Venda de produção do estabelecimento', 'Venda de produção do estabelecimento', 'Venda de produção do estabelecimento', '5101', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5102', 'Venda de mercadoria adquirida de terceiros', 'Venda de mercadoria adquirida de terceiros', 'Venda de mercadoria adquirida de terceiros', '5102', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5102-1', 'Venda de mercadoria adquirida de terceiros', 'Venda de mercadoria adquirida de terceiros', 'Venda de mercadoria adquirida de terceiros', '5102', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5105', 'Venda de produção do estabelecimento, sem por ele transitar', 'Venda de produção do estabelecimento, sem por ele transitar', 'Venda de produção do estabelecimento, sem por ele transitar', '5105', '', true,
  true, true, 'Estoque em poder de 3º', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5106', 'Venda de mercadoria adquirida de terc, sem por ele transitar', 'Venda de mercadoria adquirida de terc, sem por ele transitar', 'Venda de mercadoria adquirida de terc, sem por ele transitar', '5106', '', true,
  true, true, 'Estoque em poder de 3º', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5109', 'Venda de produção destinada à Zona Franca de Manaus', 'Venda de produção destinada à Zona Franca de Manaus', 'Venda de produção destinada à Zona Franca de Manaus', '5109', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5110', 'Venda de mercadoria destinada à Zona Franca de Manaus', 'Venda de mercadoria destinada à Zona Franca de Manaus', 'Venda de mercadoria destinada à Zona Franca de Manaus', '5110', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5116', 'Remessa de produção originada de venda para entrega futura', 'Remessa de produção originada de venda para entrega futura', 'Remessa de produção originada de venda para entrega futura', '5116', '', true,
  false, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5117', 'Remessa de mercadoria originada de venda para entrega futura', 'Remessa de mercadoria originada de venda para entrega futura', 'Remessa de mercadoria originada de venda para entrega futura', '5117', '', true,
  false, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5118', 'Venda de produção entregue ao destinatário, em venda à ordem', 'Venda de produção entregue ao destinatário, em venda à ordem', 'Venda de produção entregue ao destinatário, em venda à ordem', '5118', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5122', 'Venda de produção remetida p/ industr. por conta e ordem', 'Venda de produção remetida p/ industr. por conta e ordem', 'Venda de produção remetida p/ industr. por conta e ordem', '5122', '', true,
  true, false, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5123', 'Venda de mercadoria remetida p/ industr. por conta e ordem', 'Venda de mercadoria remetida p/ industr. por conta e ordem', 'Venda de mercadoria remetida p/ industr. por conta e ordem', '5123', '', true,
  true, false, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5124', 'Industrialização efetuada para outra empresa', 'Industrialização efetuada para outra empresa', 'Industrialização efetuada para outra empresa', '5124', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5125', 'Industrialização p/outra empr. sem transitar pelo adquirente', 'Industrialização p/outra empr. sem transitar pelo adquirente', 'Industrialização p/outra empr. sem transitar pelo adquirente', '5125', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5201', 'Devolução de compra para industrialização', 'Devolução de compra para industrialização', 'Devolução de compra para industrialização', '5201', '', true,
  true, true, 'Estoque', 'Conta: Compra matéria-prima', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5202', 'Devolução de compra para comercialização', 'Devolução de compra para comercialização', 'Devolução de compra para comercialização', '5202', '', true,
  true, true, 'Estoque', 'Conta: Compra matéria-prima', '124 Devoluções a fornecedores (1.01.02.02.02)', '900 - Outros'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5206', 'Anulação de valor da aquisição de serviço de transporte', 'Anulação de valor da aquisição de serviço de transporte', 'Anulação de valor da aquisição de serviço de transporte', '5206', '', true,
  true, false, 'Estoque', 'Conta: Compra matéria-prima', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5401', 'Venda de produção com substituição tributária', 'Venda de produção com substituição tributária', 'Venda de produção com substituição tributária', '5401', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '201 - Tributada pelo simples nacional com permissão de crédito e com cobrança do icms por substituição tributária'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5403', 'Venda de mercadoria com substituição tributária', 'Venda de mercadoria com substituição tributária', 'Venda de mercadoria com substituição tributária', '5403', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '201 - Tributada pelo simples nacional com permissão de crédito e com cobrança do icms por substituição tributária'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5405', 'Venda de merc. com subst. trib., como contrib. substituído', 'Venda de merc. com subst. trib., como contrib. substituído', 'Venda de merc. com subst. trib., como contrib. substituído', '5405', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '500 - Icms cobrado anteriormente por substituição tributária (substituído) ou por antecipação'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5410', 'Devolução de compra p/ industrialização c/ subst. tributária', 'Devolução de compra p/ industrialização c/ subst. tributária', 'Devolução de compra p/ industrialização c/ subst. tributária', '5410', '', true,
  true, true, 'Estoque', 'Conta: Compra matéria-prima', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5411', 'Devolução de compra p/ comercialização c/ subst. tributária', 'Devolução de compra p/ comercialização c/ subst. tributária', 'Devolução de compra p/ comercialização c/ subst. tributária', '5411', '', true,
  true, true, 'Estoque', 'Conta: Compra para revenda', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5551', 'Venda de bem do ativo imobilizado', 'Venda de bem do ativo imobilizado', 'Venda de bem do ativo imobilizado', '5551', '', true,
  true, false, 'Estoque', 'Conta', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5553', 'Devolução de compra de bem para o ativo imobilizado', 'Devolução de compra de bem para o ativo imobilizado', 'Devolução de compra de bem para o ativo imobilizado', '5553', '', true,
  true, false, 'Estoque', 'Conta', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5554', 'Remessa de ativo imobilizado p/ uso fora do estabelecimento', 'Remessa de ativo imobilizado p/ uso fora do estabelecimento', 'Remessa de ativo imobilizado p/ uso fora do estabelecimento', '5554', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5556', 'Devolução de compra de material de uso ou consumo', 'Devolução de compra de material de uso ou consumo', 'Devolução de compra de material de uso ou consumo', '5556', '', true,
  true, true, 'Estoque', 'Conta: Compra uso/consumo', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5651', 'Venda de combustível produção do estab. p/ industrialização', 'Venda de combustível produção do estab. p/ industrialização', 'Venda de combustível produção do estab. p/ industrialização', '5651', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5652', 'Venda de combustível produção do estab. p/ comercialização', 'Venda de combustível produção do estab. p/ comercialização', 'Venda de combustível produção do estab. p/ comercialização', '5652', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5653', 'Venda de combustível produção do estab. p/ consumidor final', 'Venda de combustível produção do estab. p/ consumidor final', 'Venda de combustível produção do estab. p/ consumidor final', '5653', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5654', 'Venda de combustível adquirido de terc. p/ industrialização', 'Venda de combustível adquirido de terc. p/ industrialização', 'Venda de combustível adquirido de terc. p/ industrialização', '5654', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5655', 'Venda de combustível adquirido de terc. p/ comercialização', 'Venda de combustível adquirido de terc. p/ comercialização', 'Venda de combustível adquirido de terc. p/ comercialização', '5655', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5656', 'Venda de combustível adquirido de terc. p/ consumidor final', 'Venda de combustível adquirido de terc. p/ consumidor final', 'Venda de combustível adquirido de terc. p/ consumidor final', '5656', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5657', 'Remessa de combustível adq. de terc. p/ venda fora do estab.', 'Remessa de combustível adq. de terc. p/ venda fora do estab.', 'Remessa de combustível adq. de terc. p/ venda fora do estab.', '5657', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5660', 'Devolução de compra de combustível para industrialização', 'Devolução de compra de combustível para industrialização', 'Devolução de compra de combustível para industrialização', '5660', '', true,
  true, true, 'Estoque', 'Conta: Compra matéria-prima', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5661', 'Devolução de compra de combustível para comercialização', 'Devolução de compra de combustível para comercialização', 'Devolução de compra de combustível para comercialização', '5661', '', true,
  true, true, 'Estoque', 'Conta: Compra para revenda', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5662', 'Devolução de compra de combustível adq. por consumidor final', 'Devolução de compra de combustível adq. por consumidor final', 'Devolução de compra de combustível adq. por consumidor final', '5662', '', true,
  true, true, 'Estoque', 'Conta: Compra uso/consumo', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5663', 'Remessa de combustível para armazenagem', 'Remessa de combustível para armazenagem', 'Remessa de combustível para armazenagem', '5663', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5666', 'Remessa por ordem de terc. de combustível rec. p/armazenagem', 'Remessa por ordem de terc. de combustível rec. p/armazenagem', 'Remessa por ordem de terc. de combustível rec. p/armazenagem', '5666', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5901', 'Remessa para industrialização', 'Remessa para industrialização', 'Remessa para industrialização', '5901', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5902', 'Retorno de mercadoria utilizada na industrialização', 'Retorno de mercadoria utilizada na industrialização', 'Retorno de mercadoria utilizada na industrialização', '5902', '', true,
  false, true, 'Estoque de 3º consumido', 'Conta: Terceiro (ind)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5903', 'Retorno mercadoria recebida p/ industrialização e não usada', 'Retorno mercadoria recebida p/ industrialização e não usada', 'Retorno mercadoria recebida p/ industrialização e não usada', '5903', '', true,
  false, true, 'Estoque de 3º', 'Conta: Terceiro (ind)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5905', 'Remessa de mercadoria para armazenagem', 'Remessa de mercadoria para armazenagem', 'Remessa de mercadoria para armazenagem', '5905', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5908', 'Remessa de bem por conta de contrato de comodato', 'Remessa de bem por conta de contrato de comodato', 'Remessa de bem por conta de contrato de comodato', '5908', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5909', 'Retorno de bem recebido por conta de comodato', 'Retorno de bem recebido por conta de comodato', 'Retorno de bem recebido por conta de comodato', '5909', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5910', 'Remessa em bonificação, doação ou brinde', 'Remessa em bonificação, doação ou brinde', 'Remessa em bonificação, doação ou brinde', '5910', '', true,
  false, true, 'Estoque', 'Conta: Saída de amostra', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5911', 'Remessa de amostra grátis', 'Remessa de amostra grátis', 'Remessa de amostra grátis', '5911', '', true,
  false, true, 'Estoque', 'Conta: Saída de amostra', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5912', 'Remessa para demonstração', 'Remessa para demonstração', 'Remessa para demonstração', '5912', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5913', 'Retorno de mercadoria ou bem recebido para demonstração', 'Retorno de mercadoria ou bem recebido para demonstração', 'Retorno de mercadoria ou bem recebido para demonstração', '5913', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5914', 'Remessa de mercadoria ou bem para exposição ou feira', 'Remessa de mercadoria ou bem para exposição ou feira', 'Remessa de mercadoria ou bem para exposição ou feira', '5914', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5915', 'Remessa para conserto', 'Remessa para conserto', 'Remessa para conserto', '5915', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5916', 'Retorno de conserto', 'Retorno de conserto', 'Retorno de conserto', '5916', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5917', 'Remessa para consignação', 'Remessa para consignação', 'Remessa para consignação', '5917', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5922', 'Simples faturamento de venda para entrega futura', 'Simples faturamento de venda para entrega futura', 'Simples faturamento de venda para entrega futura', '5922', '', true,
  true, false, 'Estoque', 'Conta', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5923', 'Remessa por conta e ordem de terceiro, em venda à ordem', 'Remessa por conta e ordem de terceiro, em venda à ordem', 'Remessa por conta e ordem de terceiro, em venda à ordem', '5923', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5924', 'Remessa para industrialização por conta e ordem', 'Remessa para industrialização por conta e ordem', 'Remessa para industrialização por conta e ordem', '5924', '', true,
  false, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5925', 'Retorno de mercadoria industrializada por conta e ordem', 'Retorno de mercadoria industrializada por conta e ordem', 'Retorno de mercadoria industrializada por conta e ordem', '5925', '', true,
  false, true, 'Estoque de 3º consumido', 'Conta: Terceiro (ind)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5949', 'Outras saídas', 'Outras saídas', 'Outras saídas', '5949', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5949-1', 'Remessa de material faltante', 'Remessa de material faltante', 'Remessa de material faltante', '5949', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5949-2', 'Remessa para utilização na prestação de serviço', 'Remessa para utilização na prestação de serviço', 'Remessa para utilização na prestação de serviço', '5949', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '5999', 'Outros documentos', 'Outros documentos', 'Outros documentos', '5999', '', true,
  true, true, 'Estoque', 'Conta: CSV (Custo Serviços)', '16 Clientes (1.01.02.01.01)', ''
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6101', 'Venda de produção do estabelecimento', 'Venda de produção do estabelecimento', 'Venda de produção do estabelecimento', '6101', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6102', 'Venda de mercadoria adquirida de terceiros', 'Venda de mercadoria adquirida de terceiros', 'Venda de mercadoria adquirida de terceiros', '6102', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6105', 'Venda de produção do estabelecimento, sem por ele transitar', 'Venda de produção do estabelecimento, sem por ele transitar', 'Venda de produção do estabelecimento, sem por ele transitar', '6105', '', true,
  true, true, 'Estoque em poder de 3º', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6106', 'Venda de mercadoria adquirida de terc, sem por ele transitar', 'Venda de mercadoria adquirida de terc, sem por ele transitar', 'Venda de mercadoria adquirida de terc, sem por ele transitar', '6106', '', true,
  true, true, 'Estoque em poder de 3º', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6107', 'Venda de produção, destinada a não contribuinte', 'Venda de produção, destinada a não contribuinte', 'Venda de produção, destinada a não contribuinte', '6107', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6108', 'Venda de mercadoria, destinada a não contribuinte', 'Venda de mercadoria, destinada a não contribuinte', 'Venda de mercadoria, destinada a não contribuinte', '6108', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6109', 'Venda de produção destinada à Zona Franca de Manaus', 'Venda de produção destinada à Zona Franca de Manaus', 'Venda de produção destinada à Zona Franca de Manaus', '6109', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6110', 'Venda de mercadoria destinada à Zona Franca de Manaus', 'Venda de mercadoria destinada à Zona Franca de Manaus', 'Venda de mercadoria destinada à Zona Franca de Manaus', '6110', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6116', 'Remessa de produção originada de venda para entrega futura', 'Remessa de produção originada de venda para entrega futura', 'Remessa de produção originada de venda para entrega futura', '6116', '', true,
  false, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6117', 'Remessa de mercadoria originada de venda para entrega futura', 'Remessa de mercadoria originada de venda para entrega futura', 'Remessa de mercadoria originada de venda para entrega futura', '6117', '', true,
  false, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6118', 'Venda de produção entregue ao destinatário, em venda à ordem', 'Venda de produção entregue ao destinatário, em venda à ordem', 'Venda de produção entregue ao destinatário, em venda à ordem', '6118', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6122', 'Venda de produção remetida p/ industr. por conta e ordem', 'Venda de produção remetida p/ industr. por conta e ordem', 'Venda de produção remetida p/ industr. por conta e ordem', '6122', '', true,
  true, false, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6123', 'Venda de mercadoria remetida p/ industr. por conta e ordem', 'Venda de mercadoria remetida p/ industr. por conta e ordem', 'Venda de mercadoria remetida p/ industr. por conta e ordem', '6123', '', true,
  true, false, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6124', 'Industrialização efetuada para outra empresa', 'Industrialização efetuada para outra empresa', 'Industrialização efetuada para outra empresa', '6124', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6125', 'Industrialização p/outra empr. sem transitar pelo adquirente', 'Industrialização p/outra empr. sem transitar pelo adquirente', 'Industrialização p/outra empr. sem transitar pelo adquirente', '6125', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6201', 'Devolução de compra para industrialização', 'Devolução de compra para industrialização', 'Devolução de compra para industrialização', '6201', '', true,
  true, true, 'Estoque', 'Conta: Compra matéria-prima', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6202', 'Devolução de compra para comercialização', 'Devolução de compra para comercialização', 'Devolução de compra para comercialização', '6202', '', true,
  true, true, 'Estoque', 'Conta: Compra para revenda', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6206', 'Anulação de valor da aquisição de serviço de transporte', 'Anulação de valor da aquisição de serviço de transporte', 'Anulação de valor da aquisição de serviço de transporte', '6206', '', true,
  true, false, 'Estoque', 'Conta: Compra matéria-prima', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6401', 'Venda de produção com substituição tributária', 'Venda de produção com substituição tributária', 'Venda de produção com substituição tributária', '6401', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '201 - Tributada pelo simples nacional com permissão de crédito e com cobrança do icms por substituição tributária'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6403', 'Venda de mercadoria com substituição tributária', 'Venda de mercadoria com substituição tributária', 'Venda de mercadoria com substituição tributária', '6403', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '201 - Tributada pelo simples nacional com permissão de crédito e com cobrança do icms por substituição tributária'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6404', 'Venda de merc. c/ subst. trib., imposto retido anteriormente', 'Venda de merc. c/ subst. trib., imposto retido anteriormente', 'Venda de merc. c/ subst. trib., imposto retido anteriormente', '6404', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '201 - Tributada pelo simples nacional com permissão de crédito e com cobrança do icms por substituição tributária'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6410', 'Devolução de compra p/ industrialização c/ subst. tributária', 'Devolução de compra p/ industrialização c/ subst. tributária', 'Devolução de compra p/ industrialização c/ subst. tributária', '6410', '', true,
  true, true, 'Estoque', 'Conta: Compra matéria-prima', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6411', 'Devolução de compra p/ comercialização c/ subst. tributária', 'Devolução de compra p/ comercialização c/ subst. tributária', 'Devolução de compra p/ comercialização c/ subst. tributária', '6411', '', true,
  true, true, 'Estoque', 'Conta: Compra para revenda', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6551', 'Venda de bem do ativo imobilizado', 'Venda de bem do ativo imobilizado', 'Venda de bem do ativo imobilizado', '6551', '', true,
  true, false, 'Estoque', 'Conta', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6553', 'Devolução de compra de bem para o ativo imobilizado', 'Devolução de compra de bem para o ativo imobilizado', 'Devolução de compra de bem para o ativo imobilizado', '6553', '', true,
  true, false, 'Estoque', 'Conta', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6554', 'Remessa de ativo imobilizado p/ uso fora do estabelecimento', 'Remessa de ativo imobilizado p/ uso fora do estabelecimento', 'Remessa de ativo imobilizado p/ uso fora do estabelecimento', '6554', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6556', 'Devolução de compra de material de uso ou consumo', 'Devolução de compra de material de uso ou consumo', 'Devolução de compra de material de uso ou consumo', '6556', '', true,
  true, true, 'Estoque', 'Conta: Compra uso/consumo', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6651', 'Venda de combustível produção do estab. p/ industrialização', 'Venda de combustível produção do estab. p/ industrialização', 'Venda de combustível produção do estab. p/ industrialização', '6651', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6652', 'Venda de combustível produção do estab. p/ comercialização', 'Venda de combustível produção do estab. p/ comercialização', 'Venda de combustível produção do estab. p/ comercialização', '6652', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6653', 'Venda de combustível produção do estab. p/ consumidor final', 'Venda de combustível produção do estab. p/ consumidor final', 'Venda de combustível produção do estab. p/ consumidor final', '6653', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6654', 'Venda de combustível adquirido de terc. p/ industrialização', 'Venda de combustível adquirido de terc. p/ industrialização', 'Venda de combustível adquirido de terc. p/ industrialização', '6654', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6655', 'Venda de combustível adquirido de terc. p/ comercialização', 'Venda de combustível adquirido de terc. p/ comercialização', 'Venda de combustível adquirido de terc. p/ comercialização', '6655', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6656', 'Venda de combustível adquirido de terc. p/ consumidor final', 'Venda de combustível adquirido de terc. p/ consumidor final', 'Venda de combustível adquirido de terc. p/ consumidor final', '6656', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6657', 'Remessa de combustível adq. de terc. p/ venda fora do estab.', 'Remessa de combustível adq. de terc. p/ venda fora do estab.', 'Remessa de combustível adq. de terc. p/ venda fora do estab.', '6657', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6660', 'Devolução de compra de combustível para industrialização', 'Devolução de compra de combustível para industrialização', 'Devolução de compra de combustível para industrialização', '6660', '', true,
  true, true, 'Estoque', 'Conta: Compra matéria-prima', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6661', 'Devolução de compra de combustível para comercialização', 'Devolução de compra de combustível para comercialização', 'Devolução de compra de combustível para comercialização', '6661', '', true,
  true, true, 'Estoque', 'Conta: Compra para revenda', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6662', 'Devolução de compra de combustível adq. por consumidor final', 'Devolução de compra de combustível adq. por consumidor final', 'Devolução de compra de combustível adq. por consumidor final', '6662', '', true,
  true, true, 'Estoque', 'Conta: Compra uso/consumo', '124 Devoluções a fornecedores (1.01.02.02.02)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6663', 'Remessa de combustível para armazenagem', 'Remessa de combustível para armazenagem', 'Remessa de combustível para armazenagem', '6663', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6666', 'Remessa por ordem de terc. de combustível rec. p/armazenagem', 'Remessa por ordem de terc. de combustível rec. p/armazenagem', 'Remessa por ordem de terc. de combustível rec. p/armazenagem', '6666', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6901', 'Remessa para industrialização', 'Remessa para industrialização', 'Remessa para industrialização', '6901', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6902', 'Retorno de mercadoria utilizada na industrialização', 'Retorno de mercadoria utilizada na industrialização', 'Retorno de mercadoria utilizada na industrialização', '6902', '', true,
  false, true, 'Estoque de 3º consumido', 'Conta: Terceiro (ind)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6903', 'Retorno mercadoria recebida p/ industrialização e não usada', 'Retorno mercadoria recebida p/ industrialização e não usada', 'Retorno mercadoria recebida p/ industrialização e não usada', '6903', '', true,
  false, true, 'Estoque de 3º', 'Conta: Terceiro (ind)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6905', 'Remessa de mercadoria para armazenagem', 'Remessa de mercadoria para armazenagem', 'Remessa de mercadoria para armazenagem', '6905', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6908', 'Remessa de bem por conta de contrato de comodato', 'Remessa de bem por conta de contrato de comodato', 'Remessa de bem por conta de contrato de comodato', '6908', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6909', 'Retorno de bem recebido por conta de comodato', 'Retorno de bem recebido por conta de comodato', 'Retorno de bem recebido por conta de comodato', '6909', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6910', 'Remessa em bonificação, doação ou brinde', 'Remessa em bonificação, doação ou brinde', 'Remessa em bonificação, doação ou brinde', '6910', '', true,
  false, true, 'Estoque', 'Conta: Saída de amostra', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6911', 'Remessa de amostra grátis', 'Remessa de amostra grátis', 'Remessa de amostra grátis', '6911', '', true,
  false, true, 'Estoque', 'Conta: Saída de amostra', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6912', 'Remessa para demonstração', 'Remessa para demonstração', 'Remessa para demonstração', '6912', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6913', 'Retorno de mercadoria ou bem recebido para demonstração', 'Retorno de mercadoria ou bem recebido para demonstração', 'Retorno de mercadoria ou bem recebido para demonstração', '6913', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6914', 'Remessa de mercadoria ou bem para exposição ou feira', 'Remessa de mercadoria ou bem para exposição ou feira', 'Remessa de mercadoria ou bem para exposição ou feira', '6914', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6915', 'Remessa para conserto', 'Remessa para conserto', 'Remessa para conserto', '6915', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6916', 'Retorno de conserto', 'Retorno de conserto', 'Retorno de conserto', '6916', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6917', 'Remessa para consignação', 'Remessa para consignação', 'Remessa para consignação', '6917', '', true,
  false, true, 'Estoque', 'Estoque: Em poder de 3º', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6922', 'Simples faturamento de venda para entrega futura', 'Simples faturamento de venda para entrega futura', 'Simples faturamento de venda para entrega futura', '6922', '', true,
  true, false, 'Estoque', 'Conta', '16 Clientes (1.01.02.01.01)', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6923', 'Remessa por conta e ordem de terceiro, em venda à ordem', 'Remessa por conta e ordem de terceiro, em venda à ordem', 'Remessa por conta e ordem de terceiro, em venda à ordem', '6923', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6924', 'Remessa para industrialização por conta e ordem', 'Remessa para industrialização por conta e ordem', 'Remessa para industrialização por conta e ordem', '6924', '', true,
  false, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6925', 'Retorno de mercadoria industrializada por conta e ordem', 'Retorno de mercadoria industrializada por conta e ordem', 'Retorno de mercadoria industrializada por conta e ordem', '6925', '', true,
  false, true, 'Estoque de 3º consumido', 'Conta: Terceiro (ind)', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6949', 'Outras saídas', 'Outras saídas', 'Outras saídas', '6949', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6949-1', 'Remessa de material faltante', 'Remessa de material faltante', 'Remessa de material faltante', '6949', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6949-2', 'Remessa para utilização na prestação de serviço', 'Remessa para utilização na prestação de serviço', 'Remessa para utilização na prestação de serviço', '6949', '', true,
  false, false, 'Estoque', 'Conta', '', '400 - Não tributada pelo simples nacional'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '6999', 'Outros documentos', 'Outros documentos', 'Outros documentos', '6999', '', true,
  true, true, 'Estoque', 'Conta: CSV (Custo Serviços)', '16 Clientes (1.01.02.01.01)', ''
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '7101', 'Venda de produção do estabelecimento', 'Venda de produção do estabelecimento', 'Venda de produção do estabelecimento', '7101', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '300 - Imune'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '7102', 'Venda de mercadoria adquirida de terceiros', 'Venda de mercadoria adquirida de terceiros', 'Venda de mercadoria adquirida de terceiros', '7102', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '300 - Imune'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '7551', 'Venda de bem do ativo imobilizado', 'Venda de bem do ativo imobilizado', 'Venda de bem do ativo imobilizado', '7551', '', true,
  true, false, 'Estoque', 'Conta', '16 Clientes (1.01.02.01.01)', '300 - Imune'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '7651', 'Venda de combustível de produção do estabelecimento', 'Venda de combustível de produção do estabelecimento', 'Venda de combustível de produção do estabelecimento', '7651', '', true,
  true, true, 'Estoque', 'Conta: CPV (Custo Produtos)', '16 Clientes (1.01.02.01.01)', '300 - Imune'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '7654', 'Venda de combustível adquirido ou recebido de terceiros', 'Venda de combustível adquirido ou recebido de terceiros', 'Venda de combustível adquirido ou recebido de terceiros', '7654', '', true,
  true, true, 'Estoque', 'Conta: CMV (Custo Mercad)', '16 Clientes (1.01.02.01.01)', '300 - Imune'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '7949', 'Amostra grátis', 'Amostra grátis', 'Amostra grátis', '7949', '', true,
  false, false, 'Estoque', 'Conta', '', '300 - Imune'
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '9001', 'Tributação no município', 'Tributação no município', 'Tributação no município', '1', '', true,
  true, true, 'Estoque', 'Conta: CSV (Custo Serviços)', '16 Clientes (1.01.02.01.01)', ''
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '9002', 'Tributação fora do município', 'Tributação fora do município', 'Tributação fora do município', '2', '', true,
  true, true, 'Estoque', 'Conta: CSV (Custo Serviços)', '16 Clientes (1.01.02.01.01)', ''
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '9003', 'Isenção', 'Isenção', 'Isenção', '3', '', true,
  true, true, 'Estoque', 'Conta: CSV (Custo Serviços)', '16 Clientes (1.01.02.01.01)', ''
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '9004', 'Imune', 'Imune', 'Imune', '4', '', true,
  true, true, 'Estoque', 'Conta: CSV (Custo Serviços)', '16 Clientes (1.01.02.01.01)', ''
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '9005', 'Exigibilidade suspensa decisão judicial', 'Exigibilidade suspensa decisão judicial', 'Exigibilidade suspensa decisão judicial', '5', '', true,
  true, true, 'Estoque', 'Conta: CSV (Custo Serviços)', '16 Clientes (1.01.02.01.01)', ''
);

INSERT INTO fiscal_operations (
  company_id, code, name, description, nature_of_operation, cfop_intra, cfop_inter, active,
  with_payment, move_stock, stock_origin, stock_destination, payment_debit_account, cst
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  '9006', 'Exigibilidade suspensa procedimento adm', 'Exigibilidade suspensa procedimento adm', 'Exigibilidade suspensa procedimento adm', '6', '', true,
  true, true, 'Estoque', 'Conta: CSV (Custo Serviços)', '16 Clientes (1.01.02.01.01)', ''
);
