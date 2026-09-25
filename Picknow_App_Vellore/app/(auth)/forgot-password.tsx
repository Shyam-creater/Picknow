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
    Easing
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '@/Services/api';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, rf } from '@/constants/responsive';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerTranslateY = useRef(new Animated.Value(40)).current;

    // Staggered animations for form parts
    const formOpacities = useRef([
        new Animated.Value(0), // Email
        new Animated.Value(0), // Button
    ]).current;

    const formTranslates = useRef([
        new Animated.Value(20),
        new Animated.Value(20),
    ]).current;

    useEffect(() => {
        // 1. Header fades and slides up - faster
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(headerTranslateY, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // 2. Form items stagger in after a slight delay - much faster
        Animated.stagger(60, formOpacities.map((anim, i) =>
            Animated.parallel([
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 300,
                    delay: 100,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(formTranslates[i], {
                    toValue: 0,
                    duration: 300,
                    delay: 100,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                })
            ])
        )).start();
    }, []);

    const handleSendCode = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setIsLoading(true);
        try {
            await authService.forgotPassword(email);
            Alert.alert('Success', 'Reset code sent to your email');
            router.push({
                pathname: '/(auth)/reset-password',
                params: { email }
            } as any);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                style={{ flex: 1, opacity: fadeAnim }}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={rf(24)} color="#000" />
                </TouchableOpacity>

                <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
                    <Image
                        source={require('../../assets/images/Kairaa4.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text allowFontScaling={false} style={styles.title}>Forgot Password</Text>
                    <Text allowFontScaling={false} style={styles.subtitle}>
                        Enter your email address and we'll send you a code to reset your password.
                    </Text>
                </Animated.View>

                <View style={styles.form}>
                    <Animated.View style={[
                        styles.inputGroup,
                        { opacity: formOpacities[0], transform: [{ translateY: formTranslates[0] }] }
                    ]}>
                        <Text allowFontScaling={false} style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={rf(20)} color="#666" style={styles.inputIcon} />
                            <TextInput
                                allowFontScaling={false}
                                style={styles.input}
                                placeholder="Picknow@mail.com"
                                placeholderTextColor="#999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </Animated.View>

                    <Animated.View style={{ opacity: formOpacities[1], transform: [{ translateY: formTranslates[1] }] }}>
                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleSendCode}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text allowFontScaling={false} style={styles.buttonText}>Send Reset Code</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Animated.ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        padding: wp(6),
        paddingTop: hp(8),
    },
    backButton: {
        width: wp(11),
        height: wp(11),
        borderRadius: wp(5.5),
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(2.5),
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    header: {
        marginBottom: hp(5),
        alignItems: 'center',
    },
    logoImage: {
        width: wp(65),
        height: hp(10),
        marginBottom: hp(3),
    },
    title: {
        fontSize: rf(28),
        fontWeight: '800',
        color: '#000000',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: rf(15),
        color: '#666666',
        marginTop: hp(1.5),
        lineHeight: rf(22),
        textAlign: 'center',
        fontWeight: '500',
    },
    form: {
        gap: hp(3),
    },
    inputGroup: {
        gap: hp(1),
    },
    label: {
        fontSize: rf(14),
        fontWeight: '700',
        color: '#000000',
        marginLeft: wp(1),
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: hp(7),
        borderWidth: 1.5,
        borderColor: '#EEEEEE',
        borderRadius: wp(3.5),
        backgroundColor: '#FAFAFA',
        paddingHorizontal: wp(4),
    },
    inputIcon: {
        marginRight: wp(3),
    },
    input: {
        flex: 1,
        fontSize: rf(16),
        color: '#000000',
        height: '100%',
    },
    button: {
        height: hp(7.2),
        backgroundColor: '#F38000',
        borderRadius: wp(4),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(1),
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: hp(0.7) },
        shadowOpacity: 0.35,
        shadowRadius: wp(2.5),
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#000000',
        fontSize: rf(18),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
