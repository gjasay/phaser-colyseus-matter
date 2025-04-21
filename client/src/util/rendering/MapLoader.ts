interface ITilesetterPosition {
  x: number;
  y: number;
  id: number;
}

interface ITilesetterLayer {
  name: string;
  positions: ITilesetterPosition[];
}

interface ITilesetterData {
  tile_size: number;
  map_width: number;
  map_height: number;
  layers: ITilesetterLayer[];
}

export class TilesetterMapLoader {
  private _scene: Phaser.Scene;
  private _map: Phaser.Tilemaps.Tilemap;
  private _tileset: null | Phaser.Tilemaps.Tileset;

  private _layers: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map<string, Phaser.Tilemaps.TilemapLayer>();

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
  }

  public load(tilesetKey: string, mapDataKey: string) {
    const mapData = this._scene.cache.json.get(mapDataKey) as ITilesetterData;

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
    //this._map.createBlankLayer("grass", this._tileset, 0, 0);

    for (const layer of mapData.layers) {
      const newLayer = this._map.createBlankLayer(layer.name, this._tileset, 0, 0);
      if(newLayer == null) {
        throw new Error("Failed to load map! Layer failed to create | " + layer.name);
      }

      this._layers.set(layer.name, newLayer);
      for (const position of layer.positions) {
        newLayer.putTileAt(position.id, position.x, position.y);
      }
    }
  }
}
