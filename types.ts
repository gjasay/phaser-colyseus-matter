export interface IInputMessage {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface ITileMessage {
  x: number,
  y: number,
  type: string
};
export interface IPlacementMessage {
  x: number;
  y: number;
  type: string;
}

interface ITilesetterPosition {
  x: number;
  y: number;
  id: number;
}

interface ITilesetterLayer {
  name: string;
  positions: ITilesetterPosition[];
}

export interface ITilesetterData {
  tile_size: number;
  map_width: number;
  map_height: number;
  layers: ITilesetterLayer[];
}

