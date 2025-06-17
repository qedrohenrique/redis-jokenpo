# 🎮 Jogo Pedra, Papel e Tesoura em Tempo Real

Um jogo multiplayer de Pedra, Papel e Tesoura implementado com React Router, TypeScript e Redis para comunicação em tempo real, incluindo sistema de ranking e estatísticas dos jogadores.

## 🚀 Funcionalidades

### 🎯 **Jogo Multiplayer**
- **Limite de 2 jogadores**: Sistema de sala com máximo de 2 jogadores por jogo
- **Jogadas em tempo real**: Todos os jogadores veem as escolhas simultaneamente
- **Resultado automático**: Sistema determina vencedor, perdedor ou empate
- **Interface responsiva**: Funciona em desktop e mobile

### 🏆 **Sistema de Ranking**
- **Top 5 jogadores**: Ranking baseado em número de vitórias
- **Estatísticas completas**: Vitórias, derrotas, empates e total de jogos
- **Persistência**: Dados mantidos entre sessões
- **Atualização automática**: Ranking atualiza após cada jogo

### ⚡ **Comunicação em Tempo Real**
- **Server-Sent Events (SSE)**: Comunicação bidirecional cliente-servidor
- **Notificações instantâneas**: Todos os clientes recebem atualizações
- **Status de conexão**: Indicador visual do estado da conexão
- **Sincronização automática**: Estado consistente entre todos os jogadores

### 🎨 **Interface Moderna**
- **Status do jogo**: Mostra quantos jogadores estão online
- **Perfil do jogador**: Informações pessoais e escolhas
- **Lista de jogadores**: Visualização de todos os participantes
- **Resultados visuais**: Emojis e cores para melhor experiência
- **Botões intuitivos**: Interface clara e fácil de usar

## 🛠️ Tecnologias

### **Frontend**
- **React 19**: Framework principal
- **React Router 7**: Roteamento e API routes
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização moderna

### **Backend**
- **Node.js**: Runtime JavaScript
- **React Router**: API routes para backend
- **ioredis**: Cliente Redis para Node.js

### **Banco de Dados & Comunicação**
- **Redis**: Banco de dados em memória
- **Server-Sent Events**: Comunicação em tempo real
- **Pub/Sub**: Sistema de mensagens

## 📋 Pré-requisitos

- **Node.js 18+**
- **Docker e Docker Compose** (para Redis)
- **Yarn ou npm**

## 🚀 Como executar

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd redis-game
```

### 2. Instale as dependências
```bash
yarn install
```

### 3. Inicie o Redis
```bash
# Usando Docker (recomendado)
docker compose up -d redis

# Ou se já tem Redis instalado
redis-server
```

### 4. Execute o projeto
```bash
# Desenvolvimento
yarn dev

# Ou usando o script completo
yarn dev:full
```

O projeto estará disponível em `http://localhost:5173`

## 🎯 Como jogar

1. **Entre no jogo**: Digite seu nome e clique em "Entrar no Jogo"
2. **Aguarde outro jogador**: Veja o status "1/2 Jogadores"
3. **Faça sua jogada**: Escolha entre Pedra 🪨, Papel 📄 ou Tesoura ✂️
4. **Veja o resultado**: Vencedor e perdedor são anunciados
5. **Jogue novamente**: Clique em "Novo Jogo" para reiniciar
6. **Crie novo jogo**: Use "Criar Novo Jogo" para limpar tudo

## 🔧 Configuração do Redis

O projeto usa as seguintes variáveis de ambiente:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Por padrão, conecta-se ao Redis local na porta 6379 sem senha.

## 📁 Estrutura do Projeto

```
redis-game/
├── app/
│   ├── hooks/
│   │   └── useGameSocket.ts          # Hook para comunicação em tempo real
│   ├── redis/
│   │   ├── client.ts                 # Configuração do cliente Redis
│   │   └── gameService.ts            # Lógica do jogo e Redis
│   ├── routes/
│   │   ├── api.game.ts               # API para ações do jogo
│   │   ├── api.game.events.ts        # Server-Sent Events
│   │   ├── api.ranking.ts            # API para ranking
│   │   └── home.tsx                  # Página principal
│   └── welcome/
│       └── welcome.tsx               # Componente do jogo
├── scripts/
│   └── dev.sh                        # Script de desenvolvimento
├── docker-compose.yml                # Configuração do Redis
└── package.json
```

## 🔄 Fluxo de Comunicação

1. **Jogador entra**: Publica mensagem no canal Redis
2. **Jogador faz jogada**: Atualiza estado e notifica outros
3. **Resultado**: Sistema determina vencedor automaticamente
4. **Estatísticas**: Ranking é atualizado
5. **Notificações**: Todos os clientes recebem atualizações via SSE

## 🏆 Sistema de Ranking

### **Como funciona**
- **Vitórias**: +1 ponto no ranking
- **Derrotas**: +1 contador de derrotas
- **Empates**: +1 contador de empates
- **Ordenação**: Por número de vitórias (decrescente)
- **Persistência**: Dados mantidos no Redis

