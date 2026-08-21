import { useRef } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { gameTheme } from '../theme/gameTheme';

export interface TutorialScreenProps {
  readonly visible: boolean;
  readonly page: number;
  readonly onPageChange: (page: number) => void;
  readonly onCloseToMenu: () => void;
  readonly onPlay: () => void;
}

const PAGES = [
  {
    heading: 'SWIPE IN SIX DIRECTIONS',
    body: 'Every swipe moves two faces of the cube.',
  },
  {
    heading: 'UP AND DOWN',
    body: 'Up and down move the Left and Right faces.',
  },
  {
    heading: 'UP-LEFT AND DOWN-RIGHT',
    body: 'This moves the Top and Left faces.',
  },
  {
    heading: 'UP-RIGHT AND DOWN-LEFT',
    body: 'This moves the Top and Right faces.',
  },
  {
    heading: 'MATCH AND MERGE',
    body: 'Equal tiles combine independently on both moving faces.',
  },
  {
    heading: 'COMPLETE ALL THREE FACES',
    body: 'Reach 2048 or higher on every face. Then keep going!',
  },
] as const;

const cubeTop = '120,52 206,91 120,130 34,91';
const cubeLeft = '34,91 120,130 120,225 34,186';
const cubeRight = '120,130 206,91 206,186 120,225';
const ARROW_WHITE = '#FFFFFF';

interface ArrowProps {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly color: string;
  readonly label?: string;
  readonly width?: number;
}

function Arrow({ x1, y1, x2, y2, color, label, width = 5 }: ArrowProps) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = width * 2.5;
  const headWidth = width * 1.5;
  const baseX = x2 - Math.cos(angle) * headLength;
  const baseY = y2 - Math.sin(angle) * headLength;
  const perpendicularX = Math.sin(angle) * headWidth;
  const perpendicularY = -Math.cos(angle) * headWidth;
  const points = `${x2},${y2} ${baseX + perpendicularX},${baseY + perpendicularY} ${baseX - perpendicularX},${baseY - perpendicularY}`;

  return (
    <G accessible={Boolean(label)} accessibilityLabel={label}>
      <Line x1={x1} y1={y1} x2={baseX} y2={baseY} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <Polygon points={points} fill={color} />
    </G>
  );
}

function Axis({
  x1,
  y1,
  x2,
  y2,
  label,
  testID,
}: Omit<ArrowProps, 'color' | 'width'> & { readonly testID?: string }) {
  return (
    <G accessible accessibilityLabel={label} testID={testID}>
      <Arrow x1={x1} y1={y1} x2={x2} y2={y2} color={ARROW_WHITE} width={5} />
      <Arrow x1={x2} y1={y2} x2={x1} y2={y1} color={ARROW_WHITE} width={5} />
    </G>
  );
}

type TutorialFace = 'top' | 'left' | 'right';

function CubeBase({
  colorAll = false,
  highlighted = ['top', 'left', 'right'],
}: {
  readonly colorAll?: boolean;
  readonly highlighted?: readonly TutorialFace[];
}) {
  const opacity = (face: TutorialFace) => highlighted.includes(face) ? 1 : 0.3;

  return (
    <G>
      <Polygon points={cubeTop} fill={colorAll ? '#EDC53F' : gameTheme.faces.top} opacity={opacity('top')} stroke={gameTheme.grid} strokeWidth={2} />
      <Polygon points={cubeLeft} fill={colorAll ? '#F2B179' : gameTheme.faces.left} opacity={opacity('left')} stroke={gameTheme.grid} strokeWidth={2} />
      <Polygon points={cubeRight} fill={colorAll ? '#F59563' : gameTheme.faces.right} opacity={opacity('right')} stroke={gameTheme.grid} strokeWidth={2} />
    </G>
  );
}

type DirectionAxis = 'up-down' | 'up-left' | 'up-right';

