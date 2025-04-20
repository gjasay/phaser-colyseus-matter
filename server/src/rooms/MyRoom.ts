import { Room, Client } from "@colyseus/core";
import { Player, Rectangle, State, Tile } from "./schema/GameState";
import {
  Engine,
  Bodies,
  Body,
  Composite,
} from "matter-js";
import { IInputMessage, ITileMessage } from "../../../types";
import gameConfig from "../../../config/game.config";
import physicsConfig from "../../../config/physics.config";
import playerConfig from "../../../config/player.config";

const GRID_SIZE = 128;

export class MyRoom extends Room<State> {
  maxClients = 4;
  public state = new State();
  private _engine = Engine.create();

  onCreate(_options: any) {
    // Configure the physics engine
    this._engine.gravity = physicsConfig.gravity;
    this._engine.velocityIterations = physicsConfig.velocityIterations;
    this._engine.positionIterations = physicsConfig.positionIterations;
    this._engine.world.bounds = physicsConfig.worldBounds;

    const floor = Bodies.rectangle(
      0,
      this._engine.world.bounds.max.y,
      this._engine.world.bounds.max.x,
      20,
      {
        isStatic: true,
      },
    );

    Composite.add(this._engine.world, floor);
    this.state.rects.push(
      new Rectangle(
        0,
        this._engine.world.bounds.max.y,
        this._engine.world.bounds.max.x,
        20,
      ),
    );

    // Create fixed update loop
    let elapsedTime = 0;
    this.setSimulationInterval((dt) => {
      elapsedTime += dt;

      while (elapsedTime >= physicsConfig.fixedTimestep) {
        elapsedTime -= physicsConfig.fixedTimestep;
        this.fixedUpdate(physicsConfig.fixedTimestep);
      }
    });

    this.onMessage("input", (client: Client, payload: IInputMessage) => {
      this.state.players.get(client.sessionId).inputQueue.push(payload);
    });

    this.onMessage("wall", (client: Client, payload: ITileMessage) => {
      const i = toGrid(payload.x, payload.y);
      this.state.tiles.push(new Tile(payload.x, payload.y));
      console.log('added tile: ', payload.x, payload.y, i);
      Composite.add(this._engine.world, Bodies.rectangle(
        (payload.x * 32 + 16),
        (payload.y * 32 + 16),
        32, 32,
        {
          isStatic: true,
          collisionFilter: {
            category: 0b0010,
            mask: 0b1111
          }
        }
      ));
    })
  }

  fixedUpdate(dt: number) {
    Engine.update(this._engine, dt);

    this.state.players.forEach((player) => {
      player.x = player.body.position.x;
      player.y = player.body.position.y;

      let input: IInputMessage;
      while ((input = player.inputQueue.shift())) {
        if (input.left) {
          Body.translate(player.body, {
            x: -playerConfig.walkSpeed,
            y: 0
          });
        } else if (input.right) {
          Body.translate(player.body, {
            x: playerConfig.walkSpeed,
            y: 0
          });
        }

        if (input.up) {
          Body.translate(player.body, {
            x: 0,
            y: -playerConfig.walkSpeed
          });
        } else if (input.down) {
          Body.translate(player.body, {
            x: 0,
            y: playerConfig.walkSpeed
          });
        }
      }
    });
  }

  onJoin(client: Client, _options: any) {
    console.log(client.sessionId, "joined!");
    // Add the player to the state
    this.state.players.set(client.sessionId, new Player(100, 100, playerConfig.radius));
    const player = this.state.players.get(client.sessionId);

    // Initialize the player physics body
    player.body = Bodies.circle(
      player.x,
      player.y,
      playerConfig.radius, {
        collisionFilter: {
          category: 0b0001,
          mask: 0b1110
        }
      }
    );
    player.body.mass = playerConfig.mass;
    player.body.friction = playerConfig.friction;
    player.body.frictionAir = playerConfig.frictionAir;
    player.body.inertia = Infinity;
    Composite.add(this._engine.world, player.body);
  }

  onLeave(client: Client, _consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}

const toGrid = (x: number, y: number) => x + y * GRID_SIZE;
