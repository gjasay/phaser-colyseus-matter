interface IGameConfig {
  fixedTimestep: number;
}

const gameConfig: IGameConfig = {
  fixedTimestep: 1000 / 60
}

export default gameConfig;
