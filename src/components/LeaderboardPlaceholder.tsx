import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { gameTheme } from '../theme/gameTheme';

export interface LeaderboardPlaceholderProps { readonly visible: boolean; readonly onClose: () => void }

export function LeaderboardPlaceholder({ visible, onClose }: LeaderboardPlaceholderProps) {
  if (!visible) return null;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal accessibilityLabel="Leaderboard" role="dialog" style={styles.sheet}>
          <Text style={styles.heading}>Leaderboard coming soon</Text>
          <Text style={styles.body}>The web leaderboard will open when its separate score service is ready.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close leaderboard" onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>CLOSE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(119,110,101,0.28)', flex: 1, justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: gameTheme.background, borderRadius: 16, gap: 14, maxWidth: 360, padding: 22, width: '100%' },
  heading: { color: gameTheme.ink, fontFamily: gameTheme.fonts.bold, fontSize: 25, fontWeight: '800' },
  body: { color: gameTheme.mutedInk, fontFamily: gameTheme.fonts.regular, fontSize: 15, lineHeight: 21 },
  button: { alignItems: 'center', backgroundColor: gameTheme.action, borderRadius: 8, minHeight: 48, justifyContent: 'center' },
  buttonText: { color: gameTheme.lightText, fontFamily: gameTheme.fonts.bold, fontWeight: '800' },
});
