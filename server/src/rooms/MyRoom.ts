import { Room, Client, Delayed } from "@colyseus/core";
import { Player, Rectangle, State } from "./schema/GameState";
import { Engine, World, Bodies, Body } from "matter-js";
import { IInputMessage } from "../../../types";
import gameConfig from "../../../config/game.config";
import physicsConfig from "../../../config/physics.config";
import playerConfig from "../../../config/player.config";

export class MyRoom extends Room<State> {
  maxClients = 4;
  public state = new State();
  private _engine = Engine.create();

  onCreate(options: any) {
    // Configure the physics engine
    this._engine.gravity = physicsConfig.gravity;
    this._engine.velocityIterations = physicsConfig.velocityIterations;
    this._engine.positionIterations = physicsConfig.positionIterations;
    this._engine.world.bounds = physicsConfig.worldBounds;

    const floor = Bodies.rectangle(0, this._engine.world.bounds.max.y, this._engine.world.bounds.max.x, 20, {
      isStatic: true,
    });
    World.add(this._engine.world, floor);
    this.state.rects.push(new Rectangle(0, this._engine.world.bounds.max.y, this._engine.world.bounds.max.x, 20));

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
          Body.applyForce(player.body, player.body.position, { x: -playerConfig.walkSpeed, y: 0 });
        }
        if (input.right) {
          Body.applyForce(player.body, player.body.position, { x: playerConfig.walkSpeed, y: 0 });
        }
        if (input.jump && !player.jumping && player.canJump) {
          player.jumping = true;
          player.canJump = false;
          this.clock.setTimeout(() => {
            player.jumping = false;
          }, playerConfig.jumpTimeout);
          this.clock.setTimeout(() => {
            player.canJump = true;
          }, 500)
        }
      }

      if (player.jumping) {
        if (player.body.position.y > this._engine.world.bounds.max.y) {
          player.body.position.y = this._engine.world.bounds.max.y;
          player.jumping = false;
        }

        Body.applyForce(player.body, player.body.position, { x: 0, y: -playerConfig.jumpForce });
      }
      player.x = player.body.position.x;
      player.y = player.body.position.y;
      console.log(player.x, player.y);
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    // Add the player to the state
    this.state.players.set(client.sessionId, new Player(100, 20, 50, 50));
    const player = this.state.players.get(client.sessionId);

    // Initialize the player physics body
    player.body = Bodies.rectangle(
      player.x,
      player.y,
      player.width,
      player.height,
    );
    player.body.mass = 0.01;
    World.add(this._engine.world, player.body);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
