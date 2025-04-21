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
): Phaser.Tilemaps.Tilemap | null {
  const mapData = scene.cache.json.get(mapKey) as ITilesetterData;

  const tilemap = scene.make.tilemap({
    tileWidth: mapData.tile_size,
    tileHeight: mapData.tile_size,
    width: mapData.map_width,
    height: mapData.map_height
  });

  const tiles = tilemap.addTilesetImage(tilesetKey);

  if(!tiles){
    console.error("Failed to load tileset" , tilesetKey);
    return null;
  }

  for(const layer of mapData.layers) {
    const newLayer = tilemap.createBlankLayer(layer.name, tiles, 0, 0);
    if(newLayer === null) {
      console.error("Failed to load mapd! Layer " + layer.name + " failed to create!");
      return null;
    }
    for(const position of layer.positions) {
      newLayer.putTileAt(position.id, position.x, position.y);
    }
  }
  
  return tilemap;
}