/**
 * Gerenciador de sons do jogo
 */
export const SoundManager = {
  sounds: {},
  bgmPlaying: false,
  muted: false,

  /**
   * Inicializa o gerenciador de sons
   */
  initialize() {
    // Definir sons do jogo
    this.sounds = {
      attack: new Howl({
        src: ["assets/audio/attack.mp3"],
        volume: 0.5,
      }),
      hit: new Howl({
        src: ["assets/audio/hit.mp3"],
        volume: 0.6,
      }),
      jump: new Howl({
        src: ["assets/audio/jump.mp3"],
        volume: 0.4,
      }),
      death: new Howl({
        src: ["assets/audio/death.mp3"],
        volume: 0.7,
      }),
      victory: new Howl({
        src: ["assets/audio/victory.mp3"],
        volume: 0.7,
      }),
      defeat: new Howl({
        src: ["assets/audio/defeat.mp3"],
        volume: 0.7,
      }),
      playerJoin: new Howl({
        src: ["assets/audio/player_join.mp3"],
        volume: 0.3,
      }),
      gameStart: new Howl({
        src: ["assets/audio/game_start.mp3"],
        volume: 0.5,
      }),
      bgm: new Howl({
        src: ["assets/audio/bgm.mp3"],
        volume: 0.3,
        loop: true,
      }),
    };

    // Criar arquivos de áudio fictícios para demonstração
    this.createDummyAudioFiles();

    // Adicionar ícone de som à interface
    this.addSoundControlToUI();
  },

  /**
   * Reproduz um efeito sonoro
   * @param {string} sound - Nome do som a ser reproduzido
   */
  play(sound) {
    if (this.muted || !this.sounds[sound]) return;

    // Como os arquivos de áudio são fictícios, apenas simularemos a reprodução
    console.log(`Reproduzindo som: ${sound}`);
  },

  /**
   * Inicia a reprodução da música de fundo
   */
  playBGM() {
    if (this.muted || this.bgmPlaying) return;

    // Como os arquivos de áudio são fictícios, apenas simularemos a reprodução
    console.log("Iniciando música de fundo");
    this.bgmPlaying = true;
  },

  /**
   * Para a reprodução da música de fundo
   */
  stopBGM() {
    if (!this.bgmPlaying) return;

    // Como os arquivos de áudio são fictícios, apenas simularemos a parada
    console.log("Parando música de fundo");
    this.bgmPlaying = false;
  },

  /**
   * Alterna o estado de mudo
   */
  toggleMute() {
    this.muted = !this.muted;

    if (this.muted) {
      // Parar todos os sons
      this.stopBGM();
      console.log("Som desativado");

      // Atualizar ícone na UI
      const soundIcon = document.getElementById("sound-icon");
      if (soundIcon) {
        soundIcon.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>';
      }
    } else {
      // Retomar BGM se estivesse tocando
      if (this.bgmPlaying) {
        this.playBGM();
      }
      console.log("Som ativado");

      // Atualizar ícone na UI
      const soundIcon = document.getElementById("sound-icon");
      if (soundIcon) {
        soundIcon.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>';
      }
    }
  },

  /**
   * Adiciona controle de som à interface do usuário
   */
  addSoundControlToUI() {
    const soundControl = document.createElement("div");
    soundControl.id = "sound-control";
    soundControl.className =
      "fixed bottom-4 right-4 bg-gray-800 bg-opacity-70 p-2 rounded-full cursor-pointer z-50";
    soundControl.innerHTML =
      '<div id="sound-icon"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg></div>';

    // Adicionar ao body
    document.body.appendChild(soundControl);

    // Adicionar evento de clique
    soundControl.addEventListener("click", () => {
      this.toggleMute();
    });
  },

  /**
   * Cria arquivos de áudio fictícios para demonstração
   */
  createDummyAudioFiles() {
    // Como não temos arquivos de áudio reais, vamos sobrescrever os métodos da Howl
    // para simular a reprodução de som

    Object.keys(this.sounds).forEach((soundName) => {
      this.sounds[soundName]._play = this.sounds[soundName].play;
      this.sounds[soundName].play = function () {
        console.log(`Playing sound: ${soundName}`);
        return 1; // ID da reprodução
      };

      this.sounds[soundName]._stop = this.sounds[soundName].stop;
      this.sounds[soundName].stop = function () {
        console.log(`Stopping sound: ${soundName}`);
      };
    });
  },
};
