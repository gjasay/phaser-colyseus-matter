export class Preloader extends Phaser.Scene {
  constructor() {
    super("Preloader");
  }

  preload() {
    this.load.setPath("assets");

    this.load.image("background", "bg.png");
    this.load.image("logo", "logo.png");
    this.load.image("walls", "tiles/wall.png");
    this.load.image("structures", "tiles/structures.png");
    this.load.image("wizard", "Ents/wizard.png");
    this.load.image("mainMap", "Maps/main_map/main_map.png");

    this.load.spritesheet("structureSheet", "tiles/structures.png", { frameWidth: 32, frameHeight: 32, endFrame: 3 });
    this.load.spritesheet('doors', 'doors.png', { frameWidth: 32, frameHeight: 32, endFrame: 4});
    this.load.json("mapData", "Maps/main_map/main_map.json");

    this.load.spritesheet('button', 'button.png', { frameWidth: 18, frameHeight: 18, endFrame: 2});
    this.load.spritesheet('smallButton', 'small_button.png', { frameWidth: 9, frameHeight: 9, endFrame: 2 });
    this.load.image('buildmode', 'buildmode.png');
    this.load.image('commandmode', 'commandmode.png');
    this.load.image('menu', 'menu.png');
    this.load.image('wall', 'wall.png');
    this.load.image('duckicon', 'duckicon.png');
  }

  create() {
    this.scene.start("Game");
    this.scene.launch("UI");
  }
}
