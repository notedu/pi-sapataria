-- DADOS FICTÍCIOS PARA TESTAR LOCALMENTE NO DBEAVER.
-- NÃO EXECUTE NA CONEXÃO DA AWS/PRODUÇÃO.
-- Pré-requisito: aplicar antes a migration backend/src/database/migrations/20261109_financeiro_operacional.sql.
-- Idempotente: não recria dados se encontrar o cliente marcador.
-- O script não apaga nem atualiza registros preexistentes (exceto seu snapshot de teste ao criar o histórico de correção).

BEGIN;

DO $seed$
DECLARE
  admin_id integer;
  cliente1 integer; cliente2 integer; cliente3 integer; cliente4 integer; cliente5 integer; cliente6 integer;
  produto_id integer;
  os_paga integer; os_nao_paga integer; os_cancelar integer; os_cancelada integer; os_ontem integer; os_entregue integer;
  venda_ativa integer; venda_cancelada integer;
  lancamento_id integer; lancamento_original integer; lancamento_estorno integer;
  parcela_id integer; parcela_aluguel integer; movimento_id integer;
  data_correcao date;
  snapshot jsonb;
  categoria_custom text := 'Manutenção (teste)';
  d date;
BEGIN
  IF current_database() <> 'sapataria' THEN
    RAISE EXCEPTION 'Carga cancelada: este script só é destinado ao banco local sapataria.';
  END IF;

  IF inet_server_addr() IS NULL OR NOT (
    inet_server_addr() <<= inet '127.0.0.0/8' OR inet_server_addr() = inet '::1'
  ) THEN
    RAISE EXCEPTION 'Carga cancelada: a conexão não está apontando para um servidor PostgreSQL local (loopback).';
  END IF;

  IF EXISTS (SELECT 1 FROM sapataria.clientes WHERE nome='TESTE FINANCEIRO - Cliente 01') THEN
    RAISE NOTICE 'Dados de teste já existem; nenhuma linha foi alterada.';
    RETURN;
  END IF;

  SELECT id INTO admin_id FROM sapataria.funcionarios
   WHERE perfil='administrador' AND ativo=true ORDER BY id LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'É necessário um Administrador ativo para atribuir a autoria dos dados de teste.';
  END IF;

  IF to_regclass('sapataria.categorias_despesas') IS NULL THEN
    RAISE EXCEPTION 'Aplique primeiro a migration 20261109_financeiro_operacional.sql.';
  END IF;

  INSERT INTO sapataria.categorias_despesas(nome)
  VALUES (categoria_custom) ON CONFLICT DO NOTHING;

  INSERT INTO sapataria.clientes
    (nome,telefone,endereco,numero,logradouro,bairro,cidade,uf,cep,email,observacoes)
  VALUES
    ('TESTE FINANCEIRO - Cliente 01','11900000001','Rua de Teste, 100','100','Rua de Teste','Centro','Santa Cruz das Palmeiras','SP','13650000','teste.financeiro.01@example.invalid','Dado fictício para testar OS paga'),
    ('TESTE FINANCEIRO - Cliente 02','11900000002','Rua de Teste, 101','101','Rua de Teste','Centro','Santa Cruz das Palmeiras','SP','13650000','teste.financeiro.02@example.invalid','Dado fictício para testar OS não paga'),
    ('TESTE FINANCEIRO - Cliente 03','11900000003','Rua de Teste, 102','102','Rua de Teste','Centro','Santa Cruz das Palmeiras','SP','13650000','teste.financeiro.03@example.invalid','Dado fictício para testar cancelamento'),
    ('TESTE FINANCEIRO - Cliente 04','11900000004','Rua de Teste, 103','103','Rua de Teste','Centro','Santa Cruz das Palmeiras','SP','13650000','teste.financeiro.04@example.invalid','Dado fictício para testar estorno já registrado'),
    ('TESTE FINANCEIRO - Cliente 05','11900000005','Rua de Teste, 104','104','Rua de Teste','Centro','Santa Cruz das Palmeiras','SP','13650000','teste.financeiro.05@example.invalid','Dado fictício para seleção manual de pagamentos'),
    ('TESTE FINANCEIRO - Cliente 06','11900000006','Rua de Teste, 105','105','Rua de Teste','Centro','Santa Cruz das Palmeiras','SP','13650000','teste.financeiro.06@example.invalid','Dado fictício para OS entregue')
  ;

  -- Recupera os IDs pelos marcadores estáveis (não depende da sequência gerada).
  SELECT id INTO cliente1 FROM sapataria.clientes WHERE nome='TESTE FINANCEIRO - Cliente 01';
  SELECT id INTO cliente2 FROM sapataria.clientes WHERE nome='TESTE FINANCEIRO - Cliente 02';
  SELECT id INTO cliente3 FROM sapataria.clientes WHERE nome='TESTE FINANCEIRO - Cliente 03';
  SELECT id INTO cliente4 FROM sapataria.clientes WHERE nome='TESTE FINANCEIRO - Cliente 04';
  SELECT id INTO cliente5 FROM sapataria.clientes WHERE nome='TESTE FINANCEIRO - Cliente 05';
  SELECT id INTO cliente6 FROM sapataria.clientes WHERE nome='TESTE FINANCEIRO - Cliente 06';

  INSERT INTO sapataria.produtos (nome,categoria,quantidade,quantidade_minima,preco_custo,preco_venda)
  VALUES ('TESTE FINANCEIRO - Produto para venda','Acessórios',8,2,25.00,100.00)
  RETURNING id INTO produto_id;
  INSERT INTO sapataria.movimentacoes_estoque (tipo,produto_id,quantidade,data,motivo,custo_unitario,custo_total)
  VALUES ('entrada',produto_id,10,CURRENT_TIMESTAMP-interval '2 days','TESTE FINANCEIRO - Saldo inicial',25.00,250.00);

  -- OS paga ao cadastro.
  INSERT INTO sapataria.ordens_servico (cliente_id,responsavel_id,descricao_calcado,servico,valor,status,forma_pagamento,observacoes)
  VALUES (cliente1,admin_id,'TESTE FINANCEIRO - Sapato social','TESTE FINANCEIRO - Restauração',520.00,'Aberta','dinheiro','Pagamento integral registrado na entrada') RETURNING id INTO os_paga;
  INSERT INTO sapataria.itens_ordem_servico (ordem_servico_id,descricao_item,servico) VALUES (os_paga,'Sapato social','Restauração');
  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,criado_por)
  VALUES ('entrada','ordem_servico','TESTE FINANCEIRO - OS paga',520.00,'ordem_servico',os_paga,admin_id) RETURNING id INTO lancamento_id;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
  VALUES (lancamento_id,1,1,520.00,CURRENT_DATE) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por)
  VALUES (parcela_id,520.00,'dinheiro',admin_id);

  -- OS não paga pronta: avance para Entregue na interface para testar a exigência da forma de pagamento.
  INSERT INTO sapataria.ordens_servico (cliente_id,responsavel_id,descricao_calcado,servico,valor,status,forma_pagamento,observacoes)
  VALUES (cliente2,admin_id,'TESTE FINANCEIRO - Bota','TESTE FINANCEIRO - Costura',240.00,'Pronta',NULL,'TESTE FINANCEIRO - OS pendente para testar pagamento na entrega') RETURNING id INTO os_nao_paga;
  INSERT INTO sapataria.itens_ordem_servico (ordem_servico_id,descricao_item,servico) VALUES (os_nao_paga,'Bota','Costura');
  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,criado_por)
  VALUES ('entrada','ordem_servico','TESTE FINANCEIRO - OS pendente',240.00,'ordem_servico',os_nao_paga,admin_id) RETURNING id INTO lancamento_id;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
  VALUES (lancamento_id,1,1,240.00,CURRENT_DATE);

  -- OS paga pronta: cancele pela interface para testar reembolso pelo mesmo meio.
  INSERT INTO sapataria.ordens_servico (cliente_id,responsavel_id,descricao_calcado,servico,valor,status,forma_pagamento,observacoes)
  VALUES (cliente3,admin_id,'TESTE FINANCEIRO - Tênis','TESTE FINANCEIRO - Colagem',180.00,'Pronta','credito','TESTE FINANCEIRO - OS paga disponível para cancelamento') RETURNING id INTO os_cancelar;
  INSERT INTO sapataria.itens_ordem_servico (ordem_servico_id,descricao_item,servico) VALUES (os_cancelar,'Tênis','Colagem');
  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,criado_por)
  VALUES ('entrada','ordem_servico','TESTE FINANCEIRO - OS pronta paga',180.00,'ordem_servico',os_cancelar,admin_id) RETURNING id INTO lancamento_id;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
  VALUES (lancamento_id,1,1,180.00,CURRENT_DATE) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por)
  VALUES (parcela_id,180.00,'credito',admin_id);

  -- OS já cancelada com reembolso para consulta do histórico financeiro.
  INSERT INTO sapataria.ordens_servico (cliente_id,responsavel_id,descricao_calcado,servico,valor,status,forma_pagamento,motivo_cancelamento,observacoes)
  VALUES (cliente4,admin_id,'TESTE FINANCEIRO - Sandália','TESTE FINANCEIRO - Reparo',120.00,'Cancelada','pix','TESTE FINANCEIRO - Cancelamento fictício','Reembolso integral de demonstração') RETURNING id INTO os_cancelada;
  INSERT INTO sapataria.itens_ordem_servico (ordem_servico_id,descricao_item,servico) VALUES (os_cancelada,'Sandália','Reparo');
  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,criado_por)
  VALUES ('entrada','ordem_servico','TESTE FINANCEIRO - OS cancelada original',120.00,'ordem_servico',os_cancelada,admin_id) RETURNING id INTO lancamento_original;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
  VALUES (lancamento_original,1,1,120.00,CURRENT_DATE) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por) VALUES (parcela_id,120.00,'pix',admin_id);
  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,estorno_de_id,motivo_estorno,criado_por)
  VALUES ('saida','estorno','TESTE FINANCEIRO - Reembolso OS cancelada',120.00,'ordem_servico',os_cancelada,lancamento_original,'TESTE FINANCEIRO - Reembolso integral pelo PIX',admin_id) RETURNING id INTO lancamento_estorno;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento) VALUES (lancamento_estorno,1,1,120.00,CURRENT_DATE) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por) VALUES (parcela_id,120.00,'pix',admin_id);

  -- OS já paga ontem: seus pagamentos ficam disponíveis para fechamento manual por seleção.
  INSERT INTO sapataria.ordens_servico (cliente_id,responsavel_id,descricao_calcado,servico,valor,status,forma_pagamento,observacoes)
  VALUES (cliente5,admin_id,'TESTE FINANCEIRO - Mocassim','TESTE FINANCEIRO - Polimento',75.00,'Aberta','debito','TESTE FINANCEIRO - Pagamento de ontem para seleção manual') RETURNING id INTO os_ontem;
  INSERT INTO sapataria.itens_ordem_servico (ordem_servico_id,descricao_item,servico) VALUES (os_ontem,'Mocassim','Polimento');
  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,criado_por)
  VALUES ('entrada','ordem_servico','TESTE FINANCEIRO - OS para manual de ontem',75.00,'ordem_servico',os_ontem,admin_id) RETURNING id INTO lancamento_id;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
  VALUES (lancamento_id,1,1,75.00,CURRENT_DATE-1) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,pago_em,criado_por)
  VALUES (parcela_id,75.00,'debito',((CURRENT_DATE-1)::timestamp+time '15:00') AT TIME ZONE 'America/Sao_Paulo',admin_id);

  -- OS entregue e quitada.
  INSERT INTO sapataria.ordens_servico (cliente_id,responsavel_id,descricao_calcado,servico,valor,status,forma_pagamento,observacoes)
  VALUES (cliente6,admin_id,'TESTE FINANCEIRO - Bota de couro','TESTE FINANCEIRO - Hidratação',300.00,'Entregue','pix','TESTE FINANCEIRO - OS entregue e paga') RETURNING id INTO os_entregue;
  INSERT INTO sapataria.itens_ordem_servico (ordem_servico_id,descricao_item,servico) VALUES (os_entregue,'Bota de couro','Hidratação');
  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,criado_por)
  VALUES ('entrada','ordem_servico','TESTE FINANCEIRO - OS entregue',300.00,'ordem_servico',os_entregue,admin_id) RETURNING id INTO lancamento_id;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento) VALUES (lancamento_id,1,1,300.00,CURRENT_DATE) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por) VALUES (parcela_id,300.00,'pix',admin_id);

  -- Venda ativa e venda cancelada com estorno total; ambas geram movimento de estoque.
  INSERT INTO sapataria.vendas (vendedor_id,forma_pagamento,total) VALUES (admin_id,'credito',200.00) RETURNING id INTO venda_ativa;
  INSERT INTO sapataria.itens_venda (venda_id,produto_id,quantidade,preco_unitario) VALUES (venda_ativa,produto_id,2,100.00);
  INSERT INTO sapataria.movimentacoes_estoque (tipo,produto_id,item_venda_id,quantidade,data,motivo,custo_unitario,custo_total)
  SELECT 'saida',iv.produto_id,iv.id,2,CURRENT_TIMESTAMP,'TESTE FINANCEIRO - Venda ativa',25.00,50.00 FROM sapataria.itens_venda iv WHERE iv.venda_id=venda_ativa;
  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,criado_por)
  VALUES ('entrada','venda','TESTE FINANCEIRO - Venda ativa',200.00,'venda',venda_ativa,admin_id) RETURNING id INTO lancamento_id;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento) VALUES (lancamento_id,1,1,200.00,CURRENT_DATE) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por) VALUES (parcela_id,200.00,'credito',admin_id);

  INSERT INTO sapataria.vendas (vendedor_id,forma_pagamento,total,cancelada_em) VALUES (admin_id,'pix',100.00,CURRENT_TIMESTAMP) RETURNING id INTO venda_cancelada;
  INSERT INTO sapataria.itens_venda (venda_id,produto_id,quantidade,preco_unitario) VALUES (venda_cancelada,produto_id,1,100.00);
  INSERT INTO sapataria.movimentacoes_estoque (tipo,produto_id,item_venda_id,quantidade,data,motivo,custo_unitario,custo_total)
  SELECT 'saida',iv.produto_id,iv.id,1,CURRENT_TIMESTAMP,'TESTE FINANCEIRO - Venda cancelada',25.00,25.00 FROM sapataria.itens_venda iv WHERE iv.venda_id=venda_cancelada RETURNING id INTO movimento_id;
  INSERT INTO sapataria.movimentacoes_estoque (tipo,produto_id,reversao_de_id,quantidade,data,motivo,custo_unitario,custo_total)
  VALUES ('entrada',produto_id,movimento_id,1,CURRENT_TIMESTAMP,'TESTE FINANCEIRO - Devolução no cancelamento',25.00,25.00);
  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,criado_por)
  VALUES ('entrada','venda','TESTE FINANCEIRO - Venda cancelada original',100.00,'venda',venda_cancelada,admin_id) RETURNING id INTO lancamento_original;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento) VALUES (lancamento_original,1,1,100.00,CURRENT_DATE) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por) VALUES (parcela_id,100.00,'pix',admin_id);
  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,origem_tipo,origem_id,estorno_de_id,motivo_estorno,criado_por)
  VALUES ('saida','estorno','TESTE FINANCEIRO - Estorno de venda',100.00,'venda',venda_cancelada,lancamento_original,'TESTE FINANCEIRO - Estorno total automático',admin_id) RETURNING id INTO lancamento_estorno;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento) VALUES (lancamento_estorno,1,1,100.00,CURRENT_DATE) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por) VALUES (parcela_id,100.00,'pix',admin_id);

  -- Contas a pagar: aluguel em três parcelas e pago parcialmente; outras despesas pagas.
  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,criado_por)
  VALUES ('saida','aluguel','TESTE FINANCEIRO - Aluguel parcelado',1200.00,admin_id) RETURNING id INTO lancamento_id;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
  VALUES (lancamento_id,1,3,400.00,CURRENT_DATE),(lancamento_id,2,3,400.00,(CURRENT_DATE+interval '1 month')::date),(lancamento_id,3,3,400.00,(CURRENT_DATE+interval '2 months')::date);
  SELECT p.id INTO parcela_aluguel FROM sapataria.parcelas_financeiras p
   JOIN sapataria.lancamentos_financeiros l ON l.id=p.lancamento_id
   WHERE l.descricao='TESTE FINANCEIRO - Aluguel parcelado' AND p.numero=1;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por) VALUES (parcela_aluguel,150.00,'dinheiro',admin_id);

  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,criado_por)
  VALUES ('saida','energia','TESTE FINANCEIRO - Energia paga',180.00,admin_id) RETURNING id INTO lancamento_id;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento) VALUES (lancamento_id,1,1,180.00,CURRENT_DATE) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por) VALUES (parcela_id,180.00,'pix',admin_id);

  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,criado_por)
  VALUES ('saida','agua','TESTE FINANCEIRO - Água paga',60.00,admin_id) RETURNING id INTO lancamento_id;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento) VALUES (lancamento_id,1,1,60.00,CURRENT_DATE) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por) VALUES (parcela_id,60.00,'dinheiro',admin_id);

  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,criado_por)
  VALUES ('saida','funcionarios','TESTE FINANCEIRO - Folha paga',950.00,admin_id) RETURNING id INTO lancamento_id;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento) VALUES (lancamento_id,1,1,950.00,CURRENT_DATE) RETURNING id INTO parcela_id;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por) VALUES (parcela_id,950.00,'debito',admin_id);

  INSERT INTO sapataria.lancamentos_financeiros (tipo,categoria,descricao,valor_total,criado_por)
  VALUES ('saida',categoria_custom,'TESTE FINANCEIRO - Manutenção em parcelas',350.00,admin_id) RETURNING id INTO lancamento_id;
  INSERT INTO sapataria.parcelas_financeiras (lancamento_id,numero,total_parcelas,valor,vencimento)
  VALUES (lancamento_id,1,2,175.00,CURRENT_DATE),(lancamento_id,2,2,175.00,(CURRENT_DATE+interval '1 month')::date);
  SELECT p.id INTO parcela_id FROM sapataria.parcelas_financeiras p
   JOIN sapataria.lancamentos_financeiros l ON l.id=p.lancamento_id
   WHERE l.descricao='TESTE FINANCEIRO - Manutenção em parcelas' AND p.numero=1;
  INSERT INTO sapataria.pagamentos_financeiros (parcela_id,valor,forma_pagamento,criado_por) VALUES (parcela_id,100.00,'credito',admin_id);

  -- 25 fechamentos históricos fictícios para exercitar paginação e filtro por datas.
  -- As duas classificações (forma e origem) conferem em R$ 220; saídas R$ 15; líquido R$ 205.
  FOR d IN SELECT g::date FROM generate_series(CURRENT_DATE-27,CURRENT_DATE-3,interval '1 day') AS g LOOP
    INSERT INTO sapataria.fechamentos_caixa
      (data,recebimentos_brutos,saidas,total_liquido,por_forma_pagamento,por_origem,saidas_por_categoria,modo,pagamentos_selecionados,itens_manuais,formato_manual,fonte_manual,resumo_manual,dinheiro_contado,diferenca_dinheiro,fechado_em,fechado_por)
    VALUES
      (d,220.00,15.00,205.00,
       '{"dinheiro":"25.00","pix":"50.00","credito":"125.00","debito":"20.00"}'::jsonb,
       '{"ordem_servico":"120.00","venda":"100.00","outro":"0.00"}'::jsonb,
       '{"manual":"15.00"}'::jsonb,'manual','[]'::jsonb,
       CASE WHEN EXTRACT(DAY FROM d)::int%2=0 THEN '[]'::jsonb ELSE
         jsonb_build_array(
           jsonb_build_object('descricao','TESTE FINANCEIRO - Serviços em dinheiro','tipo','entrada','valor','25.00','forma_pagamento','dinheiro','origem','ordem_servico'),
           jsonb_build_object('descricao','TESTE FINANCEIRO - Serviços em PIX','tipo','entrada','valor','50.00','forma_pagamento','pix','origem','ordem_servico'),
           jsonb_build_object('descricao','TESTE FINANCEIRO - Serviços em cartão','tipo','entrada','valor','45.00','forma_pagamento','credito','origem','ordem_servico'),
           jsonb_build_object('descricao','TESTE FINANCEIRO - Vendas em cartão','tipo','entrada','valor','80.00','forma_pagamento','credito','origem','venda'),
           jsonb_build_object('descricao','TESTE FINANCEIRO - Vendas em débito','tipo','entrada','valor','20.00','forma_pagamento','debito','origem','venda'),
           jsonb_build_object('descricao','TESTE FINANCEIRO - Saída','tipo','saida','valor','15.00','forma_pagamento',NULL,'origem','outro')
         ) END,
       CASE WHEN EXTRACT(DAY FROM d)::int%2=0 THEN 'resumo' ELSE 'detalhado' END,
       'valores',
       CASE WHEN EXTRACT(DAY FROM d)::int%2=0 THEN '{"dinheiro":"25.00","pix":"50.00","credito":"125.00","debito":"20.00","servicos":"120.00","vendas":"100.00","saidas":"15.00"}'::jsonb ELSE NULL END,
       24.50,-0.50,(d::timestamp+time '19:00') AT TIME ZONE 'America/Sao_Paulo',admin_id)
    ON CONFLICT (data) DO NOTHING;
  END LOOP;

  -- Um histórico de correção fictício, sem tocar fechamentos de usuário.
  SELECT data INTO data_correcao FROM sapataria.fechamentos_caixa
   WHERE itens_manuais::text LIKE '%TESTE FINANCEIRO - Serviços em dinheiro%'
     AND NOT EXISTS (SELECT 1 FROM sapataria.historico_fechamentos_caixa h WHERE h.data=fechamentos_caixa.data)
   ORDER BY data DESC LIMIT 1;
  IF data_correcao IS NOT NULL THEN
    SELECT to_jsonb(f) INTO snapshot FROM sapataria.fechamentos_caixa f WHERE f.data=data_correcao;
    INSERT INTO sapataria.historico_fechamentos_caixa(data,fechamento_anterior,corrigido_por,motivo)
    VALUES (data_correcao,snapshot,admin_id,'TESTE FINANCEIRO - Ajuste demonstrativo da contagem de dinheiro');
    UPDATE sapataria.fechamentos_caixa
       SET dinheiro_contado=25.00,diferenca_dinheiro=0.00,fechado_em=CURRENT_TIMESTAMP,fechado_por=admin_id
     WHERE data=data_correcao;
  END IF;

  RAISE NOTICE 'Dados fictícios TESTE FINANCEIRO incluídos. Hoje e ontem permanecem sem fechamento salvo para você testar os modos automático e manual.';
END
$seed$;

COMMIT;

SELECT 'Clientes de teste' AS verificacao,count(*) AS quantidade FROM sapataria.clientes WHERE nome LIKE 'TESTE FINANCEIRO - Cliente %'
UNION ALL SELECT 'OS de teste',count(*) FROM sapataria.ordens_servico WHERE descricao_calcado LIKE 'TESTE FINANCEIRO%'
UNION ALL SELECT 'Vendas de teste',count(*) FROM sapataria.vendas v JOIN sapataria.lancamentos_financeiros l ON l.origem_tipo='venda' AND l.origem_id=v.id WHERE l.descricao LIKE 'TESTE FINANCEIRO%'
UNION ALL SELECT 'Fechamentos históricos',count(*) FROM sapataria.fechamentos_caixa WHERE data BETWEEN CURRENT_DATE-27 AND CURRENT_DATE-3 AND modo='manual'
UNION ALL SELECT 'Categorias personalizadas de teste',count(*) FROM sapataria.categorias_despesas WHERE nome='Manutenção (teste)';
