-- Aplicar uma vez após funcionarios.sql. Não preenche nem apaga dados antigos.
BEGIN;
ALTER TABLE sapataria.funcionarios ADD COLUMN cpf text, ADD COLUMN telefone text;
ALTER TABLE sapataria.funcionarios
  ADD CONSTRAINT funcionarios_cpf_formato CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$'),
  ADD CONSTRAINT funcionarios_telefone_formato CHECK (telefone IS NULL OR telefone ~ '^[0-9]{11}$');
-- Exige os campos no cadastro/edição pessoal, sem bloquear desativação de legados.
CREATE FUNCTION sapataria.exigir_dados_pessoais_funcionario() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.cpf IS NULL OR NEW.telefone IS NULL THEN
    RAISE EXCEPTION 'CPF e telefone são obrigatórios no cadastro e edição pessoal.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER funcionarios_dados_obrigatorios
BEFORE INSERT OR UPDATE OF nome, email, cpf, telefone ON sapataria.funcionarios
FOR EACH ROW EXECUTE FUNCTION sapataria.exigir_dados_pessoais_funcionario();
COMMIT;