function FaceAxes({ axis }: { readonly axis: DirectionAxis }) {
  if (axis === 'up-down') {
    return (
      <>
        <Axis label="White up and down arrows on left face" testID="tutorial-axis-up-down-left" x1={60} y1={136} x2={60} y2={180} />
        <Axis label="White up and down arrows on right face" testID="tutorial-axis-up-down-right" x1={180} y1={136} x2={180} y2={180} />
      </>
    );
  }
  if (axis === 'up-left') {
    return (
      <>
        <Axis label="White up-left and down-right arrows on top face" testID="tutorial-axis-up-left-top" x1={78} y1={78} x2={120} y2={105} />
        <Axis label="White up-left and down-right arrows on left face" testID="tutorial-axis-up-left-left" x1={48} y1={148} x2={90} y2={170} />
      </>
    );
  }
  return (
    <>
      <Axis label="White up-right and down-left arrows on top face" testID="tutorial-axis-up-right-top" x1={120} y1={105} x2={162} y2={78} />
      <Axis label="White up-right and down-left arrows on right face" testID="tutorial-axis-up-right-right" x1={150} y1={170} x2={192} y2={148} />
    </>
  );
}

function DirectionGraphic({ axis }: { readonly axis: DirectionAxis }) {
  const config = {
    'up-down': {
      highlighted: ['left', 'right'] as const,
    },
    'up-left': {
      highlighted: ['top', 'left'] as const,
    },
    'up-right': {
      highlighted: ['top', 'right'] as const,
    },
  }[axis];

  return (
    <G>
      <CubeBase highlighted={config.highlighted} />
      <FaceAxes axis={axis} />
    </G>
  );
}

function TutorialGraphic({ page }: { readonly page: number }) {
  if (page === 0) {
    return (
      <Svg testID="tutorial-graphic-overview" viewBox="0 0 240 270" width="100%" height="100%">
        <CubeBase />
        <FaceAxes axis="up-down" />
        <FaceAxes axis="up-left" />
        <FaceAxes axis="up-right" />
      </Svg>
    );
  }
  if (page === 1) {
    return (
      <Svg testID="tutorial-graphic-up-down" viewBox="0 0 240 270" width="100%" height="100%">
        <DirectionGraphic axis="up-down" />
      </Svg>
    );
  }
  if (page === 2) {
    return (
      <Svg testID="tutorial-graphic-up-left" viewBox="0 0 240 270" width="100%" height="100%">
        <DirectionGraphic axis="up-left" />
      </Svg>
    );
  }
  if (page === 3) {
    return (
      <Svg testID="tutorial-graphic-up-right" viewBox="0 0 240 270" width="100%" height="100%">
        <DirectionGraphic axis="up-right" />
      </Svg>
    );
  }
  if (page === 4) {
    return (
      <Svg testID="tutorial-graphic-merge" viewBox="0 0 240 270" width="100%" height="100%">
        <G accessible accessibilityLabel="Two plus two merges upward into four">
          <Rect x={38} y={190} width={62} height={48} rx={7} fill="#EEE4DA" />
          <Rect x={38} y={136} width={62} height={48} rx={7} fill="#EEE4DA" />
          <Arrow x1={69} y1={128} x2={69} y2={92} color={gameTheme.action} width={4} />
          <Rect x={38} y={35} width={62} height={48} rx={7} fill="#EDE0C8" />
          <G fill={gameTheme.ink} fontFamily={gameTheme.fonts.bold} fontSize={22} fontWeight="700" textAnchor="middle">
            <SvgText x={69} y={221}>2</SvgText>
            <SvgText x={69} y={167}>2</SvgText>
            <SvgText x={69} y={67}>4</SvgText>
          </G>
        </G>
        <G accessible accessibilityLabel="Four plus four merges upward into eight">
          <Rect x={140} y={190} width={62} height={48} rx={7} fill="#EDE0C8" />
          <Rect x={140} y={136} width={62} height={48} rx={7} fill="#EDE0C8" />
          <Arrow x1={171} y1={128} x2={171} y2={92} color={gameTheme.action} width={4} />
          <Rect x={140} y={35} width={62} height={48} rx={7} fill="#F2B179" />
          <G fill={gameTheme.ink} fontFamily={gameTheme.fonts.bold} fontSize={22} fontWeight="700" textAnchor="middle">
            <SvgText x={171} y={221}>4</SvgText>
            <SvgText x={171} y={167}>4</SvgText>
            <SvgText x={171} y={67}>8</SvgText>
          </G>
        </G>
      </Svg>
    );
  }
  return (
    <Svg testID="tutorial-graphic-goal" viewBox="0 0 240 270" width="100%" height="100%">
      <CubeBase colorAll />
      <G fill={gameTheme.lightText} fontFamily={gameTheme.fonts.bold} fontSize={20} fontWeight="800" textAnchor="middle">
        <SvgText x={120} y={99}>2048</SvgText>
        <SvgText x={76} y={166}>2048</SvgText>
        <SvgText x={164} y={166}>2048</SvgText>
      </G>
    </Svg>
  );
}

