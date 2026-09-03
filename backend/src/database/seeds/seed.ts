// seed.ts
import pool from "../../config/db.js";

async function seed() {
  // A ordem de exclusão é o INVERSO da ordem de criação:
  // apagamos primeiro quem "depende" de outras tabelas (ordens_servico),
  // senão o banco recusa apagar uma tabela referenciada por outra (erro de FK).
  await pool.query("DELETE FROM ordens_servico");
  await pool.query("DELETE FROM clientes");
  await pool.query("DELETE FROM funcionarios");
  await pool.query("DELETE FROM servicos");

  // ===== 1. Insere clientes =====
  // RETURNING id nos devolve os IDs gerados, que vamos usar depois em ordens_servico
  const clientes = await pool.query(`
    INSERT INTO clientes (nome, cpf, telefone, genero, endereco) VALUES
    ('Maria Silva', '111.111.111-11', '(19) 99999-0001', 'Feminino', 'Rua A, 100'),
    ('João Souza', '222.222.222-22', '(19) 99999-0002', 'Masculino', 'Rua B, 200'),
    ('Ana Costa', '333.333.333-33', '(19) 99999-0003', 'Feminino', 'Rua C, 300')
    RETURNING id
  `);

  // ===== 2. Insere funcionários =====
  const funcionarios = await pool.query(`
    INSERT INTO funcionarios (nome, cpf, telefone, genero, cargo, status, data_admissao) VALUES
    ('Carlos Pereira', '444.444.444-44', '(19) 98888-0001', 'Masculino', 'Sapateiro', 'Ativo', '2023-03-15'),
    ('Fernanda Lima', '555.555.555-55', '(19) 98888-0002', 'Feminino', 'Atendente', 'Ativo', '2024-06-01'),
    ('Roberto Alves', '666.666.666-66', '(19) 98888-0003', 'Masculino', 'Sapateiro', 'Inativo', '2021-01-10')
    RETURNING id
  `);

  // ===== 3. Insere tipos de serviço =====
  const servicos = await pool.query(`
    INSERT INTO servicos (nome, descricao) VALUES
    ('Troca de sola', 'Substituição completa da sola do calçado'),
    ('Costura', 'Reparo de costuras soltas ou rasgadas'),
    ('Tingimento', 'Alteração da cor original do item')
    RETURNING id
  `);

  // Extrai os arrays de IDs para facilitar a leitura ao montar ordens_servico
  const idsClientes = clientes.rows.map((c) => c.id); // ex: [1, 2, 3]
  const idsFuncionarios = funcionarios.rows.map((f) => f.id); // ex: [1, 2]
  const idsServicos = servicos.rows.map((s) => s.id); // ex: [1, 2, 3]

  // ===== 4. Insere ordens de serviço, usando os IDs reais gerados acima =====
  await pool.query(
    `INSERT INTO ordens_servico
      (cliente_id, funcionario_id, servico_id, descricao_item, cor_item, observacoes, valor_servico, status)
     VALUES
      ($1, $2, $3, 'Sapato social', 'Preto', 'Cliente pediu urgência', 80.00, 'Pendente'),
      ($4, $5, $6, 'Bota de couro', 'Marrom', NULL, 120.00, 'Em andamento'),
      ($7, $8, $9, 'Tênis casual', 'Branco', 'Trocar também os cadarços', 60.00, 'Concluído')`,
    [
      idsClientes[0],
      idsFuncionarios[0],
      idsServicos[0], // ordem 1
      idsClientes[1],
      idsFuncionarios[1],
      idsServicos[1], // ordem 2
      idsClientes[2],
      idsFuncionarios[0],
      idsServicos[2], // ordem 3
    ],
  );

  // ===== Estoque: DELETE (parte a adicionar no início do seed, junto dos outros DELETEs) =====
  await pool.query("DELETE FROM estoque_materia_prima");
  await pool.query("DELETE FROM estoque_produtos_venda");

  // ===== 5. Insere matéria-prima em estoque =====
  await pool.query(`
    INSERT INTO estoque_materia_prima
      (nome, descricao, unidade_medida, quantidade, quantidade_minima, valor_unitario, fornecedor) VALUES
      ('Couro sintético preto', 'Usado na fabricação de solados e reparos', 'metro', 25.5, 5, 18.90, 'Fornecedor Couros SP'),
      ('Linha de costura reforçada', 'Linha resistente para costura de calçados', 'unidade', 40, 10, 3.50, 'Casa da Costura'),
      ('Cola de contato', 'Usada na colagem de solas', 'litro', 8, 2, 45.00, 'Química Industrial LTDA'),
      ('Sola de borracha', 'Sola pronta para substituição', 'unidade', 15, 5, 22.00, 'Fornecedor Couros SP')
  `);

  // ===== 6. Insere produtos de venda em estoque =====
  await pool.query(`
  INSERT INTO estoque_produtos_venda
    (nome, descricao, quantidade, valor_custo, valor_venda, categoria) VALUES
    ('Sapato social masculino nº 42', 'Sapato social de couro legítimo', 8, 90.00, 180.00, 'Calçados'),
    ('Kit limpeza de calçados', 'Kit com escova, pano e produto de limpeza', 20, 12.00, 25.00, 'Acessórios'),
    ('Tênis casual unissex nº 39', 'Tênis casual em tecido e couro sintético', 5, 60.00, 130.00, 'Calçados'),
    ('Palmilha ortopédica', 'Palmilha de conforto e suporte', 30, 8.00, 22.00, 'Acessórios')
  `);

  console.log("✅ Seed executado com sucesso!");
  process.exit(); // encerra o script após terminar (senão o pool fica "pendurado")
}

seed().catch((error) => {
  console.error("❌ Erro ao executar seed:", error);
  process.exit(1); // código de saída 1 indica que houve falha
});
