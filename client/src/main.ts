import { Game as MainGame } from "./scenes/Game";
import { AUTO, Game, Scale, Types } from "phaser";
import physicsConfig from "../../config/physics.config";
import { UI } from "./scenes/UI";
import { Preloader } from "./scenes/Preloader";
import { Lobby } from "./scenes/Lobby";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
  type: AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  backgroundColor: "#028af8",
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
  },
  pixelArt: true,
  physics: {
    default: "matter",
    matter: {
      debug: true,
      gravity: physicsConfig.gravity,
      velocityIterations: physicsConfig.velocityIterations,
      positionIterations: physicsConfig.positionIterations,
      enableSleeping: true,
      setBounds: physicsConfig.worldBounds,
    },
  },
  scene: [Preloader, MainGame, UI, Lobby],
};

export default new Game(config);
