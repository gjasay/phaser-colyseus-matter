import { Bodies, Body } from "matter-js"
import playerConfig from "../../../../config/player.config"

export function CreatePlayerBody(x: number, y: number): Body {
    return Bodies.circle(
        x, y,
        playerConfig.radius,
        {
            mass: playerConfig.mass,
            friction: playerConfig.friction,
            frictionAir: playerConfig.frictionAir,
            inertia: Infinity,
            collisionFilter: {
                category: 0b0001,
                mask: 0b1110
            }
        }
    );
}
export function CreateTileBody(x: number, y: number): Body {
    return Bodies.rectangle(
        (x * 32) + 16,
        (y * 32) + 16,
        32,
        32,
        {
            inertia: Infinity,
            collisionFilter: {
                category: 0b0010,
                mask: 0b1111
            },
            isStatic: true
        }
    )
}