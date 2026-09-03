-- ========================================
-- TABELA: clientes
-- ========================================
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,              -- identificador único, auto-incrementado
    nome VARCHAR(100) NOT NULL,         -- nome do cliente (obrigatório)
    cpf VARCHAR(14) UNIQUE NOT NULL,    -- CPF (único, evita cadastro duplicado)
    telefone VARCHAR(20) NOT NULL,      -- telefone de contato
    genero VARCHAR(20),                 -- gênero do cliente
    endereco VARCHAR(200),              -- endereço (opcional, por isso sem NOT NULL)
    criado_em TIMESTAMP DEFAULT NOW()   -- data/hora do cadastro (preenchido automaticamente)
);

-- ========================================
-- TABELA: funcionarios
-- ========================================
CREATE TABLE funcionarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    genero VARCHAR(20),
    cargo VARCHAR(50) NOT NULL,          -- função do funcionário (ex: "Sapateiro", "Atendente")
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',  -- segue o mesmo padrão do status em ordens_servico
    data_admissao DATE DEFAULT CURRENT_DATE,      -- data de entrada na equipe
    criado_em TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- TABELA: servicos
-- ========================================
-- Funciona como um "catálogo" dos tipos de serviço oferecidos
-- (ex: "Troca de sola", "Costura", "Tingimento"), evitando repetir
-- texto solto em cada ordem de serviço.
CREATE TABLE servicos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,  -- nome do tipo de serviço (não pode repetir)
    descricao VARCHAR(200)              -- detalhamento opcional do serviço
);

-- ========================================
-- TABELA: ordens_servico
-- ========================================
CREATE TABLE ordens_servico (
    id SERIAL PRIMARY KEY,

    -- FOREIGN KEY: conecta a ordem ao cliente já cadastrado.
    -- Assim não repetimos "nome do cliente" e "telefone" aqui;
    -- basta buscar esses dados através do cliente_id.
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),

    -- FOREIGN KEY: qual funcionário está responsável pela ordem
    funcionario_id INTEGER REFERENCES funcionarios(id),

    -- FOREIGN KEY: qual tipo de serviço será realizado
    servico_id INTEGER NOT NULL REFERENCES servicos(id),

    descricao_item VARCHAR(200) NOT NULL,  -- descrição do item (ex: "Sapato social preto")
    cor_item VARCHAR(30),                   -- cor do item
    observacoes VARCHAR(300),               -- observações gerais da ordem
    valor_servico NUMERIC(10,2) NOT NULL,   -- valor cobrado (10 dígitos, 2 casas decimais)

    status VARCHAR(20) DEFAULT 'Pendente',  -- status da ordem (ex: Pendente, Em andamento, Concluído)
    criado_em TIMESTAMP DEFAULT NOW()       -- data/hora de abertura da ordem
);

-- ========================================
-- TABELA: estoque_materia_prima
-- ========================================
-- Insumos usados na fabricação/manutenção dos produtos (ex: couro, linha, cola)
CREATE TABLE estoque_materia_prima (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,                    -- ex: "Couro sintético preto"
    descricao VARCHAR(200),                        -- detalhamento opcional
    unidade_medida VARCHAR(20) NOT NULL,            -- ex: "metro", "litro", "kg", "unidade"
    quantidade NUMERIC(10,2) NOT NULL DEFAULT 0,    -- quantidade disponível em estoque
    quantidade_minima NUMERIC(10,2),                -- ponto de alerta de reposição (opcional)
    valor_unitario NUMERIC(10,2),                   -- custo de compra por unidade
    fornecedor VARCHAR(100),                        -- fornecedor do insumo (opcional)
    atualizado_em TIMESTAMP DEFAULT NOW()           -- última movimentação de estoque
);

-- ========================================
-- TABELA: estoque_produtos_venda
-- ========================================
-- Produtos prontos, vendidos diretamente na loja
    CREATE TABLE estoque_produtos_venda (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,                     -- ex: "Sapato social masculino nº 42"
    descricao VARCHAR(200),                         -- detalhamento opcional
    quantidade INTEGER NOT NULL DEFAULT 0,          -- quantidade disponível em estoque
    valor_custo NUMERIC(10,2),                      -- quanto custou produzir/adquirir
    valor_venda NUMERIC(10,2) NOT NULL,             -- preço cobrado do cliente
    categoria VARCHAR(50),                          -- ex: "Calçados", "Acessórios"
    atualizado_em TIMESTAMP DEFAULT NOW()           -- última movimentação de estoque
);