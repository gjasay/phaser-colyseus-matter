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

    this.load.spritesheet("structureSheet", "tiles/structures.png", { frameWidth: 32, frameHeight: 32, endFrame: 2 });
    this.load.json("mapData", "Maps/main_map/main_map.json");
  }

  create() {
    this.scene.start("Game");
    this.scene.launch("UI");
  }
}
