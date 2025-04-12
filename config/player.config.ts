interface IPlayerConfig {
  walkSpeed: number;
  jumpForce: number;
  airTime: number;
  jumpTimeout: number;
}

const playerConfig: IPlayerConfig = {
  walkSpeed: 0.00001,
  jumpForce: 0.000025,
  airTime: 100,
  jumpTimeout: 175,
}

export default playerConfig;
