import { Room, Client } from "@colyseus/core";
import { Player, State, Tile } from "./schema/GameState";
import { Engine, Bodies, Body, Composite } from "matter-js";
import {
  IInputMessage,
  IPlacementMessage,
  ITilesetterData,
} from "../../../types";
import gameConfig from "../../../config/game.config";
import physicsConfig from "../../../config/physics.config";
import playerConfig from "../../../config/player.config";
import { loadCollisionLayer } from "./util/LoadCollisionLayer";
import * as path from "path";
import { ReadFileAsync } from "./util/Files";

export class MyRoom extends Room<State> {
  maxClients = 4;
  public state = new State();
  private _engine = Engine.create();
  private _mapData: ITilesetterData | undefined;

  async onCreate(_options: any): Promise<void> {
    // Configure the physics engine
    this._engine.gravity = physicsConfig.gravity;
    this._engine.velocityIterations = physicsConfig.velocityIterations;
    this._engine.positionIterations = physicsConfig.positionIterations;
    this._engine.world.bounds = physicsConfig.worldBounds;

    // Load map data and init collision layer
    const filePath = path.resolve(
      __dirname,
      "../../../client/public/assets/Maps/main_map/main_map.json",
    );
    const data = await ReadFileAsync(filePath);
    const mapJson = JSON.parse(data);
    this._mapData = mapJson as ITilesetterData;
    loadCollisionLayer(this._engine, this._mapData);

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

    this.onMessage("place", (client: Client, payload: IPlacementMessage) => {
      const player = this.state.players.get(client.sessionId);

      const i = toGrid(payload.x, payload.y, this._mapData.map_width);
      const tile = new Tile(payload.type, player.teamId, payload.x, payload.y);
      this.state.tiles[i] = tile;
      console.log("added tile: ", payload.x, payload.y, i);
      tile.body = Bodies.rectangle(payload.x * 32 + 16, payload.y * 32 + 16, 32, 32, {
        isStatic: true,
        collisionFilter: {
          category: 0b0010,
          mask: 0b1111,
        },
      });
      Composite.add(
        this._engine.world,
        tile.body
      );
    });

    this.onMessage("remove", (client: Client, payload: IPlacementMessage) => {
      const i = toGrid(payload.x, payload.y, this._mapData.map_width);
      const player = this.state.players.get(client.sessionId);
      const tile = this.state.tiles[i];
      if (tile?.teamId === player.teamId) {
        Composite.remove(this._engine.world, tile.body);
        //delete this.state.tiles[i];
        delete this.state.tiles[i];
        console.log("Slice");
        this.broadcast('removeTile', tile, {
          afterNextPatch: false
        });
      } else {
        console.log(tile.teamId);
      }
    });
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

    const teamId = (this.clients.length % gameConfig.teams.players) + 1;
    // Add the player to the state
    this.state.players.set(
      client.sessionId,
      new Player(100, 100, playerConfig.radius, teamId),
    );
    const player = this.state.players.get(client.sessionId);

    // Initialize the player physics body
    player.body = Bodies.circle(player.x, player.y, playerConfig.radius, {
      collisionFilter: {
        category: 0b0001,
        mask: 0b1110,
      },
    });
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

const toGrid = (x: number, y: number, width: number) => x + y * width;
