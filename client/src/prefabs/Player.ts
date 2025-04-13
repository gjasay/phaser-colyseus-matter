import playerConfig from "../../../config/player.config";
import { Game } from "../scenes/Game";

interface IPlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PlayerPrefab extends Phaser.Physics.Matter.Image {
  public serverState: IPlayerState = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  public serverRef: Phaser.GameObjects.Rectangle;
  private _scene: Game | Phaser.Scene;

  constructor(
    scene: Game | Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string | number,
  ) {
    super(scene.matter.world, x, y, texture, frame);
    this._scene = scene;
    this.setScale(0.75);
    this.setMass(playerConfig.mass);
    this.setFriction(playerConfig.friction);
    this.setFrictionAir(playerConfig.frictionAir);

    scene.add.existing(this);
  }

  public fixedUpdate(_dt: number) {
    const scene = this._scene as Game;
    const { up, down, left, right } = scene.inputHandler.payload;
    if (left) {
      this.applyForce(new Phaser.Math.Vector2(-playerConfig.walkSpeed, 0));
    } else if (right) {
      this.applyForce(new Phaser.Math.Vector2(playerConfig.walkSpeed, 0));
    }

    if (up) {
      this.applyForce(new Phaser.Math.Vector2(0, -playerConfig.walkSpeed));
    }
    if (down) {
      this.applyForce(new Phaser.Math.Vector2(0, playerConfig.walkSpeed));
    }
  }

  public createServerRef(x: number, y: number, width: number, height: number) {
    this.serverRef = this._scene.add.rectangle(
      x,
      y,
      width,
      height,
      0x000000,
      0.5,
    );
    this._scene.add.existing(this.serverRef);
  }
}
