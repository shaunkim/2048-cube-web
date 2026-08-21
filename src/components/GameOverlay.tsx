import { StyleSheet, Text, View } from 'react-native';

import { scoreMultiplierFor } from '../game/coordinator';
import type { GlobalTurnResult } from '../game/model';
import { gameTheme } from '../theme/gameTheme';

export interface GameOverlayProps { readonly celebration: GlobalTurnResult | null }

export function GameOverlay({ celebration }: GameOverlayProps) {
  if (!celebration || celebration.completedFacesStarted.length === 0) return null;
  const multiplier = scoreMultiplierFor(celebration.state.faces);
  const message = celebration.victoryStarted
    ? `2048³ complete! SCORE ×${multiplier}`
    : `SCORE ×${multiplier}`;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Text accessibilityRole="alert" style={styles.banner}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', left: 0, position: 'absolute', right: 0, top: 14, zIndex: 2 },
  banner: { backgroundColor: gameTheme.ink, borderRadius: 10, color: gameTheme.lightText, fontFamily: gameTheme.fonts.bold, fontSize: 14, fontWeight: '800', paddingHorizontal: 14, paddingVertical: 9 },
});
