import { Bodies, Body, Collision, Composite, Engine, Vector } from "matter-js";
import playerConfig from "../../../config/player.config";
import { Game } from "../scenes/Game";

const LERP_FACTOR = 0.3;

interface IPlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PlayerPrefab extends Phaser.GameObjects.Sprite {
  public serverState: IPlayerState = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  public serverRef: Phaser.GameObjects.Arc;
  private _engine: Engine;
  public physBody: Body;
  public serverPosition: Phaser.Math.Vector2;
  public viewPosition: Phaser.Math.Vector2;

  constructor(
    scene: Game | Phaser.Scene,
    engine: Engine,
    x: number,
    y: number,
    texture: string,
    frame?: string | number,
  ) {
    super(scene, x, y, texture, frame);
    this._engine = engine;
    this.viewPosition = new Phaser.Math.Vector2(x, y);
    this.physBody = CreatePlayerBody(x, y);
    Composite.add(this._engine.world, this.physBody);

    // this.setCircle(playerConfig.radius, {
    scene.add.existing(this);
  }

  public fixedUpdate(_dt: number) {

    const scene = this.scene as Game;
    const { up, down, left, right } = scene.inputHandler.payload;
    if (left) {
      Body.translate(this.physBody, {
        x: -playerConfig.walkSpeed, y: 0
      });
    } else if (right) {
      Body.translate(this.physBody, {
        x: playerConfig.walkSpeed, y: 0
      });
    }

    if (up) {
      Body.translate(this.physBody, {
        x: 0, y: -playerConfig.walkSpeed
      });
    }
    if (down) {
      Body.translate(this.physBody, {
        x: 0, y: playerConfig.walkSpeed
      });
    }

    this.viewPosition.lerp(this.physBody.position, LERP_FACTOR);
    this.x = this.viewPosition.x;
    this.y = this.viewPosition.y;
  }
}

export function CreatePlayerBody(x: number, y: number): Body {
  return Bodies.circle(
    x, y, playerConfig.radius, {
      mass: playerConfig.mass,
      friction: playerConfig.friction,
      frictionAir: playerConfig.frictionAir,
      inertia: Infinity,
      collisionFilter: {
        category: 0b0001,
        mask: 0b1110
      }
    }
  )
}
