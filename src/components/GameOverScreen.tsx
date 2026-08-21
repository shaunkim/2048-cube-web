import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { GameState } from '../game/model';
import { gameTheme } from '../theme/gameTheme';
import { CubeBoard } from './CubeBoard';

type ShareOutcome = 'shared' | 'copied' | 'unavailable';
type ShareResult = (message: string) => Promise<ShareOutcome>;

async function defaultShareResult(message: string): Promise<ShareOutcome> {
  const browser = globalThis.navigator as Navigator & {
    share?: (data: { text: string }) => Promise<void>;
    clipboard?: { writeText(text: string): Promise<void> };
  };
  if (browser.share) {
    await browser.share({ text: message });
    return 'shared';
  }
  if (browser.clipboard) {
    await browser.clipboard.writeText(message);
    return 'copied';
  }
  return 'unavailable';
}

export interface GameOverScreenProps {
  readonly game: GameState;
  readonly score: number;
  readonly best: number;
  readonly onTryAgain: () => void;
  readonly shareResult?: ShareResult;
}

function ShareCard({ game, message }: { readonly game: GameState; readonly message: string }) {
  return (
    <View testID="share-card" style={styles.shareCard}>
      <Text style={styles.shareBrand}>2048³</Text>
      <View style={styles.shareCube}>
        <CubeBoard state={game} forceFullColor />
      </View>
      <Text style={styles.shareMessage}>{message}</Text>
    </View>
  );
}

export function GameOverScreen({ game, score, best, onTryAgain, shareResult = defaultShareResult }: GameOverScreenProps) {
  const [entrance] = useState(() => new Animated.Value(0));
  const [shareStatus, setShareStatus] = useState('');
  const shareMessage = `I scored ${score.toLocaleString('en-US')} points in 2048³!`;

  useEffect(() => {
    const animation = Animated.timing(entrance, { toValue: 1, duration: 450, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [entrance]);

  const share = async () => {
    try {
      const outcome = await shareResult(shareMessage);
      setShareStatus(outcome === 'copied' ? 'Score copied.' : outcome === 'shared' ? 'Score shared.' : 'Sharing is unavailable.');
    } catch {
      setShareStatus('Sharing was cancelled.');
    }
  };

  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return (
    <Animated.View testID="game-over-screen" style={[styles.screen, { opacity: entrance, transform: [{ translateY }] }]}>
      <Text accessibilityRole="header" style={styles.heading}>Game Over!</Text>
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>SCORE</Text>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.best}>Best {best}</Text>
      </View>
      <ShareCard game={game} message={shareMessage} />
      <Pressable accessibilityRole="button" accessibilityLabel="Share score" onPress={() => void share()} style={styles.button}>
        <Text style={styles.buttonText}>SHARE</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Try again" onPress={onTryAgain} style={styles.button}>
        <Text style={styles.buttonText}>TRY AGAIN</Text>
      </Pressable>
      {shareStatus.length > 0 && <Text testID="share-status" accessibilityLiveRegion="polite" style={styles.status}>{shareStatus}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'stretch', alignSelf: 'center', flex: 1, gap: 12, justifyContent: 'center', maxWidth: 390, padding: 22, width: '100%' },
  heading: { color: gameTheme.ink, fontFamily: gameTheme.fonts.bold, fontSize: 44, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  scoreCard: { alignItems: 'center', backgroundColor: gameTheme.board, borderRadius: 8, gap: 3, minHeight: 116, justifyContent: 'center' },
  scoreLabel: { color: '#EEE9E1', fontFamily: gameTheme.fonts.bold, fontSize: 16, fontWeight: '800' },
  score: { color: gameTheme.lightText, fontFamily: gameTheme.fonts.bold, fontSize: 32, fontWeight: '800' },
  best: { color: gameTheme.lightText, fontFamily: gameTheme.fonts.medium, fontSize: 14, fontWeight: '700' },
  shareCard: { alignItems: 'center', alignSelf: 'center', backgroundColor: gameTheme.background, borderColor: gameTheme.board, borderRadius: 8, borderWidth: 3, gap: 4, padding: 8, width: 230 },
  shareBrand: { color: gameTheme.ink, fontFamily: gameTheme.fonts.bold, fontSize: 22, fontWeight: '800' },
  shareCube: { aspectRatio: 520 / 450, width: 190 },
  shareMessage: { color: gameTheme.ink, fontFamily: gameTheme.fonts.bold, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  button: { alignItems: 'center', backgroundColor: gameTheme.board, borderRadius: 8, justifyContent: 'center', minHeight: 62 },
  buttonText: { color: gameTheme.lightText, fontFamily: gameTheme.fonts.bold, fontSize: 25, fontWeight: '800' },
  status: { color: gameTheme.mutedInk, fontFamily: gameTheme.fonts.regular, fontSize: 14, textAlign: 'center' },
});
