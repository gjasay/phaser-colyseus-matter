interface TilesetterPosition {
  x: number;
  y: number;
  id: number;
}

interface TilesetterLayer {
  name: string;
  positions: TilesetterPosition[];
}

interface TilesetterData {
  tile_size: number;
  map_width: number;
  map_height: number;
  layers: TilesetterLayer[];
}

export class TilesetterMapLoader {
  private _scene: Phaser.Scene;
  private _map: Phaser.Tilemaps.Tilemap;
  private _tileset: null | Phaser.Tilemaps.Tileset;

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
  }

  public load(tilesetKey: string, mapDataKey: string) {
    const mapData = this._scene.cache.json.get(mapDataKey) as TilesetterData;

    // place tiles
    this._map = this._scene.make.tilemap({
      tileWidth: mapData.tile_size,
      tileHeight: mapData.tile_size,
      width: mapData.map_width,
      height: mapData.map_height,
    });

    this._tileset = this._map.addTilesetImage(`ts_${tilesetKey}`, tilesetKey);

    if (!this._tileset) {
      console.error(`Tileset ${tilesetKey} not found`);
      return;
    }

    // grass layer
    this._map.createBlankLayer("grass", this._tileset, 0, 0);

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
      }
    }
  }
}
