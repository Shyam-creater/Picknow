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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authService } from '@/Services/api';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, rf } from '@/constants/responsive';

export default function OtpScreen() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        name: string;
        email: string;
        password: string;
        contact: string;
        activationToken: string;
    }>();

    const email = params.email;
    const [activationToken, setActivationToken] = useState(params.activationToken);

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [isResending, setIsResending] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerTranslateY = useRef(new Animated.Value(40)).current;

    // Staggered animations for form parts
    const formOpacities = useRef([
        new Animated.Value(0), // OTP Input
        new Animated.Value(0), // Button
        new Animated.Value(0), // Resend
    ]).current;

    const formTranslates = useRef([
        new Animated.Value(20),
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

        // 2. Form items stagger in after a slight delay - faster
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

    // Timer logic
    useEffect(() => {
        let interval: any;

        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            await authService.verifyOtp(otp, activationToken as string);

            Alert.alert('Success', 'User verification successful', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') },
            ]);
        } catch (error: any) {
            Alert.alert('Verification Failed', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const handleResend = async () => {
        setIsResending(true);
        try {
            const response = await authService.resendOtp(email as string);
            setActivationToken(response.activationToken);
            setTimer(60);
            Alert.alert('Success', 'New OTP sent to your email');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsResending(false);
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
                    <Text allowFontScaling={false} style={styles.title}>Verify Email</Text>
                    <Text allowFontScaling={false} style={styles.subtitle}>Enter the 6-digit code sent to</Text>
                    <Text allowFontScaling={false} style={styles.emailText}>{email}</Text>
                </Animated.View>

                <View style={styles.form}>
                    <Animated.View style={[
                        { opacity: formOpacities[0], transform: [{ translateY: formTranslates[0] }] }
                    ]}>
                        <TextInput
                            allowFontScaling={false}
                            style={styles.otpInput}
                            placeholder="000000"
                            placeholderTextColor="#CCC"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otp}
                            onChangeText={setOtp}
                            textAlign="center"
                        />
                    </Animated.View>

                    <Animated.View style={{ opacity: formOpacities[1], transform: [{ translateY: formTranslates[1] }] }}>
                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleVerify}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text allowFontScaling={false} style={styles.buttonText}>Verify OTP</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={[styles.resendContainer, { opacity: formOpacities[2], transform: [{ translateY: formTranslates[2] }] }]}>
                        {timer > 0 ? (
                            <Text allowFontScaling={false} style={styles.timerText}>
                                Resend code in {timer}s
                            </Text>
                        ) : (
                            <TouchableOpacity
                                onPress={handleResend}
                                disabled={isResending}
                            >
                                {isResending ? (
                                    <ActivityIndicator size="small" color="#F38000" />
                                ) : (
                                    <Text allowFontScaling={false} style={styles.resendLink}>
                                        Resend OTP
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}
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
        justifyContent: 'center',
    },
    header: {
        marginBottom: hp(5),
        alignItems: 'center',
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
        marginTop: hp(1),
        textAlign: 'center',
        fontWeight: '500',
    },
    emailText: {
        fontSize: rf(16),
        fontWeight: '700',
        color: '#F38000',
        marginTop: hp(0.5),
        textAlign: 'center',
    },
    form: {
        gap: hp(3),
    },
    otpInput: {
        height: hp(8.5),
        borderWidth: 1.5,
        borderColor: '#EEEEEE',
        borderRadius: wp(4),
        fontSize: rf(32),
        fontWeight: 'bold',
        backgroundColor: '#FAFAFA',
        letterSpacing: wp(3),
        color: '#000',
    },
    button: {
        height: hp(7.2),
        backgroundColor: '#F38000',
        borderRadius: wp(4),
        justifyContent: 'center',
        alignItems: 'center',
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
    resendContainer: {
        alignItems: 'center',
        marginTop: hp(1),
    },
    timerText: {
        color: '#666666',
        fontSize: rf(15),
        fontWeight: '500',
    },
    resendLink: {
        color: '#F38000',
        fontSize: rf(15),
        fontWeight: 'bold',
    },
});
