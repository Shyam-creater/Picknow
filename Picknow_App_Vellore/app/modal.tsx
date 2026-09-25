import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText allowFontScaling={false} type="title">This is a modal</ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText allowFontScaling={false} type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(5),
  },
  link: {
    marginTop: hp(1.8),
    paddingVertical: hp(1.8),
  },
});
