import { Bodies, Composite } from "matter-js";
import { ITilesetterData } from "../../../../types";
import { Game } from "../../scenes/Game";

export class TilesetterMapLoader {
  private _scene: Phaser.Scene | Game;
  private _map: Phaser.Tilemaps.Tilemap;
  private _tileset: null | Phaser.Tilemaps.Tileset;

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
  }

  public load(tilesetKey: string, mapDataKey: string) {
    const mapData = this._scene.cache.json.get(mapDataKey) as ITilesetterData;
    const scene = this._scene as Game;

    // place tiles
    this._map = this._scene.make.tilemap({
      tileWidth: mapData.tile_size,
      tileHeight: mapData.tile_size,
      width: mapData.map_width,
      height: mapData.map_height,
    });

    this._tileset = this._map.addTilesetImage(`ts_${tilesetKey}`, tilesetKey);

    if (!this._tileset) {
      console.error(`Tileset "${tilesetKey}" not found`);
      return;
    }

    // grass layer
    this._map.createBlankLayer("grass", this._tileset, 0, 0)?.setDepth(-10);

    for (const layer of mapData.layers) {
      for (const position of layer.positions) {
        if (layer.name !== "Grass") continue;
        this._map.putTileAt(position.id, position.x, position.y);
      }
    }

    // collision layer
    this._map.createBlankLayer("obstacle", this._tileset, 0, 0);

    for (const layer of mapData.layers) {
      for (const position of layer.positions) {
        if (layer.name !== "Obstacle") continue;
        this._map.putTileAt(position.id, position.x, position.y);
        Composite.add(
          scene.engine.world,
          Bodies.rectangle(
            position.x * mapData.tile_size + mapData.tile_size / 2,
            position.y * mapData.tile_size + mapData.tile_size / 2,
            mapData.tile_size,
            mapData.tile_size,
            {
              isStatic: true,
              collisionFilter: {
                category: 0b0010,
                mask: 0b1111,
              },
            },
          ),
        );
      }
    }
  }
}
