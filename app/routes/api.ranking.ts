import { GameService } from "../redis/gameService";

interface RouteLoaderArgs {
  request: Request;
}

export async function loader({ }: RouteLoaderArgs) {
  try {
    const topPlayers = await GameService.getTopPlayers();
    return { topPlayers };
  } catch (error) {
    console.error('Erro ao carregar ranking:', error);
    return { topPlayers: [] };
  }
} 