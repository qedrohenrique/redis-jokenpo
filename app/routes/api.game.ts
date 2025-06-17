import { GameService, type Player } from "../redis/gameService";

interface RouteActionArgs {
  request: Request;
}

interface RouteLoaderArgs {
  request: Request;
}

export async function action({ request }: RouteActionArgs) {
  const formData = await request.formData();
  const action = formData.get('action') as string;

  try {
    switch (action) {
      case 'join':
        const playerName = formData.get('playerName') as string;
        const playerId = GameService.generatePlayerId();

        const player: Player = {
          id: playerId,
          name: playerName,
          timestamp: Date.now()
        };

        const joinResult = await GameService.publishPlayerJoin(player);

        if (joinResult.success) {
          return { success: true, playerId, player };
        } else {
          return { success: false, error: joinResult.error };
        }

      case 'move':
        const movePlayerId = formData.get('playerId') as string;
        const choice = formData.get('choice') as string;

        // Buscar dados do jogador
        const players = await GameService.getActivePlayers();
        const movePlayer = players.find(p => p.id === movePlayerId);

        if (!movePlayer) {
          return { success: false, error: 'Jogador não encontrado' };
        }

        // Atualizar jogada do jogador
        movePlayer.choice = choice;
        movePlayer.timestamp = Date.now();

        await GameService.publishMove(movePlayer);

        // Verificar se todos os jogadores fizeram suas jogadas
        const activePlayers = await GameService.getActivePlayers();
        const playersWithMoves = activePlayers.filter(p => p.choice);

        if (playersWithMoves.length >= 2 && playersWithMoves.length === activePlayers.length) {
          // Todos fizeram suas jogadas, determinar vencedor e perdedor
          const gameResult = GameService.determineGameResult(playersWithMoves);
          await GameService.publishGameResult(gameResult.winner, gameResult.loser, gameResult.isDraw);
        }

        return { success: true, player: movePlayer };

      case 'leave':
        const leavePlayerId = formData.get('playerId') as string;
        await GameService.publishPlayerLeave(leavePlayerId);
        return { success: true };

      case 'reset':
        await GameService.clearGameState();
        return { success: true };

      case 'getPlayers':
        const allPlayers = await GameService.getActivePlayers();
        return { success: true, players: allPlayers };

      default:
        return { success: false, error: 'Ação inválida' };
    }
  } catch (error) {
    console.error('Erro na API do jogo:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

export async function loader({ }: RouteLoaderArgs) {
  try {
    const players = await GameService.getActivePlayers();
    return { players };
  } catch (error) {
    console.error('Erro ao carregar jogadores:', error);
    return { players: [] };
  }
} 