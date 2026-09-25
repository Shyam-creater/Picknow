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
import { useRouter } from 'expo-router';
import { authService } from '@/Services/api';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, rf } from '@/constants/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contact, setContact] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const logoFloat = useRef(new Animated.Value(0)).current;
    const titleScaleX = useRef(new Animated.Value(0)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;
    const checkScale = useRef(new Animated.Value(1)).current;

    const formAnims = useRef(
        Array.from({ length: 7 }, () => ({
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(10),
        }))
    ).current;

    useEffect(() => {
        // Main fade - faster
        Animated.timing(fadeAnim, {
            toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true,
        }).start();

        // Logo float
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoFloat, { toValue: -4, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(logoFloat, { toValue: 4, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();

        // Title underline - native
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

    const toggleTerms = () => {
        setAgreedToTerms(p => !p);
        Animated.sequence([
            Animated.timing(checkScale, { toValue: 1.25, duration: 80, useNativeDriver: true }),
            Animated.timing(checkScale, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start();
    };

    const onBtnIn = () => Animated.spring(buttonScale, { toValue: 0.96, friction: 5, useNativeDriver: true }).start();
    const onBtnOut = () => Animated.spring(buttonScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    const handleRegister = async () => {
        if (!name || !email || !password || !contact) { Alert.alert('Error', 'Please fill all fields'); return; }
        if (!agreedToTerms) { Alert.alert('Terms Required', 'Please agree to Terms & Privacy Policy'); return; }
        setIsLoading(true);
        try {
            const res = await authService.register({ name, email, password, contact });
            Alert.alert('Success', 'OTP sent to your email', [{
                text: 'OK',
                onPress: () => router.push({
                    pathname: '/(auth)/otp',
                    params: { name, email, password, contact, activationToken: res.activationToken },
                } as any),
            }]);
        } catch (e: any) { Alert.alert('Registration Failed', e.message); }
        finally { setIsLoading(false); }
    };

    const field = (
        idx: number, label: string, icon: string, ph: string,
        val: string, set: (v: string) => void, key: string,
        opts?: { kb?: any; sec?: boolean; max?: number; pre?: boolean }
    ) => (
        <Animated.View key={key} style={[styles.inputGroup, { opacity: formAnims[idx].opacity, transform: [{ translateY: formAnims[idx].translateY }] }]}>
            <Text allowFontScaling={false} style={styles.label}>
                <Ionicons name={icon as any} size={rf(11)} color="#F38000" />  {label}
            </Text>
            <View style={[styles.inputWrap, focusedField === key && styles.inputActive]}>
                {opts?.pre ? (
                    <>
                        <Text allowFontScaling={false} style={styles.prefix}>+91</Text>
                        <View style={styles.prefixLine} />
                    </>
                ) : null}
                <TextInput
                    allowFontScaling={false} style={styles.input}
                    placeholder={ph} placeholderTextColor="#C8CDD3"
                    keyboardType={opts?.kb || 'default'}
                    autoCapitalize={key === 'email' ? 'none' : key === 'name' ? 'words' : 'none'}
                    autoCorrect={false} secureTextEntry={opts?.sec && !showPassword}
                    value={val} onChangeText={set} maxLength={opts?.max}
                    onFocus={() => setFocusedField(key)} onBlur={() => setFocusedField(null)}
                />
                {opts?.sec ? (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={rf(18)} color="#B0B8C4" />
                    </TouchableOpacity>
                ) : val.length > 1 ? <View style={styles.validDot} /> : null}
            </View>
        </Animated.View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            {/* Top decorative */}
            <View style={[styles.topAccent, { height: insets.top + hp(10) }]}>
                <View style={styles.accentCircle1} />
                <View style={styles.accentCircle2} />
            </View>

            <Animated.ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + hp(5), paddingBottom: insets.bottom + hp(3) }]}
                style={{ flex: 1, opacity: fadeAnim }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back */}
                <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={rf(20)} color="#FFF" />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <Animated.View style={{ transform: [{ translateY: logoFloat }] }}>
                        <Image source={require('../../assets/images/Kairaa4.png')} style={styles.logoImage} resizeMode="contain" />
                    </Animated.View>
                    <View style={styles.titleRow}>
                        <Text allowFontScaling={false} style={styles.title}>Create </Text>
                        <Text allowFontScaling={false} style={styles.titleAccent}>Account</Text>
                    </View>
                    <Animated.View style={[styles.titleUnderline, {
                        width: '25%',
                        transform: [{ scaleX: titleScaleX }]
                    }]} />
                    <Text allowFontScaling={false} style={styles.subtitle}>Join Picknow for exclusive deals</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {field(0, 'Full Name', 'person', 'Pick Now', name, setName, 'name')}
                    {field(1, 'Email', 'mail', 'you@example.com', email, setEmail, 'email', { kb: 'email-address' })}
                    {field(2, 'Phone', 'call', '9876543210', contact, setContact, 'phone', { kb: 'phone-pad', max: 10, pre: true })}
                    {field(3, 'Password', 'lock-closed', 'Min 6 characters', password, setPassword, 'pw', { sec: true })}

                    {/* Terms */}
                    <Animated.View style={[styles.termsRow, { opacity: formAnims[4].opacity, transform: [{ translateY: formAnims[4].translateY }] }]}>
                        <TouchableOpacity onPress={toggleTerms} activeOpacity={0.7}>
                            <Animated.View style={[styles.checkbox, agreedToTerms && styles.checkboxOn, { transform: [{ scale: checkScale }] }]}>
                                {agreedToTerms ? <Ionicons name="checkmark-sharp" size={rf(13)} color="#FFF" /> : null}
                            </Animated.View>
                        </TouchableOpacity>
                        <Text allowFontScaling={false} style={styles.termsText}>
                            I agree to the{' '}
                            <Text style={styles.termsLink} onPress={() => router.push('/terms' as any)}>Terms of Service</Text>
                            {' & '}
                            <Text style={styles.termsLink} onPress={() => router.push('/privacy' as any)}>Privacy Policy</Text>
                        </Text>
                    </Animated.View>

                    {/* Button */}
                    <Animated.View style={{ opacity: formAnims[5].opacity, transform: [{ translateY: formAnims[5].translateY }, { scale: buttonScale }] }}>
                        <TouchableOpacity
                            style={[styles.signUpBtn, isLoading && { opacity: 0.7 }, !agreedToTerms && { opacity: 0.4 }]}
                            onPress={handleRegister} onPressIn={onBtnIn} onPressOut={onBtnOut}
                            disabled={isLoading} activeOpacity={1}
                        >
                            {isLoading ? <ActivityIndicator color="#FFF" /> : (
                                <>
                                    <Text allowFontScaling={false} style={styles.signUpText}>Create Account</Text>
                                    <View style={styles.btnArrow}>
                                        <Ionicons name="arrow-forward" size={rf(16)} color="#F38000" />
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Footer */}
                <Animated.View style={[styles.footer, { opacity: formAnims[6].opacity, transform: [{ translateY: formAnims[6].translateY }] }]}>
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text allowFontScaling={false} style={styles.dividerLabel}>ALREADY A MEMBER?</Text>
                        <View style={styles.dividerLine} />
                    </View>
                    <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
                        <Text allowFontScaling={false} style={styles.loginBtnText}>Sign In Instead</Text>
                        <Ionicons name="chevron-forward" size={rf(14)} color="#F38000" />
                    </TouchableOpacity>
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
        position: 'absolute', top: -hp(3), right: -wp(6),
        width: wp(30), height: wp(30), borderRadius: wp(15),
        backgroundColor: '#FFEDD5', opacity: 0.6,
    },
    accentCircle2: {
        position: 'absolute', top: hp(2), left: -wp(5),
        width: wp(18), height: wp(18), borderRadius: wp(9),
        backgroundColor: '#FED7AA', opacity: 0.3,
    },
    scrollContent: { flexGrow: 1, paddingHorizontal: wp(7), justifyContent: 'center' },
    backBtn: {
        position: 'absolute', top: 0, left: 0, zIndex: 10,
        width: rf(38), height: rf(38), borderRadius: rf(19),
        backgroundColor: 'rgba(243,128,0,0.15)', justifyContent: 'center', alignItems: 'center',
    },
    header: { alignItems: 'center', marginBottom: hp(3) },
    logoImage: { width: wp(38), height: hp(5), marginBottom: hp(1.5) },
    titleRow: { flexDirection: 'row', alignItems: 'baseline' },
    title: { fontSize: rf(26), fontWeight: '300', color: '#1E293B', letterSpacing: -0.3 },
    titleAccent: { fontSize: rf(26), fontWeight: '900', color: '#F38000', letterSpacing: -0.3 },
    titleUnderline: { height: 3, backgroundColor: '#F38000', borderRadius: 2, marginTop: hp(0.5), opacity: 0.7 },
    subtitle: { fontSize: rf(12), color: '#94A3B8', marginTop: hp(0.8), fontWeight: '500', letterSpacing: 0.2 },

    form: { gap: hp(1.8) },
    inputGroup: { gap: hp(0.5) },
    label: { fontSize: rf(11), fontWeight: '700', color: '#475569', marginLeft: wp(0.5) },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        height: hp(5.8),
        borderWidth: 0, borderBottomWidth: 2, borderBottomColor: '#F1F5F9',
        backgroundColor: 'transparent',
        paddingHorizontal: wp(1),
    },
    inputActive: { borderBottomColor: '#F38000' },
    prefix: { fontSize: rf(14), fontWeight: '700', color: '#475569' },
    prefixLine: { width: 1, height: hp(2), backgroundColor: '#E2E8F0', marginHorizontal: wp(2.5) },
    input: { flex: 1, fontSize: rf(14), color: '#1E293B', height: '100%', fontWeight: '500' },
    validDot: { width: rf(8), height: rf(8), borderRadius: rf(4), backgroundColor: '#22C55E' },

    // Terms
    termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: wp(2.5), marginTop: hp(0.3) },
    checkbox: {
        width: rf(22), height: rf(22), borderRadius: rf(7),
        borderWidth: 1.5, borderColor: '#D1D5DB',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#FFF', marginTop: hp(0.1),
    },
    checkboxOn: { backgroundColor: '#F38000', borderColor: '#F38000' },
    termsText: { flex: 1, fontSize: rf(12), color: '#64748B', lineHeight: rf(18), fontWeight: '500' },
    termsLink: { color: '#F38000', fontWeight: '800' },

    // Button
    signUpBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: hp(6), backgroundColor: '#F38000',
        borderRadius: rf(16), gap: wp(3),
        marginTop: hp(0.5),
        shadowColor: '#F38000', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
    },
    signUpText: { color: '#FFF', fontSize: rf(16), fontWeight: '800', letterSpacing: 0.3 },
    btnArrow: {
        width: rf(28), height: rf(28), borderRadius: rf(14),
        backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
    },

    // Footer
    footer: { marginTop: hp(3) },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(1.5) },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#F1F5F9' },
    dividerLabel: { marginHorizontal: wp(2.5), fontSize: rf(9), fontWeight: '800', color: '#CBD5E1', letterSpacing: 2 },
    loginBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: wp(1.5), height: hp(5.2),
        borderRadius: rf(16), borderWidth: 1.5, borderColor: '#FED7AA',
        backgroundColor: '#FFFBF5',
    },
    loginBtnText: { fontSize: rf(14), fontWeight: '700', color: '#F38000' },
});
