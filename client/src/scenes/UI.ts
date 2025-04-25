import { Game } from "./Game";

const WIDTH = 1024;
const HEIGHT = 768;

const HALFWIDTH = 512;
const HALFHEIGHT = 384;

const LEFT = HALFWIDTH - 230;
const TOP = HEIGHT- 180

export class UI extends Phaser.Scene {
  private _menu: Phaser.GameObjects.Image;
  
  private _wallButton: Phaser.GameObjects.Image;
  private _wall: Phaser.GameObjects.Image;

  private _towerButton: Phaser.GameObjects.Image;
  private _tower: Phaser.GameObjects.Image;

  private _moneyButton: Phaser.GameObjects.Image;
  private _money: Phaser.GameObjects.Image;

  private _barracksButton: Phaser.GameObjects.Image;
  private _barracks: Phaser.GameObjects.Image;

  private _doorButton: Phaser.GameObjects.Image;
  private _door: Phaser.GameObjects.Image;
  
  private _buildModeButton: Phaser.GameObjects.Image;
  private _buildMode: Phaser.GameObjects.Image;

  private _commandModeButton: Phaser.GameObjects.Image;
  private _commandMode: Phaser.GameObjects.Image;

  private _ducks: Phaser.GameObjects.Image[] = [];

  private _buildModeImages: Phaser.GameObjects.Image[] = []

  constructor() {
    super({ key: "UI", active: false });
  }

  create() {
    // this.add.image(1024 / 2, 768 / 2, "background").setOrigin(0.5);
    // this.add.rectangle(1024 / 2 - 300, 650, 600, 100, 0x000000, 0.5).setOrigin(0);
    
    //const button = this.add.tileSprite(32, 32, 18, 18, 'button', 0);
    // const buildButton = this.add.image(32, 32, 'button', 0).setOrigin(0).setScale(3);
    // this.add.image(1024 / 2 - 300, 650, "structureSheet", 1).setOrigin(0).setScale(3);
    // this.add.image(1024 / 2 - 210, 650, "structureSheet", 2).setOrigin(0).setScale(3);
    
    this._menu = this.add.image(LEFT, TOP, 'menu').setOrigin(0).setScale(4).setVisible(true);

    // Build buttons
    this._wallButton = this.add.existing(new BigButton(this, LEFT + 64, TOP + 20, () => this.setSelectedStructure(3)))
    this._wall = this.add.image(LEFT + 64 + 4, TOP + 24, 'wall').setOrigin(0).setScale(2).setVisible(false);

    this._moneyButton = this.add.existing(new BigButton(this, LEFT + 64 + 76, TOP + 20, () => this.setSelectedStructure(0)))
    this._money = this.add.image(LEFT + 64 + 80, TOP + 24, 'structureSheet', 0).setOrigin(0).setScale(2).setVisible(false);

    this._towerButton = this.add.existing(new BigButton(this, LEFT + 64 + 76 + 76, TOP + 20, () => this.setSelectedStructure(1)))
    this._tower = this.add.image(LEFT + 64 + 76 + 76, TOP + 24, 'structureSheet', 1).setOrigin(0).setScale(2).setVisible(false);
  
    this._barracksButton = this.add.existing(new BigButton(this, LEFT + 64 + 76 + 76 + 76, TOP + 20, () => this.setSelectedStructure(2)))
    this._barracks = this.add.image(LEFT + 64 + 76 + 76 + 81, TOP + 25, 'structureSheet', 2).setOrigin(0).setScale(2).setVisible(false);

    this._doorButton = this.add.existing(new BigButton(this, LEFT + 64 + 76 * 4, TOP + 20, () => this.setSelectedStructure(4))).setVisible(true);
    this._door = this.add.image(LEFT + 64 + 76 * 4 + 4, TOP + 25, 'doors', 0).setOrigin(0).setScale(2);
    
    // Mode buttons
    this._buildModeButton = this.add.existing(new SmallButton(this, LEFT + 12, TOP + 12, () => this.buildMode())).setVisible(true);
    this._buildMode = this.add.image(LEFT + 16, TOP + 18, 'buildmode').setOrigin(0).setScale(2).setVisible(true);
    
    this._commandModeButton = this.add.existing(new SmallButton(this, LEFT + 12, TOP + 58, () => this.commandMode())).setVisible(true);
    this._commandModeButton.setInteractive(hitArea(this._commandModeButton.width, this._commandModeButton.height));

    this._commandMode = this.add.image(LEFT + 16, TOP + 62, 'commandmode').setOrigin(0).setScale(2).setVisible(true);

    this._buildModeImages = [
      this._wallButton,
      this._wall,
      this._moneyButton,
      this._money,
      this._towerButton,
      this._tower,
      this._barracksButton,
      this._barracks,
      this._doorButton,
      this._door
    ];
  
    // this._buildModeButton.on('pointerdown', () => {
    //   this._buildModeButton.setFrame(1);
    // });
    this.input.on('pointerup', () => {
      this._buildModeButton.setFrame(0);
      this._commandModeButton.setFrame(0);
      this._wallButton.setFrame(0);
      this._towerButton.setFrame(0);
      this._moneyButton.setFrame(0);
      this._barracksButton.setFrame(0);
      this._doorButton.setFrame(0);
    })
    this.setDucks(4);
    this.buildMode();
  }

  setVisible(objects: Phaser.GameObjects.Image[]) {
    for(const object of objects) {
      object.setVisible(true)
    }
  }

  setInvisible(objects: Phaser.GameObjects.Image[]) {
    for(const object of objects) {
      object.setVisible(false);
    }
  }

  setSelectedStructure(num: number) {
    (this.scene.get('Game') as Game).setSelectedStructure(num);
  }

  buildMode() {
    this.setInvisible(this._ducks);
    this.setVisible(this._buildModeImages);
    (this.scene.get('Game') as Game).setBuildMode();
  }

  commandMode() {
    this.setVisible(this._ducks);
    this.setInvisible(this._buildModeImages);
    (this.scene.get('Game') as Game).setFightMode();
  }

  setDucks(num: number) {
    
    for(const duck of this._ducks){
      duck.destroy();
    }
    this._ducks = [];
    for(let i = 0; i < num; i++) {
      this._ducks.push(this.add.image(LEFT + 64 + ((i % 6) * 48), TOP + 20 + (Math.floor(i / 6) * 48), 'duckicon').setOrigin(0).setScale(3));
    }
  }
}

function hitArea(w: number, h: number): Phaser.Types.Input.InputConfiguration {
  return {
    hitArea: new Phaser.Geom.Rectangle(0, 0, w, h),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains
  }
}

class SmallButton extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, callback: () => void) {
    super(scene, x, y, 'smallButton', 0);
    this.setInteractive(hitArea(this.width, this.height));
    this.on('pointerdown', () => {
      this.setFrame(1);
    })
    this.on('pointerup', callback);
    this.setOrigin(0);
    this.setScale(4);
    this.setVisible(false);
  }
}

class BigButton extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, callback: () => void) {
    super(scene, x, y, 'button', 0);
    this.setInteractive(hitArea(this.width, this.height));
    this.on('pointerdown', () => {
      this.setFrame(1);
    })
    this.on('pointerup', callback);
    this.setOrigin(0);
    this.setScale(4);
    this.setVisible(false);
  }
}