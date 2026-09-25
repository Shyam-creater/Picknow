import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
  Easing,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { useRouter } from 'expo-router';
import { authService } from '@/Services/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const titleScaleX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const formAnims = useRef(
    Array.from({ length: 5 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(10),
    }))
  ).current;

  useEffect(() => {
    // Main fade - faster
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();

    // Logo gentle float
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: -4, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue: 4, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Title underline grow - now with native driver
    Animated.timing(titleScaleX, {
      toValue: 1, duration: 600, delay: 200, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();

    // Form stagger - much faster
    Animated.stagger(60, formAnims.map(a =>
      Animated.parallel([
        Animated.timing(a.opacity, { toValue: 1, duration: 300, delay: 100, useNativeDriver: true }),
        Animated.timing(a.translateY, { toValue: 0, duration: 300, delay: 100, useNativeDriver: true }),
      ])
    )).start();
  }, []);

  const onBtnIn = () => Animated.spring(buttonScale, { toValue: 0.96, friction: 5, useNativeDriver: true }).start();
  const onBtnOut = () => Animated.spring(buttonScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill all fields'); return; }
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      login(res.token, res.user);
      // router.replace handles this in AuthContext
    } catch (e: any) { Alert.alert('Login Failed', e.message); }
    finally { setIsLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Top decorative accent */}
      <View style={[styles.topAccent, { height: insets.top + hp(12) }]}>
        <View style={styles.accentCircle1} />
        <View style={styles.accentCircle2} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + hp(6), paddingBottom: insets.bottom + hp(3) }]}
        style={{ flex: 1, opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={rf(20)} color="#FFF" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ translateY: logoFloat }] }}>
            <Image source={require('../../assets/images/Kairaa4.png')} style={styles.logoImage} resizeMode="contain" />
          </Animated.View>
          <View style={styles.titleRow}>
            <Text allowFontScaling={false} style={styles.title}>Welcome </Text>
            <Text allowFontScaling={false} style={styles.titleAccent}>Back</Text>
          </View>
          <Animated.View style={[styles.titleUnderline, {
            width: '30%',
            transform: [{ scaleX: titleScaleX }]
          }]} />
          <Text allowFontScaling={false} style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <Animated.View style={[styles.inputGroup, { opacity: formAnims[0].opacity, transform: [{ translateY: formAnims[0].translateY }] }]}>
            <Text allowFontScaling={false} style={styles.label}>
              <Ionicons name="mail" size={rf(11)} color="#F38000" />  Email Address
            </Text>
            <View style={[styles.inputWrap, focusedField === 'email' && styles.inputActive]}>
              <TextInput
                allowFontScaling={false} style={styles.input}
                placeholder="you@example.com" placeholderTextColor="#C8CDD3"
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                value={email} onChangeText={setEmail}
                onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
              />
              {email.length > 3 ? <View style={styles.validDot} /> : null}
            </View>
          </Animated.View>

          {/* Password */}
          <Animated.View style={[styles.inputGroup, { opacity: formAnims[1].opacity, transform: [{ translateY: formAnims[1].translateY }] }]}>
            <Text allowFontScaling={false} style={styles.label}>
              <Ionicons name="lock-closed" size={rf(11)} color="#F38000" />  Password
            </Text>
            <View style={[styles.inputWrap, focusedField === 'pw' && styles.inputActive]}>
              <TextInput
                allowFontScaling={false} style={styles.input}
                placeholder="Enter your password" placeholderTextColor="#C8CDD3"
                secureTextEntry={!showPassword} value={password} onChangeText={setPassword}
                onFocus={() => setFocusedField('pw')} onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={rf(18)} color="#B0B8C4" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Forgot */}
          <Animated.View style={{ opacity: formAnims[2].opacity, transform: [{ translateY: formAnims[2].translateY }] }}>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} hitSlop={{ top: 8, bottom: 8 }}>
              <Text allowFontScaling={false} style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Sign In Button */}
          <Animated.View style={{ opacity: formAnims[3].opacity, transform: [{ translateY: formAnims[3].translateY }, { scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.signInBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin} onPressIn={onBtnIn} onPressOut={onBtnOut}
              disabled={isLoading} activeOpacity={1}
            >
              {isLoading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Text allowFontScaling={false} style={styles.signInText}>Sign In</Text>
                  <View style={styles.btnArrow}>
                    <Ionicons name="arrow-forward" size={rf(16)} color="#F38000" />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: formAnims[4].opacity, transform: [{ translateY: formAnims[4].translateY }] }]}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text allowFontScaling={false} style={styles.dividerLabel}>NEW HERE?</Text>
            <View style={styles.dividerLine} />
          </View>
          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')} activeOpacity={0.8}>
            <Text allowFontScaling={false} style={styles.registerText}>Create an Account</Text>
            <Ionicons name="chevron-forward" size={rf(14)} color="#F38000" />
          </TouchableOpacity>
          <View style={styles.badges}>
            <View style={styles.badge}><Ionicons name="shield-checkmark" size={rf(14)} color="#94A3B8" /><Text allowFontScaling={false} style={styles.badgeText}>Secure</Text></View>
            <View style={styles.badgeSep} />
            <View style={styles.badge}><Ionicons name="lock-closed" size={rf(14)} color="#94A3B8" /><Text allowFontScaling={false} style={styles.badgeText}>Encrypted</Text></View>
            <View style={styles.badgeSep} />
            <View style={styles.badge}><Ionicons name="finger-print" size={rf(14)} color="#94A3B8" /><Text allowFontScaling={false} style={styles.badgeText}>Private</Text></View>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  topAccent: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#FFF7ED', borderBottomLeftRadius: rf(40), borderBottomRightRadius: rf(40),
    overflow: 'hidden',
  },
  accentCircle1: {
    position: 'absolute', top: -hp(4), right: -wp(8),
    width: wp(35), height: wp(35), borderRadius: wp(17.5),
    backgroundColor: '#FFEDD5', opacity: 0.6,
  },
  accentCircle2: {
    position: 'absolute', top: hp(2), left: -wp(6),
    width: wp(20), height: wp(20), borderRadius: wp(10),
    backgroundColor: '#FED7AA', opacity: 0.3,
  },
  content: { flexGrow: 1, paddingHorizontal: wp(7), justifyContent: 'center' },
  backBtn: {
    position: 'absolute', top: 0, left: 0, zIndex: 10,
    width: rf(38), height: rf(38), borderRadius: rf(19),
    backgroundColor: 'rgba(243,128,0,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  header: { alignItems: 'center', marginBottom: hp(4) },
  logoImage: { width: wp(42), height: hp(6), marginBottom: hp(2) },
  titleRow: { flexDirection: 'row', alignItems: 'baseline' },
  title: { fontSize: rf(28), fontWeight: '300', color: '#1E293B', letterSpacing: -0.3 },
  titleAccent: { fontSize: rf(28), fontWeight: '900', color: '#F38000', letterSpacing: -0.3 },
  titleUnderline: { height: 3, backgroundColor: '#F38000', borderRadius: 2, marginTop: hp(0.6), opacity: 0.7 },
  subtitle: { fontSize: rf(13), color: '#94A3B8', marginTop: hp(1), fontWeight: '500', letterSpacing: 0.2 },

  form: { gap: hp(2.2) },
  inputGroup: { gap: hp(0.7) },
  label: { fontSize: rf(12), fontWeight: '700', color: '#475569', marginLeft: wp(0.5) },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: hp(6.2),
    borderWidth: 0, borderBottomWidth: 2, borderBottomColor: '#F1F5F9',
    backgroundColor: 'transparent',
    paddingHorizontal: wp(1),
  },
  inputActive: { borderBottomColor: '#F38000' },
  input: { flex: 1, fontSize: rf(15), color: '#1E293B', height: '100%', fontWeight: '500' },
  validDot: {
    width: rf(8), height: rf(8), borderRadius: rf(4), backgroundColor: '#22C55E',
  },
  forgotText: { textAlign: 'right', color: '#F38000', fontSize: rf(13), fontWeight: '700' },

  signInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: hp(6.2), backgroundColor: '#F38000',
    borderRadius: rf(16), gap: wp(3),
    marginTop: hp(0.5),
    shadowColor: '#F38000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  signInText: { color: '#FFF', fontSize: rf(17), fontWeight: '800', letterSpacing: 0.3 },
  btnArrow: {
    width: rf(28), height: rf(28), borderRadius: rf(14),
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
  },

  footer: { marginTop: hp(4) },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(2) },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#F1F5F9' },
  dividerLabel: { marginHorizontal: wp(3), fontSize: rf(10), fontWeight: '800', color: '#CBD5E1', letterSpacing: 2 },
  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: wp(1.5), height: hp(5.4),
    borderRadius: rf(16), borderWidth: 1.5, borderColor: '#FED7AA',
    backgroundColor: '#FFFBF5', marginBottom: hp(3),
  },
  registerText: { fontSize: rf(14), fontWeight: '700', color: '#F38000' },
  badges: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: wp(3) },
  badge: { flexDirection: 'row', alignItems: 'center', gap: wp(1) },
  badgeText: { fontSize: rf(10), fontWeight: '600', color: '#94A3B8' },
  badgeSep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#E2E8F0' },
});
