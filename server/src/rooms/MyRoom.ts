import { Room, Client } from "@colyseus/core";
import { Player, Rectangle, State } from "./schema/GameState";
import {
  Engine,
  Bodies,
  Body,
  Composite,
} from "matter-js";
import { IInputMessage } from "../../../types";
import gameConfig from "../../../config/game.config";
import physicsConfig from "../../../config/physics.config";
import playerConfig from "../../../config/player.config";

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

      while (elapsedTime >= gameConfig.fixedTimestep) {
        elapsedTime -= gameConfig.fixedTimestep;
        this.fixedUpdate(gameConfig.fixedTimestep);
      }
    });

    this.onMessage("input", (client: Client, payload: IInputMessage) => {
      this.state.players.get(client.sessionId).inputQueue.push(payload);
    });
  }

  fixedUpdate(dt: number) {
    Engine.update(this._engine, dt);

    this.state.players.forEach((player) => {
      let input: IInputMessage;

      while ((input = player.inputQueue.shift())) {
        if (input.left) {
          Body.applyForce(player.body, player.body.position, {
            x: -playerConfig.walkSpeed,
            y: 0,
          });
        } else if (input.right) {
          Body.applyForce(player.body, player.body.position, {
            x: playerConfig.walkSpeed,
            y: 0,
          });
        }

        if (input.up) {
          Body.applyForce(player.body, player.body.position, {
            x: 0,
            y: -playerConfig.walkSpeed,
          });
        } else if (input.down) {
          Body.applyForce(player.body, player.body.position, {
            x: 0,
            y: playerConfig.walkSpeed,
          });
        }

      }
      player.x = player.body.position.x;
      player.y = player.body.position.y;
    });
  }

  onJoin(client: Client, _options: any) {
    console.log(client.sessionId, "joined!");
    // Add the player to the state
    this.state.players.set(client.sessionId, new Player(100, 100, 50, 50));
    const player = this.state.players.get(client.sessionId);

    // Initialize the player physics body
    player.body = Bodies.rectangle(
      player.x,
      player.y,
      player.width,
      player.height,
    );
    player.body.mass = playerConfig.mass;
    player.body.friction = playerConfig.friction;
    player.body.frictionAir = playerConfig.frictionAir;
    Composite.add(this._engine.world, player.body);
  }

  onLeave(client: Client, _consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
