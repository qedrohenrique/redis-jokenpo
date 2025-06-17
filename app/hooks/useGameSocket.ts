import { useCallback, useEffect, useRef, useState } from 'react';
import type { Player } from '../redis/gameService';

interface GameMessage {
  type: 'MOVE' | 'PLAYER_JOIN' | 'PLAYER_LEAVE' | 'GAME_RESULT' | 'GAME_RESET' | 'INITIAL_DATA';
  player?: Player;
  playerId?: string;
  winner?: string | null;
  loser?: string | null;
  isDraw?: boolean;
  players?: Player[];
  timestamp: number;
}

export function useGameSocket() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameResult, setGameResult] = useState<{ winner: string | null; loser: string | null; isDraw: boolean } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<GameMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Usar Server-Sent Events (SSE) como alternativa ao WebSocket
    // já que estamos em um ambiente React Router
    const eventSource = new EventSource('/api/game/events');

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('Conectado ao servidor de eventos');
    };

    eventSource.onmessage = (event) => {
      try {
        const message: GameMessage = JSON.parse(event.data);
        setLastMessage(message);

        console.log('Mensagem recebida:', message.type, message);

        switch (message.type) {
          case 'INITIAL_DATA':
            if (message.players) {
              setPlayers(message.players);
              console.log('Dados iniciais recebidos:', message.players);
            }
            break;

          case 'PLAYER_JOIN':
            if (message.player) {
              setPlayers(prev => {
                const exists = prev.find(p => p.id === message.player!.id);
                if (!exists) {
                  console.log('Adicionando novo jogador:', message.player!.name);
                  return [...prev, message.player!];
                }
                console.log('Jogador já existe:', message.player!.name);
                return prev;
              });
            }
            break;

          case 'PLAYER_LEAVE':
            if (message.playerId) {
              setPlayers(prev => {
                const filtered = prev.filter(p => p.id !== message.playerId);
                console.log('Jogador removido:', message.playerId, 'Jogadores restantes:', filtered.length);
                return filtered;
              });
            }
            break;

          case 'MOVE':
            if (message.player) {
              setPlayers(prev =>
                prev.map(p =>
                  p.id === message.player!.id
                    ? { ...p, choice: message.player!.choice, timestamp: message.player!.timestamp }
                    : p
                )
              );
              console.log('Jogada atualizada:', message.player.name, message.player.choice);
            }
            break;

          case 'GAME_RESULT':
            setGameResult({
              winner: message.winner || null,
              loser: message.loser || null,
              isDraw: message.isDraw || false
            });
            console.log('Resultado do jogo:', message.winner || 'Empate');
            break;

          case 'GAME_RESET':
            setPlayers([]);
            setGameResult(null);
            console.log('Jogo resetado');
            break;
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Erro na conexão SSE:', error);
      setIsConnected(false);
    };

    // Armazenar referência para poder fechar depois
    (eventSource as any).ref = eventSource;
    wsRef.current = eventSource as any;
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      if ('close' in wsRef.current) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    players,
    gameResult,
    isConnected,
    lastMessage,
    connect,
    disconnect
  };
} 