import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import { IInputMessage } from "../../../../types";
import { Delayed } from "colyseus";

export class Entity extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  body: Matter.Body;

  constructor(x: number = 0, y: number = 0) {
    super();
    this.x = x;
    this.y = y;
  }
}

export class Rectangle extends Entity {
  @type("number") width: number = 0;
  @type("number") height: number = 0;

  constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
    super(x, y);
    this.width = width;
    this.height = height;
  }
}

export class Player extends Rectangle {
  inputQueue: IInputMessage[] = [];
  jumping: boolean = false;
  canJump: boolean = true;
  jumpTimeout: Delayed;

  constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
    super(x, y, width, height);
  }
}

export class State extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type([Rectangle]) rects = new ArraySchema<Rectangle>();
  @type("number") score: number = 0;
}
