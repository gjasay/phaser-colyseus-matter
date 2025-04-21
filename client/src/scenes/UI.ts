export class UI extends Phaser.Scene {
  constructor() {
    super({ key: "UI", active: false });
  }

  create() {
    // this.add.image(1024 / 2, 768 / 2, "background").setOrigin(0.5);
    this.add.rectangle(1024 / 2 - 300, 650, 600, 100, 0x000000, 0.5).setOrigin(0);
    this.add.image(1024 / 2 - 300, 650, "structureSheet", 1).setOrigin(0).setScale(3);
    this.add.image(1024 / 2 - 210, 650, "structureSheet", 2).setOrigin(0).setScale(3);
  }
}
