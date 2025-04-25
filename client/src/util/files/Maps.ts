import { Scene } from "phaser";

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

export function LoadTilesetterMap(
  scene: Scene,
  mapKey: string,
  tilesetKey: string
): Phaser.Tilemaps.Tilemap {
  const mapData = scene.cache.json.get(mapKey) as ITilesetterData;
  if (mapData === undefined) {
    throw new Error("Map data not found!");
  }

  const tilemap = scene.make.tilemap({
    tileWidth: mapData.tile_size,
    tileHeight: mapData.tile_size,
    width: mapData.map_width,
    height: mapData.map_height
  });

  const tiles = tilemap.addTilesetImage(tilesetKey);

  if(!tiles){
    throw new Error("Failed to load tileset " + tilesetKey);
  }

  for(const layer of mapData.layers) {
    const newLayer = tilemap.createBlankLayer(layer.name, tiles, 0, 0);
    if(newLayer === null) {
      throw new Error("Failed to load mapd! Layer " + layer.name + " failed to create!");
    }
    for(const position of layer.positions) {
      newLayer.putTileAt(position.id, position.x, position.y);
    }
  }

  return tilemap;
}