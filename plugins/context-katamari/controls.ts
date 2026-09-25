/**
 * The arrow keys roll the katamari: up and down push it forward and back,
 * left and right steer. A side arrow on its own turns the cousin in place.
 */

export interface Drive {
  /** Push along the cousin's facing, -1 (back) to 1 (forward). */
  forward: number;
  /** Turn rate, -1 (left) to 1 (right). */
  turn: number;
}

export const IDLE_DRIVE: Drive = { forward: 0, turn: 0 };

export const DRIVE_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export function isIdle(drive: Drive): boolean {
  return drive.forward === 0 && drive.turn === 0;
}

export function driveFromKeys(pressed: ReadonlySet<string>): Drive {
  const axis = (plus: string, minus: string) => (pressed.has(plus) ? 1 : 0) - (pressed.has(minus) ? 1 : 0);
  return { forward: axis("ArrowUp", "ArrowDown"), turn: axis("ArrowRight", "ArrowLeft") };
}
