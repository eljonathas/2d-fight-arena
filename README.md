# Sticker Fighter

Um jogo de luta 2D multiplayer em tempo real, inspirado no estilo de Brawlhalla, utilizando WebSocket para comunicação em tempo real e PixiJS para renderização gráfica.

## Visão Geral

Sticker Fighter é um jogo multiplayer onde jogadores controlam personagens samurais em uma arena 2D. Os jogadores podem se movimentar, pular e atacar para derrotar seus oponentes. O jogo suporta múltiplos jogadores em tempo real através de WebSockets.

## Características

- Multiplayer em tempo real via WebSockets
- Sistema de salas para encontros privados
- Personagens com animações e habilidades diferentes
- Mapas variados com plataformas
- Interface de usuário moderna com Tailwind CSS
- Efeitos sonoros e música de fundo (simulados)
- Controles para teclado e dispositivos móveis

## Tecnologias Utilizadas

- **Frontend**: JavaScript Vanilla com módulos ES6, PixiJS, Tailwind CSS
- **Backend**: Node.js, Express, ws (WebSocket)
- **Gráficos**: Sprites e fundos de jogo pré-existentes

## Pré-requisitos

- Node.js v14+ e npm

## Instalação

1. Clone o repositório:

   ```
   git clone https://github.com/seu-usuario/sticker-fighter.git
   cd sticker-fighter
   ```

2. Instale as dependências:

   ```
   npm install
   ```

3. Inicie o servidor:

   ```
   npm start
   ```

4. Abra o navegador e acesse:
   ```
   http://localhost:3000
   ```

## Como Jogar

1. **Iniciar um jogo**:

   - Clique em "Criar Sala" para criar uma nova sala
   - Escolha seu personagem e o mapa
   - Compartilhe o código da sala com amigos
   - Clique em "Iniciar Jogo" quando todos estiverem prontos

2. **Entrar em um jogo**:

   - Clique em "Entrar em Sala"
   - Digite o código da sala
   - Escolha seu personagem
   - Aguarde o host iniciar o jogo

3. **Controles**:

   - Movimentação: Teclas A/D ou setas esquerda/direita
   - Pular: Tecla W, seta para cima, ou Espaço
   - Ataques: Teclas J, K, L (ataques diferentes)

4. **Objetivo**:
   - Derrotar os outros jogadores causando dano com seus ataques
   - O jogador com maior pontuação no final do tempo vence

## Estrutura do Projeto

```
sticker-fighter/
├── public/                # Arquivos estáticos
│   ├── assets/            # Recursos do jogo
│   │   ├── audio/         # Efeitos sonoros (simulados)
│   │   ├── backgrounds/   # Imagens de fundo
│   │   └── sprites/       # Sprites dos personagens
│   ├── css/               # Estilos CSS
│   ├── js/                # Código JavaScript
│   │   ├── modules/       # Módulos ES6
│   │   │   ├── AssetLoader.js  # Carregamento de recursos
│   │   │   ├── Game.js         # Lógica principal do jogo
│   │   │   ├── Map.js          # Gerenciamento de mapas
│   │   │   ├── Player.js       # Classe de jogador
│   │   │   ├── SoundManager.js # Gerenciamento de áudio
│   │   │   ├── UI.js           # Interface de usuário
│   │   │   └── WebSocketManager.js # Comunicação com o servidor
│   │   └── main.js         # Ponto de entrada
│   └── index.html         # Página HTML principal
├── server.js              # Servidor Node.js
├── package.json           # Dependências npm
└── README.md              # Documentação
```

## Desenvolvimento

- **Desenho e estilo dos personagens**: Utilizando spritesheets existentes
- **Mapa**s: Fundos pré-existentes com plataformas posicionadas estrategicamente
- **Comunicação em tempo real**: Implementada com WebSockets para sincronizar o estado do jogo entre jogadores

## Créditos

Os assets (sprites e backgrounds) utilizados são para fins de demonstração e/ou protótipo.

## Licença

Este projeto é de código aberto e está disponível sob a licença MIT.
