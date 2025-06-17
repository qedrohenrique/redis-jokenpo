import redis from './client';

export interface Player {
  id: string;
  name: string;
  choice?: string;
  timestamp: number;
}

export interface GameState {
  players: Player[];
  gameStarted: boolean;
  gameEnded: boolean;
  winner?: string;
}

const GAME_CHANNEL = 'rock-paper-scissors';
const GAME_STATE_KEY = 'game:state';
const PLAYERS_KEY = 'game:players';
const RANKING_KEY = 'game:ranking';

export interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
}

export class GameService {
  // Publicar uma jogada no canal Redis
  static async publishMove(player: Player): Promise<void> {
    try {
      await redis.publish(GAME_CHANNEL, JSON.stringify({
        type: 'MOVE',
        player,
        timestamp: Date.now()
      }));

      // Atualizar o estado do jogador
      await redis.hset(PLAYERS_KEY, player.id, JSON.stringify(player));

      console.log(`Jogada publicada: ${player.name} escolheu ${player.choice}`);
    } catch (error) {
      console.error('Erro ao publicar jogada:', error);
      throw error;
    }
  }

  // Publicar entrada de um jogador
  static async publishPlayerJoin(player: Player): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar se já há 2 jogadores
      const currentPlayers = await this.getActivePlayers();
      if (currentPlayers.length >= 2) {
        return {
          success: false,
          error: 'Jogo cheio! Máximo de 2 jogadores permitidos.'
        };
      }

      // Primeiro adicionar o jogador à lista
      await redis.hset(PLAYERS_KEY, player.id, JSON.stringify(player));

      // Depois publicar a notificação
      await redis.publish(GAME_CHANNEL, JSON.stringify({
        type: 'PLAYER_JOIN',
        player,
        timestamp: Date.now()
      }));

