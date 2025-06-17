#!/bin/bash

echo "🎮 Iniciando o jogo Pedra, Papel e Tesoura em tempo real..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Verificar se o Redis já está rodando
if docker ps | grep -q redis-game; then
    echo "✅ Redis já está rodando"
else
    echo "🚀 Iniciando Redis..."
    docker-compose up -d redis
    echo "⏳ Aguardando Redis inicializar..."
    sleep 3
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    yarn install
fi

echo "🎯 Iniciando servidor de desenvolvimento..."
echo "🌐 Acesse: http://localhost:5173"
echo "📊 Redis: http://localhost:6379"
echo ""
echo "Para parar o servidor, pressione Ctrl+C"
echo "Para parar o Redis: docker-compose down"

# Iniciar o servidor de desenvolvimento
yarn dev 