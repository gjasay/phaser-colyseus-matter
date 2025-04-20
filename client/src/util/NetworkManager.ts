import * as Colyseus from "colyseus.js";
import { Schema, SchemaCallbackProxy } from "@colyseus/schema";
import { State } from "../schema/State";

export class NetworkManager {
  public room: Colyseus.Room<State>;
  private _client: Colyseus.Client;
  private _stateCallbacks: SchemaCallbackProxy<State>;
  private static _instance: NetworkManager;

  private constructor() { }

  static get instance() {
    if (this._instance == null) {
      this._instance = new NetworkManager();
    }

    return this._instance;
  }

  public initialize(): void {
    this._client = new Colyseus.Client(import.meta.env.VITE_GAME_SERVER);
  }

  public async connectToRoom(
    action: "host" | "join" | "find",
    roomId?: string,
  ): Promise<Colyseus.Room<State> | unknown> {
    try {
      switch (action) {
        case "host":
          this.room = await this._client.create("my_room", {});
          break;
        case "find":
          this.room = await this._client.joinOrCreate("my_room", {});
          break;
        case "join":
          if (!roomId) {
            throw new Error("Room ID is required for find action");
          }
          this.room = await this._client.joinById(roomId, {});
          break;
      }
      this._stateCallbacks = Colyseus.getStateCallbacks(this.room);
      return this.room;
    } catch (e) {
      return e;
    }
  }

  public schema(schema: Schema) {
    return this._stateCallbacks(schema);
  }

  get state() {
    if (!this.room) {
      throw new Error("Room is not initialized");
    }
    return this._stateCallbacks(this.room.state);
  }

  get clientPlayer() {
    return this.room.state.players.get(this.room.sessionId);
  }
}
