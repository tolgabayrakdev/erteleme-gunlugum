import React, { useEffect } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Wait 2 seconds then fade out and call onFinish
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ThemedText type="title" style={styles.title}>
          Erteleme Günlüğüne
        </ThemedText>
        <ThemedText type="title" style={styles.subtitle}>
          Hoş Geldin! 👋
        </ThemedText>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0a7ea4',
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0a7ea4',
  },
});

