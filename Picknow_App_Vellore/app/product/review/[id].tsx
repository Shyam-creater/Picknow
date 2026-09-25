import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    Image,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/Services/api';
import * as ImagePicker from 'expo-image-picker';

export default function ReviewScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user, token } = useAuth();

    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [mediaItems, setMediaItems] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
    const [isEligible, setIsEligible] = useState(false);

    React.useEffect(() => {
        checkEligibility();
    }, [id, token]);

    const checkEligibility = async () => {
        if (!token) {
            setIsCheckingEligibility(false);
            return;
        }
        try {
            const res = await productService.checkReviewEligibility(id as string, token);
            setIsEligible(res.canreview);
            if (!res.canreview) {
                Alert.alert("Verified Purchase Required", res.message || "You can only review products after they have been delivered to you.");
                router.back();
            }
        } catch (error) {
            console.error("Error checking eligibility:", error);
            router.back();
        } finally {
            setIsCheckingEligibility(false);
        }
    };

    const pickMedia = async () => {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload media.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
        });

        if (!result.canceled) {
            setMediaItems([...mediaItems, ...result.assets]);
        }
    };

    const removeMedia = (index: number) => {
        const newItems = [...mediaItems];
        newItems.splice(index, 1);
        setMediaItems(newItems);
    };

    const submitReview = async () => {
        if (!token) {
            Alert.alert("Login Required", "Please login to write a review.");
            router.push('/(auth)/login');
            return;
        }

        if (!reviewText.trim()) {
            Alert.alert("Oops!", "Please write a comment before submitting.");
            return;
        }

        try {
            setIsSubmitting(true);

            // Build FormData
            const formData = new FormData();
            formData.append('rating', rating.toString());
            formData.append('review', reviewText);

            // Append each media item under pImage key as expected by multer uploadFiles helper
            mediaItems.forEach((media, index) => {
                const name = media.fileName || `media_${index}.jpg`;
                const type = media.type === 'video' ? 'video/mp4' : 'image/jpeg';
                // @ts-ignore
                formData.append('pImage', {
                    uri: media.uri,
                    name: name,
                    type: type,
                });
            });

            const res = await productService.addReviewForm(id as string, token, formData);

            if (res.success) {
                Alert.alert("Review Submitted", "Thank you for your feedback!", [
                    {
                        text: "OK",
                        onPress: () => router.back()
                    }
                ]);
            } else {
                Alert.alert("Error", res.message || "Failed to submit review.");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to submit review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCheckingEligibility) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F38000" />
                <Text style={styles.loadingText}>Checking verified purchase status...</Text>
            </View>
        );
    }

    if (!isEligible && !isCheckingEligibility) {
        return null; // Will show Alert and go back anyway
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={rf(24)} color="#000" />
                </TouchableOpacity>
                <Text allowFontScaling={false} style={styles.headerTitle}>Write a Review</Text>
                <View style={{ width: wp(11) }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                        <Text allowFontScaling={false} style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                    </View>
                    <Text allowFontScaling={false} style={styles.userName}>{user?.name || 'Guest User'}</Text>
                </View>

                <View style={styles.ratingSection}>
                    <Text allowFontScaling={false} style={styles.sectionTitle}>Tap to Rate Product</Text>
                    <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Ionicons
                                    name={star <= rating ? "star" : "star-outline"}
                                    size={rf(40)}
                                    color="#F38000"
                                    style={styles.star}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputSection}>
                    <Text allowFontScaling={false} style={styles.sectionTitle}>Add Feedback</Text>
                    <TextInput
                        allowFontScaling={false}
                        style={styles.textInput}
                        placeholder="Share your experience working with this product, any photos you have..."
                        placeholderTextColor="#999"
                        multiline
                        textAlignVertical="top"
                        value={reviewText}
                        onChangeText={setReviewText}
                    />
                </View>

                <View style={styles.mediaSection}>
                    <Text allowFontScaling={false} style={styles.sectionTitle}>Attach Media (Optional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
                        <TouchableOpacity style={styles.addMediaButton} onPress={pickMedia}>
                            <Ionicons name="camera" size={rf(30)} color="#888" />
                            <Text allowFontScaling={false} style={styles.addMediaText}>Add Photos/Videos</Text>
                        </TouchableOpacity>

                        {mediaItems.map((item, index) => (
                            <View key={index} style={styles.mediaPreviewContainer}>
                                <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
                                <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(index)}>
                                    <Ionicons name="close-circle" size={rf(24)} color="#FF3B30" />
                                </TouchableOpacity>
                                {item.type === 'video' && (
                                    <View style={styles.videoIndicator}>
                                        <Ionicons name="play" size={rf(16)} color="#FFF" />
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    disabled={isSubmitting}
                    onPress={submitReview}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text allowFontScaling={false} style={styles.submitButtonText}>Submit Review</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    loadingText: {
        marginTop: hp(2),
        fontSize: rf(14),
        color: '#666',
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.8),
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    iconButton: {
        width: wp(11),
        height: wp(11),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: wp(5.5),
        backgroundColor: '#FAFAFA',
    },
    headerTitle: {
        fontSize: rf(18),
        fontWeight: '800',
        color: '#111',
    },
    content: {
        padding: wp(5),
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(3.5),
    },
    avatar: {
        width: wp(12),
        height: wp(12),
        borderRadius: wp(6),
        backgroundColor: '#FFF5EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    avatarText: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#F38000',
    },
    userName: {
        fontSize: rf(18),
        fontWeight: '800',
        color: '#111',
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: hp(3.5),
        backgroundColor: '#FAFAFA',
        padding: wp(5),
        borderRadius: wp(5),
    },
    sectionTitle: {
        fontSize: rf(16),
        fontWeight: '800',
        color: '#111',
        marginBottom: hp(1.5),
        alignSelf: 'flex-start',
    },
    starRow: {
        flexDirection: 'row',
        gap: wp(2),
        marginTop: hp(1.2),
    },
    star: {
        marginHorizontal: wp(1),
    },
    inputSection: {
        marginBottom: hp(3.5),
    },
    textInput: {
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#EFEFEF',
        borderRadius: wp(4),
        padding: wp(4),
        height: hp(18),
        fontSize: rf(16),
        color: '#333',
    },
    mediaSection: {
        marginBottom: hp(3.5),
    },
    mediaScroll: {
        flexDirection: 'row',
        marginTop: hp(1),
    },
    addMediaButton: {
        width: wp(25),
        height: wp(25),
        borderWidth: 2,
        borderColor: '#EEEEEE',
        borderStyle: 'dashed',
        borderRadius: wp(4),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        marginRight: wp(3),
    },
    addMediaText: {
        fontSize: rf(11),
        color: '#888',
        fontWeight: '600',
        marginTop: hp(0.7),
        textAlign: 'center',
    },
    mediaPreviewContainer: {
        width: wp(25),
        height: wp(25),
        marginRight: wp(3),
        borderRadius: wp(4),
        overflow: 'hidden',
        position: 'relative',
    },
    mediaPreview: {
        width: '100%',
        height: '100%',
    },
    removeMediaBtn: {
        position: 'absolute',
        top: wp(1),
        right: wp(1),
        backgroundColor: '#FFF',
        borderRadius: wp(3),
    },
    videoIndicator: {
        position: 'absolute',
        bottom: wp(1),
        left: wp(1),
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: wp(1),
        borderRadius: wp(2),
    },
    bottomBar: {
        padding: wp(5),
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: '#FFF',
    },
    submitButton: {
        backgroundColor: '#F38000',
        paddingVertical: hp(2.2),
        borderRadius: wp(5),
        alignItems: 'center',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.3,
        shadowRadius: wp(2),
        elevation: 5,
    },
    submitButtonDisabled: {
        backgroundColor: '#E0E0E0',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: rf(16),
        fontWeight: '800',
    },
});
