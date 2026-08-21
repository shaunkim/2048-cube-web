import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { gameTheme } from '../theme/gameTheme';

export type FooterDestination = {
  readonly label: string;
  readonly accessibilityLabel?: string;
  readonly mark: string;
  readonly status?: string;
  readonly url: string | null;
};

export type FooterDestinations = Readonly<{
  github: FooterDestination;
  appStore: FooterDestination;
  googlePlay: FooterDestination;
}>;

export const SOURCE_URL = 'https://github.com/shaunkim/2048-cube-web';

export const DESTINATIONS = {
  github: {
    label: 'GitHub',
    accessibilityLabel: 'GitHub repository',
    mark: '<>',
    url: SOURCE_URL,
  },
  appStore: {
    label: 'App Store',
    mark: 'A',
    status: 'Coming soon',
    url: null,
  },
  googlePlay: {
    label: 'Google Play',
    mark: '▶',
    status: 'Coming soon',
    url: null,
  },
} as const satisfies FooterDestinations;

export const FEEDBACK_URL = 'https://github.com/shaunkim/2048-cube-web/issues';

function openPublicUrl(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}

export function WebFooter({ destinations = DESTINATIONS }: { readonly destinations?: FooterDestinations }) {
  return (
    <View style={styles.footer}>
      <DestinationBadge destination={destinations.github} />
      <DestinationBadge destination={destinations.appStore} />
      <DestinationBadge destination={destinations.googlePlay} />
    </View>
  );
}

function DestinationBadge({ destination }: { readonly destination: FooterDestination }) {
  const url = destination.url;
  const badgeContents = <>
    <Text style={styles.mark}>{destination.mark}</Text>
    <Text style={styles.label}>{destination.label}</Text>
    {destination.status ? <Text style={styles.status}>{destination.status}</Text> : null}
  </>;

  if (url) {
    return (
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={destination.accessibilityLabel ?? destination.label}
        onPress={() => openPublicUrl(url)}
        style={styles.badge}
      >
        {badgeContents}
      </Pressable>
    );
  }

  return (
    <View accessible accessibilityLabel={`${destination.label} — ${destination.status ?? 'Coming soon'}`} style={styles.badge}>
      {badgeContents}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingBottom: 12, paddingHorizontal: 16 },
  badge: { alignItems: 'center', backgroundColor: gameTheme.emptyCell, borderColor: gameTheme.grid, borderRadius: 4, borderWidth: 2, flexDirection: 'row', gap: 5, minHeight: 34, paddingHorizontal: 8 },
  mark: { color: gameTheme.ink, fontFamily: gameTheme.fonts.bold, fontSize: 12, letterSpacing: -1 },
  label: { color: gameTheme.ink, fontFamily: gameTheme.fonts.medium, fontSize: 12 },
  status: { color: gameTheme.mutedInk, fontFamily: gameTheme.fonts.regular, fontSize: 10 },
});