### **Estrutura de Dados**
```redis
# Ranking ordenado por vitórias
ZADD game:ranking 5 "João"
ZADD game:ranking 3 "Maria"

# Estatísticas individuais
HSET player:João wins 5 losses 2 draws 1 totalGames 8
HSET player:Maria wins 3 losses 4 draws 1 totalGames 8
```

## 🚀 Funcionalidades do Redis Exploradas

### **1. Armazenamento de Dados Estruturados (Hash)**
```redis
# Jogadores ativos
HSET game:players player_id player_data
HGETALL game:players
HDEL game:players player_id

# Estatísticas dos jogadores
HSET player:nome wins losses draws totalGames
HGETALL player:nome
```

### **2. Conjuntos Ordenados (Sorted Set)**
```redis
# Ranking de jogadores
ZADD game:ranking score player_name
ZREVRANGE game:ranking 0 4  # Top 5
```

### **3. Sistema de Pub/Sub (Publish/Subscribe)**
```redis
# Canal de comunicação em tempo real
PUBLISH rock-paper-scissors message
SUBSCRIBE rock-paper-scissors
```

### **4. Duplicação de Conexões**
```javascript
const subscriber = redis.duplicate();
subscriber.subscribe('rock-paper-scissors');
```

### **5. Operações de Limpeza**
```redis
DEL game:players
DEL game:ranking
```

### **6. Operações Atômicas**
```javascript
await redis.hset(statsKey, stats);
await redis.zadd(RANKING_KEY, stats.wins, playerName);
```

### **7. Padrões de Chave**
```redis
game:players          # Jogadores ativos
game:ranking          # Ranking ordenado
player:nome           # Estatísticas individuais
```

### **8. Consultas Eficientes**
```redis
ZREVRANGE game:ranking 0 4  # Top 5 jogadores
```

### **9. Persistência de Dados**
- **Jogadores**: Resetados a cada novo jogo
- **Ranking**: Mantido entre sessões
- **Estatísticas**: Acumulativas por jogador

### **10. Tratamento de Erros**
```javascript
redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});
```

## 🎨 Interface

### **Tela Inicial**
- **Status de conexão**: Indicador visual do estado
- **Status do jogo**: Mostra quantos jogadores estão online
- **Formulário de entrada**: Campo para nome do jogador
- **Botões de ação**: Entrar no jogo e criar novo jogo
- **Ranking**: Tabela com top 5 jogadores

### **Interface do Jogo**
- **Perfil do jogador**: Nome, ID e escolha atual
- **Lista de jogadores**: Todos os participantes online
- **Botões de jogada**: Pedra, Papel e Tesoura
- **Resultado**: Vencedor, perdedor ou empate
- **Controles**: Sair do jogo e novo jogo

## 🐛 Solução de Problemas

### **Redis não conecta**
```bash
# Verifique se o Redis está rodando
docker compose ps

# Reinicie o Redis se necessário
docker compose restart redis

# Ou verifique Redis local
redis-cli ping
```

### **Erro de conexão SSE**
- Verifique se o servidor está rodando
- Confirme que a porta 5173 está livre
- Verifique os logs do console do navegador

### **Ranking não aparece**
```bash
# Verifique dados no Redis
redis-cli zrevrange game:ranking 0 4
redis-cli hgetall player:nome
```

## 📊 Scripts Disponíveis

```bash
# Desenvolvimento
yarn dev                    # Servidor de desenvolvimento
yarn dev:full              # Script completo com Redis

# Redis
yarn redis:start           # Iniciar Redis
yarn redis:stop            # Parar Redis
yarn redis:logs            # Ver logs do Redis
yarn redis:restart         # Reiniciar Redis

# Build
yarn build                 # Build de produção
yarn start                 # Servidor de produção
yarn typecheck            # Verificação de tipos
```

## 🎯 Exemplo de Uso

1. **Abra múltiplas abas** do navegador
2. **Entre com nomes diferentes** em cada aba
3. **Faça jogadas** em cada aba
4. **Veja as atualizações** em tempo real
5. **Observe o ranking** atualizar automaticamente
6. **Teste o reset** do jogo

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 🗄️ Entidades do Redis (Visão SQL)

Para facilitar o entendimento da estrutura de dados, aqui está uma comparação das entidades do Redis com tabelas SQL equivalentes:

### **Tabela: `game_players` (Hash)**
```sql
-- Equivalente SQL
CREATE TABLE game_players (
    player_id VARCHAR(255) PRIMARY KEY,
    player_data JSON NOT NULL
);

-- Exemplo de dados
INSERT INTO game_players VALUES 
('player_1234567890_abc123', '{"id":"player_1234567890_abc123","name":"João","choice":"Pedra","timestamp":1703123456789}'),
('player_1234567891_def456', '{"id":"player_1234567891_def456","name":"Maria","choice":"Papel","timestamp":1703123456790}');
```

