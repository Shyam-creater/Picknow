import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { wp, hp, rf } from '@/constants/responsive';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { searchService } from '@/Services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = 'recent_searches_picknow';
const API_URL = 'https://backmern.picknow.in'; // Static IP observed from index.tsx

export default function SearchScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<any[]>([]);
    const inputRef = useRef<TextInput>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fade in animation for the list
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadRecentSearches();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        // Auto-focus the search bar
        const timer = setTimeout(() => inputRef.current?.focus(), 300);
        return () => clearTimeout(timer);
    }, []);

    const loadRecentSearches = async () => {
        try {
            const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) setRecentSearches(JSON.parse(stored));
        } catch (e) {
            console.error('Error loading recent searches:', e);
        }
    };

    const addToRecent = async (item: any) => {
        if (!item) return;

        let newItem: any;
        if (typeof item === 'string') {
            const trimmed = item.trim();
            if (!trimmed) return;
            newItem = { name: trimmed, type: 'query' };
        } else {
            newItem = { ...item, type: item.type || 'product' };
        }

        // Filter out existing matches by name or id
        const filtered = recentSearches.filter(s =>
            (newItem.id && s.id === newItem.id) || (s.name === newItem.name) ? false : true
        );

        const newSearches = [newItem, ...filtered].slice(0, 10);
        setRecentSearches(newSearches);
        try {
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
        } catch (e) {
            console.error('Error saving recent search:', e);
        }
    };

    const clearRecentSearches = async () => {
        setRecentSearches([]);
        await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (text.trim().length < 2) {
            setSuggestions(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await searchService.getSuggestions(text.trim());
                if (res?.success) setSuggestions(res.suggestions);
                else setSuggestions(null);
            } catch {
                setSuggestions(null);
            } finally {
                setLoading(false);
            }
        }, 400);
    }, []);

    const onSelectSuggestion = (type: string, data: any) => {
        if (type === 'product') {
            addToRecent({ ...data, type: 'product' });
            router.push(`/product/${data.id}`);
        } else if (type === 'category') {
            router.push(`/category/${data.name}` as any);
        }
    };

    const FALLBACK_IMAGE = require('../assets/images/Kairaa4.png');

    const getImageUrl = (img: string | any[] | undefined) => {
        if (!img) return FALLBACK_IMAGE;
        const imgStr = Array.isArray(img) ? img[0] : img;
        if (!imgStr) return FALLBACK_IMAGE;
        if (imgStr.startsWith('http')) return { uri: imgStr };
        if (imgStr.startsWith('/')) return { uri: `${API_URL}${imgStr}` };
        if (imgStr.includes('uploads')) return { uri: `${API_URL}/${imgStr}` };
        return { uri: `${API_URL}/images/${imgStr}` };
    };

    const isSearchActive = searchQuery.trim().length >= 2;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Minimal High-End Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <MaterialIcons name="arrow-back" size={rf(26)} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.searchBarContainer}>
                    <MaterialIcons name="search" size={rf(20)} color="#94A3B8" style={styles.searchIcon} />
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Search products, brands..."
                        placeholderTextColor="#94A3B8"
                        allowFontScaling={false}
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        returnKeyType="search"
                        onSubmitEditing={() => {
                            // Only saving on product click, not on text submit
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions(null); }} activeOpacity={0.6}>
                            <Ionicons name="close-circle" size={rf(22)} color="#CBD5E1" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {!isSearchActive ? (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.metaScroll}>
                        {recentSearches.length > 0 && (
                            <View style={styles.recentSection}>
                                <View style={styles.sectionHeader}>
                                    <Text allowFontScaling={false} style={styles.sectionTitle}>Recently Viewed</Text>
                                    <TouchableOpacity onPress={clearRecentSearches} activeOpacity={0.6}>
                                        <Text allowFontScaling={false} style={styles.clearText}>Clear all</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentGridHorizontal}>
                                    {recentSearches.map((item, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={styles.recentItemCard}
                                            onPress={() => {
                                                if (item.type === 'product') {
                                                    router.push(`/product/${item.id}`);
                                                } else if (item.type === 'category') {
                                                    router.push(`/category/${item.name}` as any);
                                                } else {
                                                    setSearchQuery(item.name);
                                                    handleSearchChange(item.name);
                                                }
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <View style={styles.recentImageWrap}>
                                                <Image source={getImageUrl(item.image)} style={styles.recentImage} />
                                            </View>
                                            <Text allowFontScaling={false} style={styles.recentItemName} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            {item.price && (
                                                <Text allowFontScaling={false} style={styles.recentItemPrice}>₹{item.price}</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <View style={styles.emptyPrompt}>
                            <View style={styles.promptIconWrap}>
                                <Ionicons name="sparkles" size={rf(32)} color="#F38000" />
                            </View>
                            <Text allowFontScaling={false} style={styles.promptTitle}>Discover Best Finds</Text>
                            <Text allowFontScaling={false} style={styles.promptSub}>Type above to search through our premium catalog of organic and herbal products.</Text>
                        </View>
                    </ScrollView>
                ) : (
                    <View style={{ flex: 1 }}>
                        {loading && !suggestions && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="#F38000" size="large" />
                                <Text allowFontScaling={false} style={styles.loadingText}>Finding matches...</Text>
                            </View>
                        )}

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultsScroll}>
                            {suggestions ? (
                                <>
                                    {/* Categories */}
                                    {suggestions.categories?.length > 0 && (
                                        <View style={styles.resultsGroup}>
                                            <Text allowFontScaling={false} style={styles.groupHeader}>Categories</Text>
                                            {suggestions.categories.map((c: any, i: number) => (
                                                <TouchableOpacity
                                                    key={i}
                                                    style={styles.row}
                                                    onPress={() => onSelectSuggestion('category', c)}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                                                        <Ionicons name="grid-outline" size={rf(16)} color="#F38000" />
                                                    </View>
                                                    <Text allowFontScaling={false} style={styles.rowText}>{c.name}</Text>
                                                    <Ionicons name="chevron-forward" size={rf(14)} color="#E2E8F0" />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {/* Products */}
                                    {suggestions.products?.length > 0 && (
                                        <View style={styles.resultsGroup}>
                                            <Text allowFontScaling={false} style={styles.groupHeader}>Products</Text>
                                            {suggestions.products.map((p: any, i: number) => {
                                                const img = getImageUrl(p.image);
                                                return (
                                                    <TouchableOpacity
                                                        key={i}
                                                        style={styles.row}
                                                        onPress={() => onSelectSuggestion('product', p)}
                                                        activeOpacity={0.7}
                                                    >
                                                        {img ? (
                                                            <Image source={img} style={styles.rowImg} />
                                                        ) : (
                                                            <View style={styles.rowImgPlaceholder}>
                                                                <Ionicons name="cube-outline" size={rf(18)} color="#CBD5E1" />
                                                            </View>
                                                        )}
                                                        <View style={styles.rowInfo}>
                                                            <Text allowFontScaling={false} style={styles.rowTitle} numberOfLines={1}>{p.name}</Text>

                                                        </View>
                                                        <Ionicons name="chevron-forward" size={rf(14)} color="#E2E8F0" />
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}

                                    {/* Brands */}
                                    {suggestions.brands?.length > 0 && (
                                        <View style={styles.resultsGroup}>
                                            <Text allowFontScaling={false} style={styles.groupHeader}>Brands</Text>
                                            {suggestions.brands.map((b: any, i: number) => (
                                                <TouchableOpacity
                                                    key={i}
                                                    style={styles.row}
                                                    onPress={() => { router.push('/(tabs)/categories' as any); }}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                                                        <Ionicons name="pricetag-outline" size={rf(16)} color="#3B82F6" />
                                                    </View>
                                                    <Text allowFontScaling={false} style={styles.rowText}>{b.name}</Text>
                                                    <Ionicons name="chevron-forward" size={rf(14)} color="#E2E8F0" />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {(!suggestions.products?.length && !suggestions.categories?.length && !suggestions.brands?.length) && (
                                        <View style={styles.noResultsBox}>
                                            <View style={styles.noResultsIcon}>
                                                <Ionicons name="search-outline" size={rf(40)} color="#CBD5E1" />
                                            </View>
                                            <Text allowFontScaling={false} style={styles.noResultsTitle}>{`No results for "${searchQuery}"`}</Text>
                                            <Text allowFontScaling={false} style={styles.noResultsSub}>Check your spelling or try more general terms.</Text>
                                        </View>
                                    )}
                                </>
                            ) : !loading && (
                                <View style={styles.noResultsBox}>
                                    <Ionicons name="search-outline" size={rf(40)} color="#E2E8F0" />
                                    <Text allowFontScaling={false} style={styles.noResultsTitle}>Search results</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingBottom: hp(2),
        paddingTop: hp(1),
        backgroundColor: '#FFF',
    },
    backBtn: {
        width: wp(11),
        height: wp(11),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(1.5),
    },
    searchBarContainer: {
        flex: 1,
        height: hp(7),
        backgroundColor: '#FFFFFF',
        borderRadius: wp(7),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        borderWidth: 1,
        borderColor: '#EAEBEE',
        shadowColor: '#12122A',
        shadowOffset: { width: 0, height: hp(1) },
        shadowOpacity: 0.05,
        shadowRadius: wp(4),
        elevation: 8,
    },
    searchIcon: {
        marginRight: wp(2.5),
    },
    input: {
        flex: 1,
        fontSize: rf(15),
        fontWeight: '600',
        color: '#1E293B',
        letterSpacing: 0.2,
    },
    content: {
        flex: 1,
    },
    metaScroll: {
        paddingBottom: hp(5),
    },
    recentSection: {
        paddingTop: hp(3),
        paddingHorizontal: wp(5),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    sectionTitle: {
        fontSize: rf(15),
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -0.3,
    },
    clearText: {
        fontSize: rf(12),
        fontWeight: '800',
        color: '#F38000',
    },
    recentGridHorizontal: {
        paddingRight: wp(5),
        gap: wp(4),
    },
    recentItemCard: {
        width: wp(25),
        gap: hp(1),
        alignItems: 'center',
    },
    recentImageWrap: {
        width: wp(25),
        height: wp(25),
        borderRadius: wp(12.5),
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        // Subtle glow for the circle
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: hp(0.5) },
        shadowOpacity: 0.05,
        shadowRadius: wp(2),
    },
    recentImage: {
        width: '100%',
        height: '100%',
    },
    recentItemName: {
        fontSize: rf(12),
        fontWeight: '700',
        color: '#334155',
        lineHeight: rf(16),
        textAlign: 'center',
    },
    recentItemPrice: {
        fontSize: rf(12),
        fontWeight: '800',
        color: '#F38000',
        textAlign: 'center',
    },
    emptyPrompt: {
        marginTop: hp(10),
        alignItems: 'center',
        paddingHorizontal: wp(12.5),
    },
    promptIconWrap: {
        width: wp(18),
        height: wp(18),
        borderRadius: wp(9),
        backgroundColor: '#FFF7ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(3),
    },
    promptTitle: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: hp(1.2),
        textAlign: 'center',
    },
    promptSub: {
        fontSize: rf(14),
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: rf(22),
        fontWeight: '500',
    },
    loadingContainer: {
        paddingTop: hp(5),
        alignItems: 'center',
    },
    loadingText: {
        marginTop: hp(1.5),
        fontSize: rf(14),
        color: '#64748B',
        fontWeight: '600',
    },
    resultsScroll: {
        paddingBottom: hp(5),
    },
    resultsGroup: {
        paddingTop: hp(3),
    },
    groupHeader: {
        fontSize: rf(10),
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2,
        textTransform: 'uppercase',
        paddingHorizontal: wp(5),
        marginBottom: hp(1.7),
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(1.7),
        paddingHorizontal: wp(5),
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    iconBox: {
        width: wp(9.5),
        height: wp(9.5),
        borderRadius: wp(3),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(4),
    },
    rowImg: {
        width: wp(11),
        height: wp(11),
        borderRadius: wp(3),
        marginRight: wp(4),
        backgroundColor: '#F8FAFC',
    },
    rowImgPlaceholder: {
        width: wp(11),
        height: wp(11),
        borderRadius: wp(3),
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(4),
    },
    rowInfo: {
        flex: 1,
    },
    rowTitle: {
        fontSize: rf(16),
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: -0.2,
    },
    rowMeta: {
        fontSize: rf(13),
        color: '#F38000',
        fontWeight: '800',
        marginTop: hp(0.2),
    },
    rowText: {
        flex: 1,
        fontSize: rf(16),
        fontWeight: '700',
        color: '#1E293B',
    },
    noResultsBox: {
        marginTop: hp(10),
        alignItems: 'center',
        paddingHorizontal: wp(12.5),
    },
    noResultsIcon: {
        width: wp(16),
        height: wp(16),
        borderRadius: wp(8),
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(2.5),
    },
    noResultsTitle: {
        fontSize: rf(18),
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: hp(1),
    },
    noResultsSub: {
        fontSize: rf(14),
        color: '#94A3B8',
        textAlign: 'center',
        fontWeight: '500',
    },
});
