import React, { useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    View,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { wp, hp, rf } from '@/constants/responsive';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/Services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '@/components/CustomHeader';

export default function ChangePasswordScreen() {
    const { token } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async () => {
        if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword({
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            }, token!);

            Alert.alert('Success', 'Password updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <CustomHeader title="Change Password" showBack />

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(5) }]}>
                <View style={styles.infoBox}>
                    <IconSymbol name="lock.fill" size={rf(24)} color="#FF9500" />
                    <ThemedText allowFontScaling={false} style={styles.infoText}>
                        Password must be at least 6 characters long and include numbers or symbols for better security.
                    </ThemedText>
                </View>

                <PasswordInput
                    label="Current Password"
                    value={formData.oldPassword}
                    onChangeText={(v: string) => setFormData({ ...formData, oldPassword: v })}
                    showPassword={showOldPassword}
                    setShowPassword={setShowOldPassword}
                    placeholder="Enter current password"
                />

                <PasswordInput
                    label="New Password"
                    value={formData.newPassword}
                    onChangeText={(v: string) => setFormData({ ...formData, newPassword: v })}
                    showPassword={showNewPassword}
                    setShowPassword={setShowNewPassword}
                    placeholder="Enter new password"
                />

                <PasswordInput
                    label="Confirm New Password"
                    value={formData.confirmPassword}
                    onChangeText={(v: string) => setFormData({ ...formData, confirmPassword: v })}
                    showPassword={showConfirmPassword}
                    setShowPassword={setShowConfirmPassword}
                    placeholder="Repeat new password"
                />

                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.disabledButton]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <ThemedText allowFontScaling={false} style={styles.saveButtonText}>Update Password</ThemedText>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const PasswordInput = ({ label, value, onChangeText, showPassword, setShowPassword, placeholder }: any) => (
    <View style={styles.inputGroup}>
        <ThemedText allowFontScaling={false} style={styles.label}>{label}</ThemedText>
        <View style={styles.inputWrapper}>
            <TextInput
                allowFontScaling={false}
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={!showPassword}
                placeholderTextColor="#C7C7CC"
            />
            <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
            >
                <IconSymbol
                    name={showPassword ? "eye.fill" : "eye.slash.fill"}
                    size={rf(20)}
                    color="#8E8E93"
                />
            </TouchableOpacity>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingBottom: hp(1.5),
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    headerTitle: { fontSize: rf(18), fontWeight: '700' },
    backButton: { padding: wp(2), marginLeft: -wp(2) },
    scrollContent: { padding: wp(6) },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF9F2',
        padding: wp(4),
        borderRadius: wp(3),
        marginBottom: hp(3),
        alignItems: 'center',
    },
    infoText: { flex: 1, marginLeft: wp(3), fontSize: rf(13), color: '#8A6E3F', lineHeight: rf(18) },
    inputGroup: { marginBottom: hp(2.5) },
    label: { fontSize: rf(14), fontWeight: '600', marginBottom: hp(1), color: '#1C1C1E' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: wp(3),
        paddingHorizontal: wp(3.5),
    },
    input: {
        flex: 1,
        paddingVertical: hp(1.8),
        fontSize: rf(15),
        color: '#000',
    },
    eyeIcon: { padding: wp(2) },
    saveButton: {
        backgroundColor: '#E31C25',
        padding: wp(4),
        borderRadius: wp(3.5),
        alignItems: 'center',
        marginTop: hp(1.5),
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.3,
        shadowRadius: wp(2),
        elevation: 4,
    },
    disabledButton: { opacity: 0.6 },
    saveButtonText: { color: '#FFF', fontSize: rf(16), fontWeight: '700' },
});