function TutorialButton({ label, onPress, primary = false }: { readonly label: string; readonly onPress: () => void; readonly primary?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.navButton, primary && styles.primaryButton]}>
      <Text style={styles.navText}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

export function TutorialScreen({ visible, page, onPageChange, onCloseToMenu, onPlay }: TutorialScreenProps) {
  const touchStart = useRef<Readonly<{ x: number; y: number }> | null>(null);
  if (!visible) return null;
  const safePage = Math.max(0, Math.min(PAGES.length - 1, page));
  const content = PAGES[safePage]!;

  const handleTouchStart = (event: GestureResponderEvent) => {
    touchStart.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
  };
  const handleTouchEnd = (event: GestureResponderEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const deltaX = event.nativeEvent.pageX - start.x;
    const deltaY = event.nativeEvent.pageY - start.y;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (deltaX < 0 && safePage < PAGES.length - 1) onPageChange(safePage + 1);
    if (deltaX > 0 && safePage > 0) onPageChange(safePage - 1);
  };

  return (
    <Modal visible animationType="fade" onRequestClose={onCloseToMenu}>
      <SafeAreaView style={styles.screen}>
        <View
          testID="tutorial-swipe-area"
          accessibilityViewIsModal
          accessibilityLabel="Tutorial"
          role="dialog"
          style={styles.content}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => { touchStart.current = null; }}
        >
          <Text style={styles.heading}>{content.heading}</Text>
          <Text style={styles.body}>{content.body}</Text>
          <View style={styles.graphic}><TutorialGraphic page={safePage} /></View>
          <View accessibilityLabel={`Page ${safePage + 1} of ${PAGES.length}`} style={styles.indicators}>
            {PAGES.map((_, index) => (
              <View key={index} testID={`tutorial-page-indicator-${index + 1}`} style={[styles.indicator, index === safePage && styles.activeIndicator]} />
            ))}
          </View>
          <View style={styles.navigation}>
            <TutorialButton label="Menu" onPress={onCloseToMenu} />
            {safePage > 0 && <TutorialButton label="Back" onPress={() => onPageChange(safePage - 1)} />}
            {safePage < PAGES.length - 1
              ? <TutorialButton label="Next" onPress={() => onPageChange(safePage + 1)} primary />
              : <TutorialButton label="Let's Play" onPress={onPlay} primary />}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: gameTheme.background, flex: 1 },
  content: { alignItems: 'center', flex: 1, paddingHorizontal: 24, paddingTop: 34 },
  heading: { color: gameTheme.action, fontFamily: gameTheme.fonts.bold, fontSize: 25, fontWeight: '800', textAlign: 'center' },
  body: { color: gameTheme.ink, fontFamily: gameTheme.fonts.medium, fontSize: 17, lineHeight: 24, marginTop: 12, maxWidth: 410, textAlign: 'center' },
  graphic: { aspectRatio: 240 / 270, flex: 1, maxHeight: 390, maxWidth: 350, minHeight: 240, width: '100%' },
  indicators: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  indicator: { backgroundColor: '#B9B0A5', borderRadius: 6, height: 12, width: 12 },
  activeIndicator: { backgroundColor: gameTheme.action },
  navigation: { flexDirection: 'row', gap: 10, justifyContent: 'center', paddingBottom: 18, width: '100%' },
  navButton: { alignItems: 'center', backgroundColor: gameTheme.board, borderRadius: 8, flex: 1, justifyContent: 'center', maxWidth: 150, minHeight: 52, paddingHorizontal: 10 },
  primaryButton: { backgroundColor: gameTheme.action },
  navText: { color: gameTheme.lightText, fontFamily: gameTheme.fonts.bold, fontSize: 14, fontWeight: '800' },
});
