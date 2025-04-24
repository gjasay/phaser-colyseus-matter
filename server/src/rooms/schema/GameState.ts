import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
// import { IInputMessage } from "../../../../types";
import Matter from "matter-js";
import gameConfig from "../../../../config/game.config";

export const Structures = {
  CoinGenerator: 0,
  Tower: 1,
  Wall: 2
} as const;

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

  constructor(
    x: number = 0,
    y: number = 0,
    width: number = 0,
    height: number = 0,
  ) {
    super(x, y);
    this.width = width;
    this.height = height;
  }
}

export class Duck extends Entity { }

export class Circle extends Entity {
  @type("number") radius: number = 0;
  constructor(x: number = 0, y: number = 0, radius: number = 0) {
    super(x, y);
    this.radius = radius;
  }
}

export class Player extends Circle {
  inputQueue: IInputMessage[] = [];
  @type("number") teamId: number = 0;

  constructor(
    x: number = 0,
    y: number = 0,
    radius: number = 0,
    teamId: number = 0,
  ) {
    super(x, y, radius);
    this.teamId = teamId;
  }
}

export class Team extends Schema {
  @type("number") id: number = 0;
  @type("number") coins: number = gameConfig.teams.coins;
  playerCount: number = 0;
}

export class Tile extends Entity {
  @type("number") type: number;
  @type("number") teamId: number = 0;
  @type("number") cost: number;
  @type("number") hp: number;

  constructor(type: number, teamId: number, x: number, y: number) {
    super(x, y);
    this.type = type;
    this.teamId = teamId;

    switch (type) {
      case Structures.CoinGenerator:
        this.cost = gameConfig.structures.coingen.cost;
        this.hp = gameConfig.structures.coingen.hp;
        break;
      case Structures.Tower:
        this.cost = gameConfig.structures.tower.cost;
        this.hp = gameConfig.structures.tower.hp;
        break;
      case Structures.Wall:
        this.cost = gameConfig.structures.wall.cost;
        this.hp = gameConfig.structures.wall.hp;
        break;
    }
  }
}

export class Item extends Entity {
  @type("number") id: number = 0;
  @type("number") teamId: number = 0;
}

export class State extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type(Team) team1 = new Team();
  @type(Team) team2 = new Team();
  @type([Rectangle]) rects = new ArraySchema<Rectangle>();
  @type([Tile]) tiles = new ArraySchema<Tile>();
}
