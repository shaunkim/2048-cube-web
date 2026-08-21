import Svg from 'react-native-svg';

import type { FaceId, GameState, GlobalTurnResult } from '../game/model';
import { DEFAULT_CUBE_VIEWPORT } from '../geometry/cubeGeometry';
import { FaceGrid } from './FaceGrid';

export interface CubeBoardProps {
  readonly state: GameState;
  readonly animation?: GlobalTurnResult | null;
  readonly celebration?: GlobalTurnResult | null;
  readonly forceFullColor?: boolean;
}

function eventFor(animation: GlobalTurnResult | null | undefined, face: FaceId) {
  return animation?.faces.find((event) => event.face === face);
}

export function CubeBoard({
  state,
  animation,
  celebration,
  forceFullColor = false,
}: CubeBoardProps) {
  return (
    <Svg
      testID="cube-board"
      width="100%"
      height="100%"
      viewBox={`${DEFAULT_CUBE_VIEWPORT.minX} ${DEFAULT_CUBE_VIEWPORT.minY} ${DEFAULT_CUBE_VIEWPORT.width} ${DEFAULT_CUBE_VIEWPORT.height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <FaceGrid face="top" board={state.faces.top} event={eventFor(animation, 'top')} celebrationEvent={eventFor(celebration, 'top')} forceFullColor={forceFullColor} />
      <FaceGrid face="left" board={state.faces.left} event={eventFor(animation, 'left')} celebrationEvent={eventFor(celebration, 'left')} forceFullColor={forceFullColor} />
      <FaceGrid face="right" board={state.faces.right} event={eventFor(animation, 'right')} celebrationEvent={eventFor(celebration, 'right')} forceFullColor={forceFullColor} />
    </Svg>
  );
}
