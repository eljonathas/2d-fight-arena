import { AssetLoader } from "./AssetLoader.js";

/**
 * Classe que representa um mapa do jogo
 */
export class GameMap {
  /**
   * Cria uma nova instância de mapa
   * @param {object} options - Opções de configuração
   */
  constructor(options) {
    this.name = options.name;
    this.container = new PIXI.Container();
    this.layers = [];
    this.platforms = [];
    this.width = options.width || 1280;
    this.height = options.height || 720;

    // Carregar mapa
    this.loadMap();

    // Configurar plataformas
    this.setupPlatforms();
  }

  /**
   * Carrega as camadas do mapa
   */
  loadMap() {
    // Carregar múltiplas camadas de fundo na ordem correta
    const maxLayers = 5;

    // Array para armazenar camadas carregadas
    const layerSprites = [];

    // Primeiro carregar todas as camadas
    for (let i = 1; i <= maxLayers; i++) {
      const texture = AssetLoader.getTexture(`${this.name}_layer${i}`);

      if (texture) {
        const sprite = new PIXI.Sprite(texture);

        // Ajustar escala para preencher a tela
        const scale = Math.max(
          this.width / sprite.width,
          this.height / sprite.height
        );

        sprite.scale.set(scale, scale);

        // Centralizar na tela
        sprite.position.set(
          (this.width - sprite.width * scale) / 2,
          (this.height - sprite.height * scale) / 2
        );

        // Calcular o fator de parallax com base na camada
        // As camadas de fundo (números menores) devem se mover mais lentamente
        const parallaxFactor = i / maxLayers; // 0.2, 0.4, 0.6, 0.8, 1.0
        sprite.layerIndex = i;
        sprite.parallaxFactor = parallaxFactor;

        layerSprites.push(sprite);
      }
    }

    // Ordenar camadas pelo índice para garantir que sejam adicionadas na ordem correta
    // Camada 1 (céu/fundo distante) deve aparecer primeiro, seguida pelas outras camadas
    layerSprites.sort((a, b) => a.layerIndex - b.layerIndex);

    // Adicionar camadas ao container na ordem correta
    layerSprites.forEach((sprite) => {
      this.layers.push(sprite);
      this.container.addChild(sprite);
    });
  }

  /**
   * Configura as plataformas do mapa
   */
  setupPlatforms() {
    // Configuração de plataformas específicas para cada mapa
    switch (this.name) {
      case "Castle":
        this.platforms = [
          { x: 0, y: 550, width: this.width, height: 10 }, // Chão
          { x: 200, y: 450, width: 200, height: 10 },
          { x: 500, y: 350, width: 300, height: 10 },
          { x: 900, y: 450, width: 200, height: 10 },
        ];
        break;

      case "Castle_Entry":
        this.platforms = [
          { x: 0, y: 550, width: this.width, height: 10 }, // Chão
          { x: 100, y: 400, width: 200, height: 10 },
          { x: 400, y: 300, width: 150, height: 10 },
          { x: 700, y: 350, width: 150, height: 10 },
          { x: 950, y: 250, width: 200, height: 10 },
        ];
        break;

      case "Dead_Forest":
        this.platforms = [
          { x: 0, y: 550, width: this.width, height: 10 }, // Chão
          { x: 150, y: 450, width: 150, height: 10 },
          { x: 400, y: 380, width: 150, height: 10 },
          { x: 650, y: 450, width: 150, height: 10 },
          { x: 900, y: 380, width: 150, height: 10 },
        ];
        break;

      case "Throne":
        this.platforms = [
          { x: 0, y: 550, width: this.width, height: 10 }, // Chão
          { x: 300, y: 400, width: 200, height: 10 },
          { x: 500, y: 300, width: 300, height: 10 },
          { x: 800, y: 400, width: 200, height: 10 },
        ];
        break;

      default:
        // Plataforma padrão (apenas o chão)
        this.platforms = [{ x: 0, y: 550, width: this.width, height: 10 }];
    }

    this.platforms.forEach((platform) => {
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0x00ff00, 0.3);
      graphics.drawRect(
        platform.x,
        platform.y,
        platform.width,
        platform.height
      );
      graphics.endFill();
      this.container.addChild(graphics);
    });
  }

  /**
   * Aplica efeito de parallax
   * @param {number} playerX - Posição X do jogador
   */
  applyParallax(playerX) {
    // Calcular deslocamento com base na posição do jogador
    const centerX = this.width / 2;
    const offsetX = (centerX - playerX) / centerX;

    // Aplicar parallax a cada camada
    this.layers.forEach((layer) => {
      // Calcular o deslocamento baseado no fator de parallax da camada
      // Camadas com índice menor (fundo) devem se mover menos
      const layerOffset = offsetX * 100 * layer.parallaxFactor;

      layer.position.x =
        (this.width - layer.width * layer.scale.x) / 2 + layerOffset;
    });
  }

  /**
   * Obtém a definição das plataformas
   * @returns {Array} - Lista de plataformas
   */
  getPlatforms() {
    return this.platforms;
  }

  /**
   * Atualiza o mapa
   * @param {number} deltaTime - Tempo desde o último frame
   * @param {object} player - Jogador principal para efeito de parallax
   */
  update(deltaTime, player) {
    if (player && player.position) {
      this.applyParallax(player.position.x);
    }
  }
}
