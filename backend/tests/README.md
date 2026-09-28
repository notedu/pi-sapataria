# Teste de desativação de funcionários

`desativacao.cjs` executa a aplicação Express e o PostgreSQL reais com dados fictícios. Usa as dependências já instaladas, sem bibliotecas adicionais.

Prepare uma instância **local descartável** de PostgreSQL com TLS e um banco vazio chamado `sapataria_desativacao_teste`. O certificado deve ser válido para o hostname utilizado. Não use o banco da aplicação. A suíte recusa hosts diferentes de `localhost`/`127.0.0.1`, outro nome de banco e a presença prévia do schema `sapataria`.

Dentro de `backend/`, execute (substituindo usuário, porta e caminho do certificado):

```bash
TEST_DATABASE_URL='postgresql://usuario@127.0.0.1:55439/sapataria_desativacao_teste' \
TEST_DATABASE_CA_FILE='/caminho/do/certificado-local.crt' \
node --require tsx/cjs tests/desativacao.cjs
```

A suíte configura suas próprias variáveis de conexão/sessão antes de importar a aplicação. Cria o schema com o SQL versionado, insere contas e um histórico fictício com vínculo de chave estrangeira, inicia HTTP em uma porta local livre e remove o schema ao terminar. Não mostra senhas reais e não usa as credenciais do `.env` da aplicação. Se houver interrupção abrupta, recrie a instância descartável antes de repetir: não remova schemas de bancos existentes para satisfazer o teste.

Cobertura: ausência de sessão, perfil insuficiente, CSRF, senha ausente/incorreta/do alvo, bloqueio da própria conta nas duas rotas, IDs inválidos/inexistentes, corpo inválido, sucesso, preservação do histórico, versão de acesso, sessões invalidadas após reativação, limite de tentativas independente do login e dois Administradores tentando desativar um ao outro simultaneamente. A segunda operação concorrente deve detectar a sessão invalidada.

Essa suíte não valida a configuração de um banco remoto ou de produção. A interface também precisa ser verificada no navegador.
