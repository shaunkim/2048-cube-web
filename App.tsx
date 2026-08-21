import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  initialWindowMetrics,
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import { CubeBoard } from './src/components/CubeBoard';
import { DirectionPad } from './src/components/DirectionPad';
import { GameHud } from './src/components/GameHud';
import { GameOverScreen } from './src/components/GameOverScreen';
import { GameOverlay } from './src/components/GameOverlay';
import { LeaderboardPlaceholder } from './src/components/LeaderboardPlaceholder';
import { MenuSheet } from './src/components/MenuSheet';
import { TutorialScreen } from './src/components/TutorialScreen';
import { startInvalidMovePulse } from './src/components/invalidMovePulse';
import { FEEDBACK_URL, WebFooter } from './src/components/WebFooter';
import { useDirectionalInput } from './src/input/useDirectionalInput';
import { type GameControllerDependencies, useGameController } from './src/state/useGameController';
import { gameTheme } from './src/theme/gameTheme';

export interface AppProps {
  readonly controllerDependencies?: GameControllerDependencies;
  readonly [key: string]: unknown;
}

export const GAME_OVER_TRANSITION_MS = 500;

export function cubeWidthFor(windowWidth: number): number {
  return windowWidth >= 720
    ? Math.min(windowWidth - 96, 1120)
    : Math.min(windowWidth + 48, 680);
}

type Panel = 'game' | 'menu' | 'tutorial';

export default function App({ controllerDependencies }: AppProps = {}) {
  const [fontsLoaded, fontError] = useFonts({
    'ClearSans-Regular': require('./assets/ClearSans-Regular.ttf'),
    'ClearSans-Medium': require('./assets/ClearSans-Medium.ttf'),
    'ClearSans-Bold': require('./assets/ClearSans-Bold.ttf'),
  });
  const controller = useGameController(controllerDependencies);
  const { width: windowWidth } = useWindowDimensions();
  const cubeWidth = cubeWidthFor(windowWidth);
  const isPhoneLayout = windowWidth < 720;
  const cubeOpacity = useRef(new Animated.Value(1)).current;
  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [panel, setPanel] = useState<Panel>('game');
  const [messageCycle, setMessageCycle] = useState(0);
  const [tutorialPage, setTutorialPage] = useState(0);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [gameOverTransitionPending, setGameOverTransitionPending] = useState(false);
  const inputLocked = controller.locked || panel !== 'game' || leaderboardVisible;
  const panHandlers = useDirectionalInput(controller.move, inputLocked);
  const invalidMoveCount = controller.invalidMoveCount;
  const totalScore = Object.values(controller.game.faces).reduce((total, face) => total + face.score, 0);
  const gameOverStarted = controller.animation?.gameOverStarted ?? false;
  const showGameOver = controller.game.status === 'gameOver' && !gameOverStarted && !gameOverTransitionPending;

  useEffect(() => {
    if (invalidMoveCount === 0) return;

    const pulse = startInvalidMovePulse(cubeOpacity);
    pulse.start();
    return () => pulse.stop();
  }, [cubeOpacity, invalidMoveCount]);

  useEffect(() => {
    if (!gameOverStarted || gameOverTimerRef.current !== null) return;

    setGameOverTransitionPending(true);
    gameOverTimerRef.current = setTimeout(() => {
      gameOverTimerRef.current = null;
      setGameOverTransitionPending(false);
    }, GAME_OVER_TRANSITION_MS);
  }, [gameOverStarted]);

  useEffect(() => () => {
    if (gameOverTimerRef.current !== null) clearTimeout(gameOverTimerRef.current);
  }, []);

  const openMenu = () => {
    setPanel('menu');
  };

  const restartGame = () => {
    controller.restart();
    setMessageCycle((cycle) => cycle + 1);
  };

  const startNewGame = () => {
    restartGame();
    setPanel('game');
  };

  const openTutorial = () => {
    setTutorialPage(0);
    setPanel('tutorial');
  };

  const openFeedback = () => {
    void Linking.openURL(FEEDBACK_URL).catch(() => undefined);
  };

  if (!controller.hydrated || (!fontsLoaded && !fontError)) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView testID="safe-area-root" style={styles.screen}>
          <StatusBar style="dark" />
          <Text style={styles.loading}>Loading saved game…</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView testID="safe-area-root" style={styles.screen}>
        <StatusBar style="dark" />
        {showGameOver ? (
          <GameOverScreen
            game={controller.game}
            score={totalScore}
            best={controller.records.bestTotalScore}
            onTryAgain={restartGame}
          />
        ) : <>
          <GameHud
          game={controller.game}
          messageCycle={messageCycle}
          records={controller.records}
          onMenu={openMenu}
          onLeaderboard={() => setLeaderboardVisible(true)}
        />
        <View style={styles.content}>
          <Animated.View
            testID="cube-stage"
            {...panHandlers}
            style={[
              styles.cubeContainer,
              isPhoneLayout && styles.phoneCubeContainer,
              { width: cubeWidth, maxHeight: '72%', opacity: cubeOpacity },
            ]}
          >
            <CubeBoard
              state={controller.game}
              animation={controller.animation}
              celebration={controller.celebration}
            />
          </Animated.View>
          <DirectionPad
            onDirection={controller.move}
            disabled={!controller.hydrated || inputLocked}
            compact={isPhoneLayout}
          />
        </View>
          <WebFooter compact={isPhoneLayout} />
          <GameOverlay celebration={controller.celebration} />
        <MenuSheet
          visible={panel === 'menu'}
          onResume={() => setPanel('game')}
          onNewGame={startNewGame}
          onTutorial={openTutorial}
          onFeedback={openFeedback}
        />
        <TutorialScreen
          visible={panel === 'tutorial'}
          page={tutorialPage}
          onPageChange={setTutorialPage}
          onCloseToMenu={openMenu}
          onPlay={() => setPanel('game')}
        />
        <LeaderboardPlaceholder
          visible={leaderboardVisible}
          onClose={() => setLeaderboardVisible(false)}
        />
        </>}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: gameTheme.background,
  },
  loading: {
    color: gameTheme.ink,
    fontFamily: gameTheme.fonts.regular,
    fontSize: 16,
    marginTop: 40,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-around',
    maxWidth: 704,
    minHeight: 0,
    paddingBottom: 10,
    width: '100%',
  },
  cubeContainer: {
    aspectRatio: 520 / 450,
    maxHeight: '62%',
  },
  phoneCubeContainer: {
    marginTop: 12,
  },
});