**Redis:**
```redis
HSET game:players player_1234567890_abc123 '{"id":"player_1234567890_abc123","name":"João","choice":"Pedra","timestamp":1703123456789}'
HSET game:players player_1234567891_def456 '{"id":"player_1234567891_def456","name":"Maria","choice":"Papel","timestamp":1703123456790}'
```

### **Tabela: `player_stats` (Hash)**
```sql
-- Equivalente SQL
CREATE TABLE player_stats (
    player_name VARCHAR(255) PRIMARY KEY,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0,
    total_games INT DEFAULT 0
);

-- Exemplo de dados
INSERT INTO player_stats VALUES 
('João', 5, 2, 1, 8),
('Maria', 3, 4, 1, 8),
('Pedro', 7, 1, 0, 8);
```

**Redis:**
```redis
HSET player:João wins 5 losses 2 draws 1 totalGames 8
HSET player:Maria wins 3 losses 4 draws 1 totalGames 8
HSET player:Pedro wins 7 losses 1 draws 0 totalGames 8
```

### **Tabela: `game_ranking` (Sorted Set)**
```sql
-- Equivalente SQL
CREATE TABLE game_ranking (
    player_name VARCHAR(255) PRIMARY KEY,
    wins INT NOT NULL,
    UNIQUE KEY idx_wins (wins, player_name)
);

-- Exemplo de dados (ordenados por wins DESC)
INSERT INTO game_ranking VALUES 
('Pedro', 7),
('João', 5),
('Maria', 3);
```

**Redis:**
```redis
ZADD game:ranking 7 "Pedro"
ZADD game:ranking 5 "João"
ZADD game:ranking 3 "Maria"
```

### **Tabela: `game_events` (Pub/Sub)**
```sql
-- Equivalente SQL (conceitual - não existe em SQL tradicional)
CREATE TABLE game_events (
    event_id AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('PLAYER_JOIN', 'PLAYER_LEAVE', 'MOVE', 'GAME_RESULT', 'GAME_RESET'),
    event_data JSON,
    timestamp BIGINT,
    subscribers JSON -- Lista de clientes inscritos
);
```

**Redis:**
```redis
-- Canal de eventos
PUBLISH rock-paper-scissors '{"type":"PLAYER_JOIN","player":{"name":"João","id":"player_123"},"timestamp":1703123456789}'
SUBSCRIBE rock-paper-scissors
```

### **Relacionamentos e Consultas**

#### **1. Buscar Top 5 Jogadores**
```sql
-- SQL
SELECT player_name, wins, losses, draws, total_games 
FROM player_stats 
ORDER BY wins DESC 
LIMIT 5;
```

```redis
-- Redis
ZREVRANGE game:ranking 0 4
-- Depois buscar estatísticas completas
HGETALL player:João
HGETALL player:Maria
-- etc...
```

#### **2. Contar Jogadores Ativos**
```sql
-- SQL
SELECT COUNT(*) as active_players FROM game_players;
```

```redis
-- Redis
HLEN game:players
```

#### **3. Buscar Jogador Específico**
```sql
-- SQL
SELECT * FROM game_players WHERE player_id = 'player_1234567890_abc123';
```

```redis
-- Redis
HGET game:players player_1234567890_abc123
```

#### **4. Atualizar Estatísticas**
```sql
-- SQL
UPDATE player_stats 
SET wins = wins + 1, total_games = total_games + 1 
WHERE player_name = 'João';
```

```redis
-- Redis
HINCRBY player:João wins 1
HINCRBY player:João totalGames 1
ZADD game:ranking [novo_score] "João"
```

### **Vantagens do Redis vs SQL**

| Aspecto | Redis | SQL |
|---------|-------|-----|
| **Performance** | Operações em memória (microssegundos) | Operações em disco (milissegundos) |
| **Estruturas** | Hash, Sorted Set, List, String | Apenas tabelas relacionais |
| **Pub/Sub** | Nativo e eficiente | Requer implementação adicional |
| **Ordenação** | Automática em Sorted Sets | Requer ORDER BY |
| **Flexibilidade** | Dados JSON, múltiplos tipos | Estrutura rígida |
| **Escalabilidade** | Horizontal com cluster | Mais complexo |

### **Padrões de Nomenclatura**

```redis
# Namespace:game:entidade
game:players          # Jogadores ativos no jogo
game:ranking          # Ranking ordenado por vitórias

# Namespace:player:nome
player:João           # Estatísticas do jogador João
player:Maria          # Estatísticas do jogador Maria

# Namespace:canal:eventos
rock-paper-scissors   # Canal de eventos do jogo
```

Esta estrutura permite uma organização clara e eficiente dos dados, mantendo a performance e flexibilidade do Redis enquanto oferece uma visão familiar para desenvolvedores acostumados com bancos relacionais.

---

**Desenvolvido com ❤️ usando React, TypeScript e Redis**
