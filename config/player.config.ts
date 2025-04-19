interface IPlayerConfig {
  radius: number;
  walkSpeed: number;
  jumpForce: number;
  airTime: number;
  jumpTimeout: number;
  friction: number;
  frictionAir: number;
  mass: number;
}

const playerConfig: IPlayerConfig = {
  radius: 16,
  walkSpeed: 3,
  jumpForce: 0.000025,
  airTime: 100,
  jumpTimeout: 175,
  friction: 1,
  frictionAir: 0.3,
  mass: 0.01
}

export default playerConfig;
