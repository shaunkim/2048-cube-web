import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gameTheme } from '../theme/gameTheme';

export interface MenuSheetProps {
  readonly visible: boolean;
  readonly onResume: () => void;
  readonly onNewGame: () => void;
  readonly onTutorial: () => void;
  readonly onFeedback: () => void;
}

const ACTIONS = [
  ['Resume', 'RESUME', 'onResume'],
  ['New Game', 'NEW GAME', 'onNewGame'],
  ['Tutorial', 'TUTORIAL', 'onTutorial'],
  ['Feedback and support', 'FEEDBACK', 'onFeedback'],
] as const;

export function MenuSheet(props: MenuSheetProps) {
  if (!props.visible) return null;

  return (
    <Modal visible animationType="fade" onRequestClose={props.onResume}>
      <SafeAreaView style={styles.screen}>
        <View accessibilityViewIsModal accessibilityLabel="Game menu" role="dialog" style={styles.content}>
          <Text style={styles.heading}>MENU</Text>
          <View style={styles.actions}>
            {ACTIONS.map(([accessibilityLabel, label, callback]) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                key={label}
                onPress={props[callback]}
                style={styles.button}
              >
                <Text style={styles.buttonText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: gameTheme.background, flex: 1 },
  content: { alignItems: 'center', flex: 1, paddingHorizontal: 30, paddingTop: 54 },
  heading: { color: gameTheme.ink, fontFamily: gameTheme.fonts.bold, fontSize: 54, fontWeight: '800', marginBottom: 42 },
  actions: { gap: 16, maxWidth: 420, width: '100%' },
  button: { alignItems: 'center', backgroundColor: gameTheme.board, borderRadius: 10, justifyContent: 'center', minHeight: 72, paddingHorizontal: 16 },
  buttonText: { color: gameTheme.lightText, fontFamily: gameTheme.fonts.bold, fontSize: 24, fontWeight: '800' },
});
