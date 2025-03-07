/**
 * Gerenciador de carregamento de recursos
 */
export const AssetLoader = {
  // Cache de texturas e sprites
  textures: {},
  spritesheets: {},
  audioFiles: {},

  /**
   * Carrega todos os recursos necessários para o jogo
   * @returns {Promise} - Promise resolvida quando todos os recursos forem carregados
   */
  async loadAllAssets() {
    try {
      await Promise.all([
        this.loadCharacters(),
        this.loadMaps(),
        this.loadSounds(),
      ]);

      console.log("Todos os recursos foram carregados");
      return true;
    } catch (error) {
      console.warn("Alguns recursos não puderam ser carregados:", error);
      return true; // Continuar mesmo com erros
    }
  },

  /**
   * Obtém o número correto de frames para cada animação com base em análise dos arquivos
   * @param {string} character - Nome do personagem
   * @param {string} animation - Nome da animação
   * @returns {number} - Número de frames
   */
  getCorrectFrameCount(character, animation) {
    // Mapeamento específico por personagem e animação
    const frameMapping = {
      Samurai: {
        Idle: 6,
        Walk: 9,
        Run: 8,
        Jump: 10,
        Attack_1: 4,
        Attack_2: 4,
        Attack_3: 4,
        Hurt: 3,
        Dead: 6,
        Protection: 2,
      },
      Samurai_Archer: {
        Idle: 9,
        Walk: 8,
        Run: 8,
        Jump: 9,
        Attack_1: 4,
        Attack_2: 4,
        Attack_3: 4,
        Hurt: 3,
        Dead: 5,
        Protection: 11, // Usando mesmo número de frames que Idle
      },
      Samurai_Commander: {
        Idle: 5,
        Walk: 9,
        Run: 8,
        Jump: 7,
        Attack_1: 4,
        Attack_2: 4,
        Attack_3: 4,
        Hurt: 2,
        Dead: 6,
        Protection: 2,
      },
    };

    // Retornar o número de frames ou um valor padrão
    return frameMapping[character]?.[animation] || 6;
  },

  /**
   * Carrega os sprites dos personagens
   * @returns {Promise} - Promise resolvida quando todos os sprites forem carregados
   */
  async loadCharacters() {
    const characters = ["Samurai", "Samurai_Archer", "Samurai_Commander"];
    const promises = [];

    characters.forEach((character) => {
      // Configurações específicas para cada personagem
      let animations;

      if (character === "Samurai") {
        animations = [
          { name: "Idle", file: "Idle" },
          { name: "Walk", file: "Walk" },
          { name: "Run", file: "Run" },
          { name: "Jump", file: "Jump" },
          { name: "Attack_1", file: "Attack_1" },
          { name: "Attack_2", file: "Attack_2" },
          { name: "Attack_3", file: "Attack_3" },
          { name: "Hurt", file: "Hurt" },
          { name: "Dead", file: "Dead" },
          { name: "Protection", file: "Protection" },
        ];
      } else if (character === "Samurai_Archer") {
        animations = [
          { name: "Idle", file: "Idle" },
          { name: "Walk", file: "Walk" },
          { name: "Run", file: "Run" },
          { name: "Jump", file: "Jump" },
          { name: "Attack_1", file: "Attack_1" },
          { name: "Attack_2", file: "Attack_2" },
          { name: "Attack_3", file: "Attack_3" },
          { name: "Hurt", file: "Hurt" },
          { name: "Dead", file: "Dead" },
          { name: "Protection", file: "Idle" },
        ];
      } else if (character === "Samurai_Commander") {
        animations = [
          { name: "Idle", file: "Idle" },
          { name: "Walk", file: "Walk" },
          { name: "Run", file: "Run" },
          { name: "Jump", file: "Jump" },
          { name: "Attack_1", file: "Attack_1" },
          { name: "Attack_2", file: "Attack_2" },
          { name: "Attack_3", file: "Attack_3" },
          { name: "Hurt", file: "Hurt" },
          { name: "Dead", file: "Dead" },
          { name: "Protection", file: "Protection" },
        ];
      }

      animations.forEach((animation) => {
        const fileName = animation.file;
        // Obter o número correto de frames para esta animação
        const framesCount = this.getCorrectFrameCount(
          character,
          animation.name
        );

        promises.push(
          this.loadSpritesheet(
            `${character}_${animation.name}`,
            `assets/sprites/${character}/${fileName}.png`,
            framesCount
          ).catch((error) => {
            console.warn(
              `Erro ao carregar ${character}_${animation.name}, usando fallback:`,
              error
            );
            // Se um sprite falhar, usar o Idle como fallback
            if (animation.name !== "Idle") {
              return this.loadSpritesheet(
                `${character}_${animation.name}`,
                `assets/sprites/${character}/Idle.png`,
                this.getCorrectFrameCount(character, "Idle")
              ).catch((e) => {
                // Se mesmo o Idle falhar, criar um sprite vazio
                console.error(
                  `Não foi possível carregar o fallback para ${character}_${animation.name}:`,
                  e
                );
                this.spritesheets[`${character}_${animation.name}`] =
                  this.createEmptySpritesheet();
                return this.spritesheets[`${character}_${animation.name}`];
              });
            } else {
              // Se for o Idle que falhou, criar um sprite vazio
              this.spritesheets[`${character}_${animation.name}`] =
                this.createEmptySpritesheet();
              return this.spritesheets[`${character}_${animation.name}`];
            }
          })
        );
      });
    });

    return Promise.all(promises);
  },

  /**
   * Carrega os mapas
   * @returns {Promise} - Promise resolvida quando todos os mapas forem carregados
   */
  async loadMaps() {
    const maps = ["Castle", "Castle_Entry", "Dead_Forest", "Throne"];
    const promises = [];

    maps.forEach((map) => {
      // Cada mapa tem múltiplas camadas
      for (let i = 1; i <= 5; i++) {
        promises.push(
          this.loadTexture(
            `${map}_layer${i}`,
            `assets/backgrounds/${map}/${i}.png`
          ).catch((error) => {
            console.warn(
              `Erro ao carregar camada ${i} do mapa ${map}, usando fallback:`,
              error
            );
            // Se uma camada falhar, criar uma textura vazia
            this.textures[`${map}_layer${i}`] = this.createEmptyTexture();
            return this.textures[`${map}_layer${i}`];
          })
        );
      }
    });

    return Promise.all(promises);
  },

  /**
   * Carrega os efeitos sonoros
   * @returns {Promise} - Promise resolvida quando todos os sons forem carregados
   */
  async loadSounds() {
    // Definir sons a serem carregados
    const sounds = {
      attack: "assets/audio/attack.mp3",
      hit: "assets/audio/hit.mp3",
      jump: "assets/audio/jump.mp3",
      death: "assets/audio/death.mp3",
      victory: "assets/audio/victory.mp3",
      defeat: "assets/audio/defeat.mp3",
      playerJoin: "assets/audio/player_join.mp3",
      gameStart: "assets/audio/game_start.mp3",
      bgm: "assets/audio/bgm.mp3",
    };

    // Criar diretórios para áudio se não existirem
    this.createDummyAudioFiles();

    return new Promise((resolve) => {
      // Como estamos apenas simulando o carregamento de áudio, resolvemos após um pequeno delay
      setTimeout(resolve, 500);
    });
  },

  /**
   * Cria arquivos de áudio fictícios para demonstração
   * Isso é necessário porque não temos arquivos de áudio reais neste exemplo
   */
  createDummyAudioFiles() {
    // Armazena referências para os arquivos de áudio fictícios
    this.audioFiles = {
      attack: true,
      hit: true,
      jump: true,
      death: true,
      victory: true,
      defeat: true,
      playerJoin: true,
      gameStart: true,
      bgm: true,
    };
  },

  /**
   * Carrega uma textura
   * @param {string} name - Nome da textura
   * @param {string} path - Caminho para a textura
   * @returns {Promise} - Promise resolvida quando a textura for carregada
   */
  loadTexture(name, path) {
    return new Promise((resolve, reject) => {
      if (this.textures[name]) {
        resolve(this.textures[name]);
        return;
      }

      PIXI.Assets.load(path)
        .then((texture) => {
          this.textures[name] = texture;
          resolve(texture);
        })
        .catch((error) => {
          console.error(`Erro ao carregar textura ${name} de ${path}:`, error);
          reject(error);
        });
    });
  },

  /**
   * Carrega uma spritesheet
   * @param {string} name - Nome da spritesheet
   * @param {string} path - Caminho para a spritesheet
   * @param {number} framesCount - Número de frames
   * @returns {Promise} - Promise resolvida quando a spritesheet for carregada
   */
  loadSpritesheet(name, path, framesCount) {
    return new Promise((resolve, reject) => {
      if (this.spritesheets[name]) {
        resolve(this.spritesheets[name]);
        return;
      }

      PIXI.Assets.load(path)
        .then((texture) => {
          // Calcular largura e altura de cada frame
          const frameWidth = texture.width / framesCount;
          const frameHeight = texture.height;

          // Criar array de texturas
          const frames = [];

          for (let i = 0; i < framesCount; i++) {
            const frame = new PIXI.Texture(
              texture.baseTexture,
              new PIXI.Rectangle(i * frameWidth, 0, frameWidth, frameHeight)
            );
            frames.push(frame);
          }

          this.spritesheets[name] = frames;
          resolve(frames);
        })
        .catch((error) => {
          console.error(
            `Erro ao carregar spritesheet ${name} de ${path}:`,
            error
          );
          reject(error);
        });
    });
  },

  /**
   * Cria uma textura vazia para uso como fallback
   * @returns {PIXI.Texture} - Textura vazia
   */
  createEmptyTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(255, 0, 255, 0.5)"; // Roxo semitransparente para indicar erro
    ctx.fillRect(0, 0, 64, 64);
    return PIXI.Texture.from(canvas);
  },

  /**
   * Cria um conjunto de sprites vazios para uso como fallback
   * @returns {Array<PIXI.Texture>} - Array de texturas vazias
   */
  createEmptySpritesheet() {
    const emptyTexture = this.createEmptyTexture();
    return [emptyTexture, emptyTexture, emptyTexture, emptyTexture];
  },

  /**
   * Obtém uma textura pelo nome
   * @param {string} name - Nome da textura
   * @returns {PIXI.Texture} - Textura
   */
  getTexture(name) {
    if (!this.textures[name]) {
      console.warn(`Textura ${name} não encontrada, usando fallback.`);
      return this.createEmptyTexture();
    }
    return this.textures[name];
  },

  /**
   * Obtém uma spritesheet pelo nome
   * @param {string} name - Nome da spritesheet
   * @returns {Array<PIXI.Texture>} - Array de texturas
   */
  getSpritesheet(name) {
    if (!this.spritesheets[name]) {
      console.warn(`Spritesheet ${name} não encontrada, usando fallback.`);
      return this.createEmptySpritesheet();
    }
    return this.spritesheets[name];
  },
};
