import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { gameTheme } from '../theme/gameTheme';

export interface RestartConfirmationProps {
  readonly visible: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function RestartConfirmation({ visible, onCancel, onConfirm }: RestartConfirmationProps) {
  if (!visible) return null;

  return (
    <Modal animationType="none" transparent visible onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View
          role="alertdialog"
          accessibilityLabel="Restart this run?"
          accessibilityViewIsModal
          aria-modal
          style={styles.card}
        >
          <Text style={styles.heading}>Restart this run?</Text>
          <Text style={styles.body}>Current board progress will be replaced.</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel restart" onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Confirm restart" onPress={onConfirm} style={styles.restartButton}>
              <Text style={styles.restartText}>Restart</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(75, 64, 55, 0.24)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 24,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  card: {
    backgroundColor: gameTheme.background,
    borderColor: gameTheme.grid,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    maxWidth: 340,
    padding: 20,
    width: '100%',
  },
  heading: {
    color: gameTheme.ink,
    fontFamily: gameTheme.fonts.bold,
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    color: gameTheme.mutedInk,
    fontFamily: gameTheme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    borderColor: gameTheme.grid,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  cancelText: {
    color: gameTheme.ink,
    fontFamily: gameTheme.fonts.bold,
    fontWeight: '800',
    textAlign: 'center',
  },
  restartButton: {
    backgroundColor: '#a3473f',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 10,
  },
  restartText: {
    color: gameTheme.background,
    fontFamily: gameTheme.fonts.bold,
    fontWeight: '800',
    textAlign: 'center',
  },
});
