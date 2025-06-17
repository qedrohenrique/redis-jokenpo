"use client";

import { useEffect, useState } from "react";
import { useGameSocket } from "../hooks/useGameSocket";
import type { Player } from "../redis/gameService";

interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
}

export function Welcome() {
  const [playerName, setPlayerName] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ranking, setRanking] = useState<PlayerStats[]>([]);
  const [isRankingLoading, setIsRankingLoading] = useState(false);

  const { players, gameResult, isConnected, lastMessage } = useGameSocket();

  // Detectar quando o jogo é resetado e voltar para a tela inicial
  useEffect(() => {
    if (lastMessage?.type === 'GAME_RESET' && isJoined) {
      setCurrentPlayer(null);
      setIsJoined(false);
      setPlayerName("");
    }
  }, [lastMessage, isJoined]);

  // Buscar ranking ao montar ou quando há resultado de jogo
  useEffect(() => {
    const fetchRanking = async () => {
      setIsRankingLoading(true);
      try {
        const res = await fetch('/api/ranking');
        const data = await res.json();
        setRanking(data.topPlayers || []);
      } catch (e) {
        setRanking([]);
      } finally {
        setIsRankingLoading(false);
      }
    };

    fetchRanking();
  }, []); // Carregar apenas na primeira vez

  // Atualizar ranking quando há resultado de jogo
  useEffect(() => {
    if (lastMessage?.type === 'GAME_RESULT') {
      const fetchRanking = async () => {
        try {
          const res = await fetch('/api/ranking');
          const data = await res.json();
          setRanking(data.topPlayers || []);
        } catch (e) {
          console.error('Erro ao atualizar ranking:', e);
        }
      };
      fetchRanking();
    }
  }, [lastMessage?.type === 'GAME_RESULT' ? lastMessage.timestamp : null]);

  const joinGame = async () => {
    if (!playerName.trim()) {
      alert("Por favor, digite seu nome primeiro!");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('action', 'join');
      formData.append('playerName', playerName);

      const response = await fetch('/api/game', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setCurrentPlayer(result.player);
        setIsJoined(true);
        console.log('Jogador entrou no jogo:', result.player);
      } else {
        alert('Erro ao entrar no jogo: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao entrar no jogo:', error);
      alert('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const makeMove = async (choice: string) => {
    if (!currentPlayer) {
      alert("Você precisa entrar no jogo primeiro!");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('action', 'move');
      formData.append('playerId', currentPlayer.id);
      formData.append('choice', choice);

      const response = await fetch('/api/game', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        console.log(`Jogada realizada: ${choice}`);
      } else {
        alert('Erro ao fazer jogada: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao fazer jogada:', error);
      alert('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveGame = async () => {
    if (!currentPlayer) return;

    try {
      const formData = new FormData();
      formData.append('action', 'leave');
      formData.append('playerId', currentPlayer.id);

      await fetch('/api/game', {
        method: 'POST',
        body: formData
      });

      setCurrentPlayer(null);
      setIsJoined(false);
      setPlayerName("");
    } catch (error) {
      console.error('Erro ao sair do jogo:', error);
    }
  };

  const resetGame = async () => {
    try {
      const formData = new FormData();
      formData.append('action', 'reset');

      await fetch('/api/game', {
        method: 'POST',
        body: formData
      });

      // Voltar para a tela inicial
      setCurrentPlayer(null);
      setIsJoined(false);
      setPlayerName("");
    } catch (error) {
      console.error('Erro ao resetar jogo:', error);
    }
  };

  const createNewGame = async () => {
    try {
      const formData = new FormData();
      formData.append('action', 'reset');

      await fetch('/api/game', {
        method: 'POST',
        body: formData
      });

      alert('Novo jogo criado! Todos os dados anteriores foram limpos.');
    } catch (error) {
      console.error('Erro ao criar novo jogo:', error);
      alert('Erro ao criar novo jogo');
    }
  };

  const getChoiceEmoji = (choice: string) => {
    switch (choice) {
      case 'Pedra': return '🪨';
      case 'Papel': return '📄';
      case 'Tesoura': return '✂️';
      default: return '';
    }
  };

  return (
    <main className="flex flex-col items-center justify-center pt-16 pb-4 gap-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Pedra, Papel e Tesoura</h1>
        <p className="text-gray-600 mb-4">Jogo em tempo real com Redis</p>

        {/* Status da conexão */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      {/* Formulário de entrada */}
      {!isJoined && (
        <div className="w-full max-w-md">
          {/* Status do jogo */}
          <div className="mb-4 p-3 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status do Jogo:</span>
              <span className={`text-sm px-2 py-1 rounded-full ${players.length >= 2
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
                }`}>
                {players.length >= 2 ? 'Jogo Cheio' : `${players.length}/2 Jogadores`}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="playerName" className="block text-sm font-medium mb-2">
              Digite seu nome:
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Seu nome aqui..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || players.length >= 2}
            />
          </div>
          <button
            onClick={joinGame}
            disabled={isLoading || !playerName.trim() || players.length >= 2}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : players.length >= 2 ? 'Jogo Cheio' : 'Entrar no Jogo'}
          </button>

          <button
            onClick={createNewGame}
            disabled={isLoading}
            className="w-full mt-2 px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🆕 Criar Novo Jogo
          </button>

          {/* Ranking */}
          <div className="mt-8">
            <h3 className="text-lg text-black font-bold mb-2 text-center">🏅 Ranking Top 5</h3>
            {isRankingLoading ? (
              <div className="text-center text-gray-500 text-black">Carregando ranking...</div>
            ) : ranking.length === 0 ? (
              <div className="text-center text-gray-400 text-black">Nenhum jogo registrado ainda.</div>
            ) : (
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-2 text-black">#</th>
                    <th className="py-2 px-2 text-left text-black">Nome</th>
                    <th className="py-2 px-2 text-black">Vitórias</th>
                    <th className="py-2 px-2 text-black">Empates</th>
                    <th className="py-2 px-2 text-black">Derrotas</th>
                    <th className="py-2 px-2 text-black">Jogos</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((player, idx) => (
                    <tr key={player.name} className="odd:bg-white even:bg-gray-50">
                      <td className="py-1 px-2 text-center font-bold text-black">{idx + 1}</td>
                      <td className="py-1 px-2 text-black">{player.name}</td>
                      <td className="py-1 px-2 text-center text-green-700 font-semibold text-black">{player.wins}</td>
                      <td className="py-1 px-2 text-center text-black">{player.draws}</td>
                      <td className="py-1 px-2 text-center text-red-700 text-black">{player.losses}</td>
                      <td className="py-1 px-2 text-center text-black">{player.totalGames}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Interface do jogo */}
      {isJoined && currentPlayer && (
        <div className="w-full">
          {/* Informações do jogador atual */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-black mb-2">Seu perfil</h2>
            <p className="text-black"><strong>Nome:</strong> {currentPlayer.name}</p>
            <p className="text-black"><strong>ID:</strong> {currentPlayer.id}</p>
            {currentPlayer.choice && (
              <p className="text-black"><strong>Sua escolha:</strong> {getChoiceEmoji(currentPlayer.choice)} {currentPlayer.choice}</p>
            )}
            <button
              onClick={leaveGame}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Sair do Jogo
            </button>
          </div>

          {/* Lista de jogadores */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Jogadores Online ({players.length}/2)</h3>
            <div className="grid gap-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg border text-black ${player.id === currentPlayer.id
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {player.name}
                      {player.id === currentPlayer.id && ' (Você)'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {player.choice ? (
                        <span className="flex items-center gap-1">
                          {getChoiceEmoji(player.choice)} {player.choice}
                        </span>
                      ) : (
                        'Aguardando...'
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botões de jogada */}
          {!currentPlayer.choice && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Faça sua jogada:</h3>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => makeMove("Pedra")}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  🪨 Pedra
                </button>
                <button
                  onClick={() => makeMove("Papel")}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  📄 Papel
                </button>
                <button
                  onClick={() => makeMove("Tesoura")}
                  disabled={isLoading}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  ✂️ Tesoura
                </button>
              </div>
            </div>
          )}

          {/* Resultado do jogo */}
          {gameResult && (
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg text-black font-semibold mb-2">Resultado do Jogo</h3>
                {gameResult.isDraw ? (
                  <p className="text-xl text-black">🤝 Empate!</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xl text-green-600 font-bold">
                      🏆 Vencedor: {gameResult.winner}
                    </p>
                    <p className="text-lg text-red-600">
                      💀 Perdedor: {gameResult.loser}
                    </p>
                  </div>
                )}
                <button
                  onClick={resetGame}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Novo Jogo
                </button>
              </div>
            </div>
          )}

          {/* Última mensagem */}
          {lastMessage && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <strong>Última atividade:</strong> {new Date(lastMessage.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
