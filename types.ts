export interface IInputMessage {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface IPlacementMessage {
  x: number;
  y: number;
  type: string;
}

