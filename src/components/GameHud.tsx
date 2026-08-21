import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GameState, ScoreRecords } from '../game/model';
import { scoreMultiplierFor } from '../game/coordinator';
import { gameTheme } from '../theme/gameTheme';
import { progressMessage } from './progressMessage';

export interface GameHudProps {
  readonly game: GameState;
  readonly messageCycle: number;
  readonly records: ScoreRecords;
  readonly onMenu: () => void;
  readonly onLeaderboard: () => void;
}

function ScoreCard({
  label,
  value,
  multiplier,
}: {
  readonly label: string;
  readonly value: number;
  readonly multiplier?: number | undefined;
}) {
  return (
    <View accessibilityLabel={`${label} ${value}${multiplier ? ` times ${multiplier}` : ''}`} style={styles.scoreCard}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreValueRow}>
        <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.scoreValue}>{value}</Text>
        {multiplier && <Text style={styles.multiplier}>×{multiplier}</Text>}
      </View>
    </View>
  );
}

interface ActionButtonProps {
  readonly label: 'Menu' | 'Leaderboard';
  readonly onPress: () => void;
  readonly testID?: string;
}

function ActionButton({ label, onPress, testID }: ActionButtonProps) {
  const leaderboard = label === 'Leaderboard';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      style={styles.actionButton}
    >
      <Text
        adjustsFontSizeToFit={leaderboard}
        numberOfLines={leaderboard ? 1 : undefined}
        style={leaderboard ? styles.leaderboardText : styles.actionText}
      >
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

export function GameHud({ game, messageCycle, records, onMenu, onLeaderboard }: GameHudProps) {
  const total = Object.values(game.faces).reduce((score, face) => score + face.score, 0);
  const scoreMultiplier = scoreMultiplierFor(game.faces);
  const visibleMultiplier = scoreMultiplier > 1 ? scoreMultiplier : undefined;
  return (
    <View accessibilityRole="header" style={styles.container}>
      <View style={styles.headerRow}>
        <View accessibilityLabel="2048 cubed" style={styles.logo}>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.logoText}>2048³</Text>
        </View>
        <View testID="standard-dashboard" style={styles.dashboard}>
          <View style={styles.scoreRow}>
            <ScoreCard label="SCORE" value={total} multiplier={visibleMultiplier} />
            <ScoreCard label="BEST" value={records.bestTotalScore} />
          </View>
          <View style={styles.actionRow}>
            <ActionButton label="Menu" onPress={onMenu} />
            <ActionButton label="Leaderboard" onPress={onLeaderboard} />
          </View>
        </View>
      </View>
      <Text style={styles.progress}>{progressMessage(game, messageCycle)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18, maxWidth: 620, paddingHorizontal: 16, paddingTop: 12, width: '100%' },
  headerRow: { flexDirection: 'row', gap: 12 },
  logo: { alignItems: 'center', backgroundColor: gameTheme.logo, borderRadius: 8, height: 112, justifyContent: 'center', width: 112 },
  logoText: { color: gameTheme.lightText, fontFamily: gameTheme.fonts.bold, fontSize: 39, fontWeight: '800', letterSpacing: -2 },
  dashboard: { flex: 1, gap: 8 },
  scoreRow: { flex: 1, flexDirection: 'row', gap: 10 },
  scoreCard: { alignItems: 'center', backgroundColor: gameTheme.board, borderRadius: 8, flex: 1, justifyContent: 'center', minWidth: 0, paddingHorizontal: 4 },
  scoreLabel: { color: '#EEE9E1', fontFamily: gameTheme.fonts.bold, fontSize: 13, fontWeight: '800' },
  scoreValue: { color: gameTheme.lightText, fontFamily: gameTheme.fonts.bold, fontSize: 27, fontWeight: '800', maxWidth: '100%' },
  scoreValueRow: { alignItems: 'baseline', flexDirection: 'row', gap: 4, justifyContent: 'center', maxWidth: '100%' },
  multiplier: { color: '#EEE9E1', fontFamily: gameTheme.fonts.bold, fontSize: 13, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 10, height: 38 },
  actionButton: { alignItems: 'center', backgroundColor: gameTheme.action, borderRadius: 8, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 4 },
  actionText: { color: gameTheme.lightText, fontFamily: gameTheme.fonts.bold, fontSize: 13, fontWeight: '800' },
  leaderboardText: { color: gameTheme.lightText, fontFamily: gameTheme.fonts.bold, fontSize: 12, fontWeight: '800', maxWidth: '100%' },
  progress: { color: gameTheme.ink, fontFamily: gameTheme.fonts.bold, fontSize: 18, fontWeight: '800', lineHeight: 24 },
});
