import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import { IInputMessage } from "../../../../types";
import Matter, { Bodies, Body, Bounds, Engine, Query, Vector, Vertices } from "matter-js";
import gameConfig from "../../../../config/game.config";
import { Navigate, VectorMap } from "../../util/Navigation";

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

export class Tile extends Entity {
  @type("string") type: string;
}

export interface IVectorLike {
  x: number,
  y: number
};

export class Duck extends Entity {
  @type("string") state: string;

  following?: IVectorLike;

  path?: VectorMap<Vector | null> = new VectorMap<Vector | null>();
  pathQueue: Vector[];
  nextNode?: Vector;

  constructor(x: number, y: number) {
    super(x, y);
    this.body = Bodies.circle(
      x, y,
      10,
      {
        inertia: Infinity,
        collisionFilter: {
          category: 0b0001,
          mask: 0b1110
        },
      }
    )

  }

  setFollowing(pos: IVectorLike | undefined, map: boolean[][]) {
    this.following = Vector.create(pos.x, pos.y);
    this.pathQueue = [];
    if (this.following === undefined) {
      this.path = undefined;
      return;
    }
    this.path = Navigate(Vector.create(Math.floor(this.x/32), Math.floor(this.y/32)), Vector.create(Math.floor(this.following.x/32), Math.floor(this.following.y/32)), map);
    let next: Vector = Vector.create(Math.floor(this.following.x / 32), Math.floor(this.following.y / 32));
    do {
      this.pathQueue.push(next);
      next = this.path.get(next);
    } while (next !== null);
  }

  getNextNode(engine: Engine) {
    let vector: Vector;
    const bodies = engine.world.bodies.filter(body => (body.collisionFilter.category & this.body.collisionFilter.mask) !== 0);
    const defaultNextVec = this.pathQueue[this.pathQueue.length - 1];
    do {
      const testVec = this.pathQueue.pop();
      const collisions = Query.ray(bodies, Vector.create(this.x, this.y), Vector.add(Vector.mult(testVec, 32), Vector.create(16, 16)), 32);
      if (collisions.length === 0) {
        vector = testVec;
      } else {
        break;
      }
    } while (this.pathQueue.length > 0);
    return vector ?? defaultNextVec;
  }

  move(engine: Engine, map: boolean[][]) {
    if (this.following === undefined || this.pathQueue === undefined) {
      return;
    }

    if (this.nextNode === undefined && this.pathQueue.length > 0) {
      this.nextNode = this.getNextNode(engine);
      console.log('Moving', this.nextNode.x, this.nextNode.y);
    }

    if (this.nextNode === undefined || Vector.magnitude(
      Vector.sub(
        Vector.create(this.x, this.y),
        Vector.add(
          Vector.mult(this.nextNode, 32),
          Vector.create(16, 16)
        )
      )
    ) < (this.pathQueue.length === 0 ? 64 : 8)) {
      if (this.nextNode !== undefined)
        console.log('arrived');
      this.nextNode = undefined;
      return;
    }
    const destination = Vector.add(
      Vector.mult(this.nextNode, 32),
      Vector.create(16, 16)
    );

    const pos = Vector.create(this.x, this.y);
    const direction = Vector.normalise(Vector.sub(
      destination,
      pos
    ))

    const ducks = engine.world.bodies.filter(body => (body.collisionFilter.category === this.body.collisionFilter.category))
    const max = Vector.create(32, 32);
    const min = Vector.neg(max);
    const nearby = Query.region(ducks, {
      min: {
        x: pos.x - 32,
        y: pos.y - 32
      },
      max: {
        x: pos.x + 32,
        y: pos.y + 32
      }
    });
    let totalPush = Vector.create(0, 0);
    for (const duck of nearby) {
      // const closestPos = closestPoint(this.body.position, duck.position);
      const diff = Vector.sub(this.body.position, duck.position);
      const distance = Vector.magnitude(diff);
      if (distance > 32) {
        continue;
      }

      const pushFactor = Vector.mult(Vector.normalise(diff), ((1 - (distance / 32)) * 2));
      const pushMag = Vector.magnitude(pushFactor);
      totalPush = Vector.add(totalPush, pushFactor);
    }

    const magnitude = Vector.magnitude(totalPush);
    const MAX_PUSH = 3;
    if (magnitude > MAX_PUSH) {
      console.log("maxed out!");
      totalPush = Vector.mult(Vector.normalise(totalPush), MAX_PUSH);
    }
    Body.translate(this.body, Vector.add(direction, totalPush));
    this.x = this.body.position.x;
    this.y = this.body.position.y;
  }
}

const getNormal = (diff: Vector): Vector => Math.abs(diff.x) > Math.abs(diff.y)
  ? Vector.create(Math.sign(diff.x), 0)
  : Vector.create(0, Math.sign(diff.y));

const closestPoint = (pos: Vector, centroid: Vector) => Vector.create(
  Math.min(Math.max(pos.x, centroid.x - 16), centroid.x + 16),
  Math.min(Math.max(pos.y, centroid.y - 16), centroid.y + 16)
);

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
  @type([Duck]) ducks = new ArraySchema<Duck>();
}