      console.log(`Jogador entrou: ${player.name} (ID: ${player.id})`);
      return { success: true };
    } catch (error) {
      console.error('Erro ao adicionar jogador:', error);
      throw error;
    }
  }

  // Publicar saída de um jogador
  static async publishPlayerLeave(playerId: string): Promise<void> {
    try {
      await redis.publish(GAME_CHANNEL, JSON.stringify({
        type: 'PLAYER_LEAVE',
        playerId,
        timestamp: Date.now()
      }));

      // Remover jogador da lista
      await redis.hdel(PLAYERS_KEY, playerId);

      console.log(`Jogador saiu: ${playerId}`);
    } catch (error) {
      console.error('Erro ao remover jogador:', error);
      throw error;
    }
  }

  // Obter todos os jogadores ativos
  static async getActivePlayers(): Promise<Player[]> {
    try {
      const playersData = await redis.hgetall(PLAYERS_KEY);
      const players: Player[] = [];

      for (const [id, data] of Object.entries(playersData)) {
        if (data) {
          players.push(JSON.parse(data));
        }
      }

      return players.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Erro ao obter jogadores:', error);
      return [];
    }
  }

  // Determinar o vencedor e perdedor do jogo
  static determineGameResult(players: Player[]): { winner: string | null; loser: string | null; isDraw: boolean } {
    const choices = players.map(p => p.choice).filter(Boolean);

    if (choices.length < 2) {
      return { winner: null, loser: null, isDraw: false };
    }

    const uniqueChoices = [...new Set(choices)];

    // Se todos escolheram a mesma coisa, é empate
    if (uniqueChoices.length === 1) {
      return { winner: null, loser: null, isDraw: true };
    }

    // Se há 3 escolhas diferentes, é empate
    if (uniqueChoices.length === 3) {
      return { winner: null, loser: null, isDraw: true };
    }

    // Determinar vencedor baseado nas regras do jogo
    const rules = {
      'Pedra': 'Tesoura',
      'Papel': 'Pedra',
      'Tesoura': 'Papel'
    };

    // Se há apenas 2 escolhas diferentes
    if (uniqueChoices.length === 2) {
      const [choice1, choice2] = uniqueChoices;

      if (rules[choice1 as keyof typeof rules] === choice2) {
        // choice1 vence, choice2 perde
        const winner = players.find(p => p.choice === choice1);
        const loser = players.find(p => p.choice === choice2);
        return {
          winner: winner?.name || null,
          loser: loser?.name || null,
          isDraw: false
        };
      } else {
        // choice2 vence, choice1 perde
        const winner = players.find(p => p.choice === choice2);
        const loser = players.find(p => p.choice === choice1);
        return {
          winner: winner?.name || null,
          loser: loser?.name || null,
          isDraw: false
        };
      }
    }

    return { winner: null, loser: null, isDraw: false };
  }

  // Determinar o vencedor do jogo (método legado para compatibilidade)
  static determineWinner(players: Player[]): string | null {
    const result = this.determineGameResult(players);
    return result.winner;
  }

  // Publicar resultado do jogo
  static async publishGameResult(winner: string | null, loser: string | null, isDraw: boolean): Promise<void> {
    try {
      // Atualizar estatísticas dos jogadores
      if (isDraw) {
        // Empate - ambos ganham um empate
        if (winner) await this.updatePlayerStats(winner, 'draw');
        if (loser) await this.updatePlayerStats(loser, 'draw');
      } else {
        // Vitória/derrota
        if (winner) await this.updatePlayerStats(winner, 'win');
        if (loser) await this.updatePlayerStats(loser, 'loss');
      }

      await redis.publish(GAME_CHANNEL, JSON.stringify({
        type: 'GAME_RESULT',
        winner,
        loser,
        isDraw,
        timestamp: Date.now()
      }));

      if (isDraw) {
        console.log(`Resultado do jogo: Empate!`);
      } else {
        console.log(`Resultado do jogo: ${winner} venceu, ${loser} perdeu`);
      }
    } catch (error) {
      console.error('Erro ao publicar resultado:', error);
      throw error;
    }
  }

  // Limpar estado do jogo
  static async clearGameState(): Promise<void> {
    try {
      await redis.del(PLAYERS_KEY);
      await this.clearRanking();
      await redis.publish(GAME_CHANNEL, JSON.stringify({
        type: 'GAME_RESET',
        timestamp: Date.now()
      }));

      console.log('Estado do jogo limpo');
    } catch (error) {
      console.error('Erro ao limpar estado:', error);
      throw error;
    }
  }

  // Gerar ID único para jogador
  static generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Atualizar estatísticas do jogador
  static async updatePlayerStats(playerName: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    try {
      const statsKey = `player:${playerName}`;
      const currentStats = await redis.hgetall(statsKey);

      const stats: PlayerStats = {
        name: playerName,
        wins: parseInt(currentStats.wins || '0'),
        losses: parseInt(currentStats.losses || '0'),
        draws: parseInt(currentStats.draws || '0'),
        totalGames: parseInt(currentStats.totalGames || '0')
      };

      // Atualizar estatísticas
      stats.totalGames++;
      if (result === 'win') stats.wins++;
      else if (result === 'loss') stats.losses++;
      else if (result === 'draw') stats.draws++;

      // Salvar no Redis
      await redis.hset(statsKey, {
        name: stats.name,
        wins: stats.wins.toString(),
        losses: stats.losses.toString(),
        draws: stats.draws.toString(),
        totalGames: stats.totalGames.toString()
      });

      // Atualizar ranking
      await redis.zadd(RANKING_KEY, stats.wins, playerName);

      console.log(`Estatísticas atualizadas para ${playerName}: ${result}`);
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  }

  // Obter top 5 jogadores
  static async getTopPlayers(): Promise<PlayerStats[]> {
    try {
      // Obter top 5 por vitórias
      const topPlayerNames = await redis.zrevrange(RANKING_KEY, 0, 4);
      const topPlayers: PlayerStats[] = [];

      for (const playerName of topPlayerNames) {
        const statsKey = `player:${playerName}`;
        const stats = await redis.hgetall(statsKey);

        if (stats.name) {
          topPlayers.push({
            name: stats.name,
            wins: parseInt(stats.wins || '0'),
            losses: parseInt(stats.losses || '0'),
            draws: parseInt(stats.draws || '0'),
            totalGames: parseInt(stats.totalGames || '0')
          });
        }
      }

      return topPlayers;
    } catch (error) {
      console.error('Erro ao obter ranking:', error);
      return [];
    }
  }

  // Limpar ranking (usado no reset do jogo)
  static async clearRanking(): Promise<void> {
    try {
      await redis.del(RANKING_KEY);
      console.log('Ranking limpo');
    } catch (error) {
      console.error('Erro ao limpar ranking:', error);
    }
  }
} 