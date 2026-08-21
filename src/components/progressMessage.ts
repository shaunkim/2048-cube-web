import type { GameState } from '../game/model';

const OPENING_MESSAGES = [
  'Get a 2048 tile on all three faces!',
  'Build every face. Complete the cube!',
  'Two faces move with every swipe—plan ahead!',
  'Keep matching. Three faces, one goal!',
] as const;

const ONE_FACE_MESSAGES = [
  'One face complete—two to go!',
  '2048 secured! Now build the second face.',
  'Great start—bring another face to 2048!',
] as const;

const TWO_FACE_MESSAGES = [
  'Two faces complete—finish the cube!',
  'One face left. You’re almost there!',
  'Final face—take it all the way to 2048!',
] as const;

const COMPLETE_MESSAGES = [
  (target: number) => `Cube complete! Your next goal is the ${target} tile!`,
  (target: number) => `All three faces cleared—push them toward ${target}!`,
  (target: number) => `Amazing! Can every face reach ${target}?`,
] as const;

function messageAt<T>(messages: readonly T[], messageCycle: number): T {
  return messages[((messageCycle % messages.length) + messages.length) % messages.length]!;
}

function nextSharedTarget(game: GameState): number {
  const sharedMilestone = Math.min(...Object.values(game.faces).map((face) =>
    Math.max(2048, ...face.cells.map((tile) => tile?.value ?? 0)),
  ));
  return sharedMilestone * 2;
}

export function progressMessage(game: GameState, messageCycle: number): string {
  const completed = Object.values(game.faces).filter((face) => face.completed2048).length;
  if (completed === 0) return messageAt(OPENING_MESSAGES, messageCycle);
  if (completed === 1) return messageAt(ONE_FACE_MESSAGES, messageCycle);
  if (completed === 2) return messageAt(TWO_FACE_MESSAGES, messageCycle);

  return messageAt(COMPLETE_MESSAGES, messageCycle)(nextSharedTarget(game));
}
