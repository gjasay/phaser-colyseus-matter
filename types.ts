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
