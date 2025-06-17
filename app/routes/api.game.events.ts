import redis from '../redis/client';

interface RouteLoaderArgs {
  request: Request;
}

export async function loader({ request }: RouteLoaderArgs) {
  const url = new URL(request.url);

  // Configurar headers para Server-Sent Events
  const headers = new Headers();
  headers.set('Content-Type', 'text/event-stream');
  headers.set('Cache-Control', 'no-cache');
  headers.set('Connection', 'keep-alive');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Headers', 'Cache-Control');

  const stream = new ReadableStream({
    start(controller) {
      const subscriber = redis.duplicate();

      subscriber.subscribe('rock-paper-scissors', (err) => {
        if (err) {
          console.error('Erro ao se inscrever no canal:', err);
          controller.error(err);
          return;
        }

        console.log('Inscrito no canal rock-paper-scissors');
      });

      subscriber.on('message', (channel, message) => {
        try {
          const data = JSON.parse(message);
          const eventData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(eventData));
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      });

      subscriber.on('error', (error) => {
        console.error('Erro no subscriber:', error);
        controller.error(error);
      });

      // Enviar dados iniciais dos jogadores
      const sendInitialData = async () => {
        try {
          const playersData = await redis.hgetall('game:players');
          const players = [];

          for (const [id, data] of Object.entries(playersData)) {
            if (data) {
              players.push(JSON.parse(data));
            }
          }

          const initialData = {
            type: 'INITIAL_DATA',
            players: players.sort((a: any, b: any) => a.timestamp - b.timestamp),
            timestamp: Date.now()
          };

          const eventData = `data: ${JSON.stringify(initialData)}\n\n`;
          controller.enqueue(new TextEncoder().encode(eventData));
        } catch (error) {
          console.error('Erro ao enviar dados iniciais:', error);
        }
      };

      sendInitialData();

      // Limpeza quando a conexão for fechada
      request.signal.addEventListener('abort', () => {
        subscriber.unsubscribe();
        subscriber.disconnect();
        controller.close();
      });
    }
  });

  return new Response(stream, { headers });
} 