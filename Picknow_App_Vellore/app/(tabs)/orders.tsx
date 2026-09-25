
import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    LayoutAnimation,
    Platform,
    UIManager,
    Dimensions,
    Modal,
    TextInput,
    Alert
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { generateInvoiceHtml } from '@/Services/invoiceService';
import { wp, hp, rf } from '@/constants/responsive';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/Services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '@/components/CustomHeader';
import PremiumLoader from '@/components/PremiumLoader';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const API_URL = 'https://backmern.picknow.in';
const getImageUrl = (img: string | undefined | null) => {
    if (!img) return 'https://via.placeholder.com/150';
    if (img.startsWith('http')) return img;
    if (img.startsWith('/')) return `${API_URL}${img}`;
    return `${API_URL}/images/${img}`;
};

interface OrderItem {
    product: {
        _id: string;
        pName: string;
        pImage: string[];
        pPrice: number;
        pReturn: boolean;
        pReturnDays: number;
    } | string;
    quantity: number;
    price: number;
    variant?: string;
}

interface ShippingAddress {
    name: string;
    address: string;
    contact: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
}

interface Order {
    _id: string;
    orderStatus: string;
    paymentStatus: string;
    paymentMethod: string;
    finalAmount: number;
    totalAmount: number;
    shippingCharges: number;
    platformFee: number;
    createdAt: string;
    items: OrderItem[];
    returnedItems?: any[];
    shippingAddress: ShippingAddress;
    PaymentId: string;
    updatedAt: string;
}

const ORDER_STATUS_STEPS = [
    { id: 'ORDER PLACED', label: 'Placed', icon: 'time-outline' },
    { id: 'CONFIRMED', label: 'Confirmed', icon: 'checkmark-circle-outline' },
    { id: 'SHIPPED', label: 'Shipped', icon: 'cube-outline' },
    { id: 'DISPATCHED', label: 'Dispatch', icon: 'car-outline' },
    { id: 'DELIVERED', label: 'Delivered', icon: 'home-outline' },
];

const OrdersScreen = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
    const [returnReason, setReturnReason] = useState('');
    const [selectedItemForReturn, setSelectedItemForReturn] = useState<{ orderId: string, productId: string, variantId?: string } | null>(null);
    const [submittingReturn, setSubmittingReturn] = useState(false);
    const { token } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const fetchOrders = async () => {
        try {
            if (!token) return;
            const response = await authService.getUserOrders(token);
            if (response.success) {
                setOrders(response.orders || []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        try {
            if (!token) return;
            const response = await authService.cancelOrder(orderId, token);
            if (response.success) {
                Alert.alert('Success', 'Order cancelled successfully');
                fetchOrders();
            } else {
                Alert.alert('Error', response.message || 'Failed to cancel order');
            }
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            Alert.alert('Error', error.message || 'Error occurred while cancelling order');
        }
    };

    const handleReturnItem = async () => {
        if (!selectedItemForReturn || !token) return;
        if (!returnReason.trim()) {
            Alert.alert('Error', 'Please provide a reason for return');
            return;
        }

        setSubmittingReturn(true);
        try {
            const response = await authService.returnOrderItem(
                selectedItemForReturn.orderId,
                {
                    productId: selectedItemForReturn.productId,
                    variantId: selectedItemForReturn.variantId,
                    reason: returnReason
                },
                token
            );

            if (response.success) {
                Alert.alert('Success', 'Return request submitted successfully');
                setIsReturnModalVisible(false);
                setReturnReason('');
                setSelectedItemForReturn(null);
                fetchOrders(); // Refresh orders to show updated status
            } else {
                Alert.alert('Error', response.message || 'Failed to submit return request');
            }
        } catch (error: any) {
            console.error('Error submitting return:', error);
            Alert.alert('Error', error.message || 'Error occurred while submitting return request');
        } finally {
            setSubmittingReturn(false);
        }
    };

    const handleDownloadInvoice = async (order: Order) => {
        try {
            if (!token) return;

            Alert.alert('Invoice', 'Generating your invoice receipt...');

            // Generate HTML
            const html = generateInvoiceHtml(order);

            // Generate PDF file
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false
            });

            if (uri) {
                // Rename file for better user experience
                const filename = `Invoice_${order._id.slice(-8).toUpperCase()}.pdf`;
                const newUri = `${FileSystem.documentDirectory}${filename}`;

                await FileSystem.moveAsync({
                    from: uri,
                    to: newUri
                });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(newUri);
                } else {
                    Alert.alert('Success', 'Invoice generated successfully.');
                }
            }
        } catch (error) {
            console.error('Invoice generation error:', error);
            Alert.alert('Error', 'An error occurred while generating the invoice.');
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedOrderId(expandedOrderId === id ? null : id);
    };

    const getStatusIndex = (status: string) => {
        const index = ORDER_STATUS_STEPS.findIndex(step => step.id === status);
        return index === -1 ? 0 : index;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return '#10B981'; // Premium Green
            case 'CANCELLED': return '#EF4444'; // Red
            case 'SHIPPED':
            case 'DISPATCHED': return '#3B82F6'; // Blue
            case 'ORDER PLACED':
            case 'CONFIRMED': return '#F38000'; // Brand Orange
            default: return '#6B7280'; // Gray
        }
    };

    const renderTracker = (currentStatus: string) => {
        const currentIndex = getStatusIndex(currentStatus);
        const isCancelled = currentStatus === 'CANCELLED';

        if (isCancelled) {
            return (
                <View style={[styles.cancelledStatus, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="close-circle" size={rf(24)} color="#EF4444" />
                    <Text allowFontScaling={false} style={styles.cancelledText}>Order Cancelled</Text>
                </View>
            );
        }

        return (
            <View style={styles.trackerContainer}>
                {ORDER_STATUS_STEPS.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isLast = index === ORDER_STATUS_STEPS.length - 1;
                    const color = isCompleted ? '#F38000' : '#E5E7EB';
                    const iconColor = isCompleted ? '#FFFFFF' : '#9CA3AF';

                    return (
                        <React.Fragment key={step.id}>
                            <View style={styles.stepItem}>
                                <View style={[styles.stepCircle, { backgroundColor: color }]}>
                                    <Ionicons name={step.icon as any} size={rf(14)} color={iconColor} />
                                </View>
                                <Text allowFontScaling={false} style={[styles.stepLabel, { color: isCompleted ? '#1F2937' : '#9CA3AF' }]}>
                                    {step.label}
                                </Text>
                            </View>
                            {!isLast && (
                                <View style={[styles.stepLine, { backgroundColor: index < currentIndex ? '#F38000' : '#E5E7EB' }]} />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>
        );
    };

    const renderOrderItem = ({ item }: { item: Order }) => {
        const isExpanded = expandedOrderId === item._id;
        const statusColor = getStatusColor(item.orderStatus);

        return (
            <View style={styles.orderCard}>
                <TouchableOpacity
                    style={styles.orderHeader}
                    onPress={() => toggleExpand(item._id)}
                    activeOpacity={0.8}
                >
                    <View style={styles.headerTop}>
                        <View style={styles.headerTitleWrap}>
                            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                            <Text allowFontScaling={false} style={styles.orderId}>Order #{item._id.slice(-8).toUpperCase()}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                            <Text allowFontScaling={false} style={[styles.statusText, { color: statusColor }]}>{item.orderStatus}</Text>
                        </View>
                    </View>

                    <Text allowFontScaling={false} style={styles.orderDate}>
                        {new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </Text>

                    <View style={styles.quickItems}>
                        <View style={styles.imageStackGallery}>
                            {item.items.slice(0, 3).map((oi, idx) => {
                                const isProductObject = typeof oi.product === 'object' && oi.product !== null;
                                const rawImage = isProductObject ? (oi.product as any).pImage?.[0] : null;
                                const productImage = getImageUrl(rawImage);

                                return (
                                    <View key={idx} style={[styles.miniImageWrap, { zIndex: 3 - idx, right: idx * wp(-3.7) }]}>
                                        <Image source={{ uri: productImage }} style={styles.miniImage} />
                                    </View>
                                );
                            })}
                            {item.items.length > 3 && (
                                <View style={[styles.moreCount, { right: 3 * wp(-3.7) }]}>
                                    <Text allowFontScaling={false} style={styles.moreCountText}>+{item.items.length - 3}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.totalBlock}>
                            <Text allowFontScaling={false} style={styles.totalLabel}>Total</Text>
                            <Text allowFontScaling={false} style={styles.totalValue}>₹{item.finalAmount?.toLocaleString('en-IN')}</Text>
                        </View>

                        <View style={[styles.chevronWrap, isExpanded && styles.chevronExpanded]}>
                            <Ionicons name="chevron-down" size={rf(18)} color="#9CA3AF" />
                        </View>
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <View style={styles.divider} />

                        {/* Tracking Progress */}
                        <Text allowFontScaling={false} style={styles.sectionTitle}>Order Status</Text>
                        {renderTracker(item.orderStatus)}

                        <View style={styles.divider} />

                        {/* Items Loop */}
                        <Text allowFontScaling={false} style={styles.sectionTitle}>Items ({item.items.length})</Text>
                        {item.items.map((oi, idx) => {
                            const isProductObject = typeof oi.product === 'object' && oi.product !== null;
                            const productName = isProductObject ? (oi.product as any).pName : `Unknown Product`;
                            const rawImage = isProductObject ? (oi.product as any).pImage?.[0] : null;
                            const productImage = getImageUrl(rawImage);

                            const isReturned = item.returnedItems?.some((ri: any) =>
                                ri.product === (isProductObject ? (oi.product as any)._id : oi.product) ||
                                (oi.variant && ri.variant === oi.variant)
                            );

                            return (
                                <View key={idx} style={styles.detailedItemRow}>
                                    <Image source={{ uri: productImage }} style={styles.detailedItemImage} />
                                    <View style={styles.detailedItemInfo}>
                                        <Text allowFontScaling={false} style={styles.detailedItemName} numberOfLines={2}>{productName}</Text>
                                        <Text allowFontScaling={false} style={styles.detailedItemSub}>Qty: {oi.quantity}  ×  ₹{oi.price?.toLocaleString('en-IN')}</Text>
                                        {isReturned && (
                                            <View style={styles.returnBadge}>
                                                <Ionicons name="refresh-circle" size={rf(12)} color="#F38000" />
                                                <Text allowFontScaling={false} style={styles.returnBadgeText}>Return Requested</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text allowFontScaling={false} style={styles.detailedItemTotal}>₹{(oi.price * oi.quantity).toLocaleString('en-IN')}</Text>
                                </View>
                            );
                        })}

                        {/* Summary Block */}
                        <View style={styles.summaryBlock}>
                            <View style={styles.infoCol}>
                                <View style={styles.infoBox}>
                                    <Text allowFontScaling={false} style={styles.infoLabel}>Delivery Address</Text>
                                    <Text allowFontScaling={false} style={styles.infoTitle}>{item.shippingAddress?.name || 'Customer'}</Text>
                                    <Text allowFontScaling={false} style={styles.infoDesc} numberOfLines={2}>
                                        {item.shippingAddress?.address || 'N/A'}, {item.shippingAddress?.city || ''} - {item.shippingAddress?.pincode || ''}
                                    </Text>
                                    <Text allowFontScaling={false} style={styles.infoDesc}>Phone: {item.shippingAddress?.contact || 'N/A'}</Text>
                                </View>

                                <View style={[styles.infoBox, { marginTop: hp(1.9) }]}>
                                    <Text allowFontScaling={false} style={styles.infoLabel}>Payment Details</Text>
                                    <Text allowFontScaling={false} style={styles.infoTitle}>{item.paymentMethod}</Text>
                                    <Text allowFontScaling={false} style={[styles.infoDesc, { textTransform: 'capitalize' }]}>Status: {item.paymentStatus}</Text>
                                    {item.PaymentId && <Text allowFontScaling={false} style={styles.infoDesc}>Txn ID: {item.PaymentId}</Text>}
                                </View>
                            </View>

                            <View style={styles.priceBreakdown}>
                                <View style={styles.priceRow}>
                                    <Text allowFontScaling={false} style={styles.pbLabel}>Subtotal</Text>
                                    <Text allowFontScaling={false} style={styles.pbValue}>₹{(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text allowFontScaling={false} style={styles.pbLabel}>Shipping</Text>
                                    <Text allowFontScaling={false} style={styles.pbValue}>₹{(item.shippingCharges || 0).toLocaleString('en-IN')}</Text>
                                </View>
                                {item.platformFee > 0 && (
                                    <View style={styles.priceRow}>
                                        <Text allowFontScaling={false} style={styles.pbLabel}>Platform Fee</Text>
                                        <Text allowFontScaling={false} style={styles.pbValue}>₹{(item.platformFee || 0).toLocaleString('en-IN')}</Text>
                                    </View>
                                )}
                                <View style={styles.dividerLight} />
                                <View style={styles.priceRowTotal}>
                                    <Text allowFontScaling={false} style={styles.pbTotalLabel}>Total</Text>
                                    <Text allowFontScaling={false} style={styles.pbTotalValue}>₹{(item.finalAmount || 0).toLocaleString('en-IN')}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionsRow}>
                            {['ORDER PLACED', 'CONFIRMED', 'PENDING'].includes(item.orderStatus) && (
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => handleCancelOrder(item._id)}
                                >
                                    <Ionicons name="close-outline" size={rf(16)} color="#EF4444" style={{ marginRight: wp(1.6) }} />
                                    <Text allowFontScaling={false} style={styles.cancelButtonText}>Cancel Order</Text>
                                </TouchableOpacity>
                            )}

                            {item.orderStatus === 'DELIVERED' && (
                                <>
                                    <TouchableOpacity
                                        style={styles.reorderButton}
                                        onPress={() => {/* Reorder Logic */ }}
                                    >
                                        <Ionicons name="repeat" size={rf(16)} color="#FFF" style={{ marginRight: wp(1.6) }} />
                                        <Text allowFontScaling={false} style={styles.reorderText}>Reorder</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.returnButton}
                                        onPress={() => {
                                            const returnableItems = item.items.filter(oi => {
                                                const isProdObj = typeof oi.product === 'object' && oi.product !== null;
                                                const isRetObj = item.returnedItems?.some((ri: any) =>
                                                    ri.product === (isProdObj ? (oi.product as any)._id : oi.product)
                                                );

                                                if (!isProdObj) return false;

                                                const product = (oi.product as any);

                                                // Check deadline
                                                const now = new Date();
                                                const deliveryDate = new Date(item.updatedAt || item.createdAt);
                                                const diffTime = Math.abs(now.getTime() - deliveryDate.getTime());
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                const isWithinDeadline = diffDays <= (product.pReturnDays || 0);

                                                return product.pReturn && isWithinDeadline && !isRetObj;
                                            });

                                            if (returnableItems.length === 0) {
                                                Alert.alert('Return Info', 'No items in this order are eligible for return at this time.');
                                                return;
                                            }

                                            const firstItem = returnableItems[0];
                                            setSelectedItemForReturn({
                                                orderId: item._id,
                                                productId: (firstItem.product as any)._id,
                                                variantId: firstItem.variant
                                            });
                                            setIsReturnModalVisible(true);
                                        }}
                                    >
                                        <Ionicons name="refresh-outline" size={rf(16)} color="#F38000" style={{ marginRight: wp(1.6) }} />
                                        <Text allowFontScaling={false} style={styles.returnButtonText}>Return</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        {/* Invoice Button Row */}
                        {(item.paymentStatus === 'PAID' || item.orderStatus === 'DELIVERED') && (
                            <TouchableOpacity
                                style={styles.invoiceButton}
                                onPress={() => handleDownloadInvoice(item)}
                            >
                                <Ionicons name="document-text-outline" size={rf(16)} color="#3B82F6" />
                                <Text allowFontScaling={false} style={styles.invoiceButtonText}>Download Invoice Receipt</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return <PremiumLoader />;
    }

    if (!token) {
        return (
            <View style={styles.container}>
                <CustomHeader title="My Orders" />
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrap}>
                        <Image
                            source={require('../../assets/images/Kairaa4.png')}
                            style={{ width: 140, height: 140, resizeMode: 'contain' }}
                        />
                    </View>
                    <Text allowFontScaling={false} style={styles.emptyTitle}>View Your Orders</Text>
                    <Text allowFontScaling={false} style={styles.emptySubText}>Register or Login to see your previous purchases and track your active orders.</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => router.push('/(auth)/register')}
                    >
                        <Text allowFontScaling={false} style={styles.shopButtonText}>Register / Login</Text>
                        <Ionicons name="arrow-forward" size={rf(16)} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CustomHeader title="My Orders" showBack />

            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 5 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F38000']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconWrap}>
                            <Image
                                source={require('../../assets/images/Kairaa4.png')}
                                style={{ width: wp(37.3), height: wp(37.3), resizeMode: 'contain', opacity: 0.9 }}
                            />
                        </View>
                        <Text allowFontScaling={false} style={styles.emptyTitle}>No Orders Yet</Text>
                        <Text allowFontScaling={false} style={styles.emptySubText}>Looks like you haven't made your choice yet.</Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => router.push('/(tabs)')}
                            activeOpacity={0.8}
                        >
                            <Text allowFontScaling={false} style={styles.shopButtonText}>Start Shopping</Text>
                            <Ionicons name="arrow-forward" size={rf(16)} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Return Request Modal */}
            <Modal
                visible={isReturnModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsReturnModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text allowFontScaling={false} style={styles.modalTitle}>Request Return</Text>
                            <TouchableOpacity onPress={() => setIsReturnModalVisible(false)}>
                                <Ionicons name="close" size={rf(24)} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text allowFontScaling={false} style={styles.modalLabel}>Reason for Return</Text>
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Please explain why you want to return this item..."
                            multiline
                            numberOfLines={4}
                            value={returnReason}
                            onChangeText={setReturnReason}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setIsReturnModalVisible(false)}
                            >
                                <Text allowFontScaling={false} style={styles.modalCancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSubmitBtn, submittingReturn && { opacity: 0.7 }]}
                                onPress={handleReturnItem}
                                disabled={submittingReturn}
                            >
                                {submittingReturn ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text allowFontScaling={false} style={styles.modalSubmitBtnText}>Submit Request</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', // Premium soft light background
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: wp(5.3),
        paddingTop: hp(1.2),
        paddingBottom: hp(2.3),
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: rf(28),
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: rf(14),
        color: '#6B7280',
        fontWeight: '500',
        marginTop: hp(0.5),
    },
    listContent: {
        padding: wp(4.2),
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: rf(24),
        marginBottom: hp(2.3),
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
        overflow: 'hidden',
    },
    orderHeader: {
        padding: wp(5.3),
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIndicator: {
        width: wp(2.1),
        height: wp(2.1),
        borderRadius: rf(4),
        marginRight: wp(2.1),
    },
    orderId: {
        fontSize: rf(15),
        fontWeight: '800',
        color: '#111827',
        letterSpacing: 0.5,
    },
    orderDate: {
        fontSize: rf(13),
        color: '#6B7280',
        marginTop: hp(0.7),
        marginLeft: wp(4.2),
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: wp(2.6),
        paddingVertical: hp(0.5),
        borderRadius: rf(12),
    },
    statusText: {
        fontSize: rf(10),
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    quickItems: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(2.3),
    },
    imageStackGallery: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 100, // allocate enough space for stacked images
    },
    miniImageWrap: {
        position: 'absolute',
        width: wp(11.7),
        height: wp(11.7),
        borderRadius: rf(12),
        backgroundColor: '#F3F4F6',
        borderWidth: wp(0.5),
        borderColor: '#FFFFFF',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
        backgroundColor: '#F8FAFC',
    },
    moreCount: {
        position: 'absolute',
        width: wp(11.7),
        height: wp(11.7),
        borderRadius: rf(12),
        backgroundColor: '#F3F4F6',
        borderWidth: wp(0.5),
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreCountText: {
        fontSize: rf(13),
        fontWeight: '800',
        color: '#6B7280',
    },
    totalBlock: {
        flex: 1,
        alignItems: 'flex-end',
        marginRight: wp(4.2),
    },
    totalLabel: {
        fontSize: rf(12),
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: hp(0.2),
    },
    totalValue: {
        fontSize: rf(18),
        fontWeight: '900',
        color: '#111827',
    },
    chevronWrap: {
        width: wp(8.5),
        height: wp(8.5),
        borderRadius: rf(16),
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chevronExpanded: {
        transform: [{ rotate: '180deg' }],
        backgroundColor: '#FFF7ED',
        borderColor: '#FFEDD5',
        borderWidth: 1,
    },
    expandedContent: {
        paddingHorizontal: wp(5.3),
        paddingBottom: hp(2.3),
        backgroundColor: '#FDFDFD',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    divider: {
        height: hp(0.1),
        backgroundColor: '#E5E7EB',
        marginVertical: hp(1.9),
    },
    dividerLight: {
        height: hp(0.1),
        backgroundColor: '#F3F4F6',
        marginVertical: hp(1.4),
    },
    sectionTitle: {
        fontSize: rf(14),
        fontWeight: '800',
        color: '#111827',
        marginBottom: hp(1.9),
        letterSpacing: 0.3,
    },
    trackerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(2.6),
        marginBottom: hp(0.9),
    },
    stepItem: {
        alignItems: 'center',
        width: wp(14.6),
    },
    stepCircle: {
        width: wp(7.4),
        height: wp(7.4),
        borderRadius: rf(14),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: hp(0.9),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    stepLabel: {
        fontSize: rf(10),
        fontWeight: '700',
        textAlign: 'center',
    },
    stepLine: {
        flex: 1,
        height: hp(0.35),
        marginTop: hp(-2.3),
        marginHorizontal: wp(-4),
        borderRadius: 2,
    },
    cancelledStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: wp(3.7),
        borderRadius: rf(16),
    },
    cancelledText: {
        marginLeft: wp(2.1),
        color: '#B91C1C',
        fontWeight: '800',
        fontSize: rf(15),
    },
    detailedItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(1.9),
        backgroundColor: '#FFFFFF',
        padding: wp(3.2),
        borderRadius: rf(16),
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    detailedItemImage: {
        width: wp(14.9),
        height: wp(14.9),
        borderRadius: rf(12),
        backgroundColor: '#F8FAFC',
        resizeMode: 'contain',
    },
    detailedItemInfo: {
        flex: 1,
        marginLeft: wp(3.7),
    },
    detailedItemName: {
        fontSize: rf(14),
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: rf(20),
    },
    detailedItemSub: {
        fontSize: rf(13),
        color: '#6B7280',
        marginTop: hp(0.5),
        fontWeight: '500',
    },
    detailedItemTotal: {
        fontSize: rf(15),
        fontWeight: '900',
        color: '#111827',
    },
    summaryBlock: {
        marginTop: hp(1.2),
    },
    infoCol: {
        marginBottom: hp(2.3),
    },
    infoBox: {
        backgroundColor: '#FFFFFF',
        padding: wp(4.2),
        borderRadius: rf(16),
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    infoLabel: {
        fontSize: rf(11),
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: hp(0.9),
    },
    infoTitle: {
        fontSize: rf(14),
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: hp(0.5),
    },
    infoDesc: {
        fontSize: rf(13),
        color: '#6B7280',
        lineHeight: rf(18),
    },
    priceBreakdown: {
        backgroundColor: '#FFFFFF',
        padding: wp(4.2),
        borderRadius: rf(16),
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: hp(0.9),
    },
    pbLabel: {
        fontSize: rf(13),
        color: '#6B7280',
        fontWeight: '500',
    },
    pbValue: {
        fontSize: rf(13),
        fontWeight: '700',
        color: '#111827',
    },
    priceRowTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pbTotalLabel: {
        fontSize: rf(15),
        fontWeight: '900',
        color: '#111827',
    },
    pbTotalValue: {
        fontSize: rf(18),
        fontWeight: '900',
        color: '#F38000',
    },
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: hp(2.3),
        gap: wp(3.2),
    },
    reorderButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        paddingVertical: hp(1.4),
        borderRadius: rf(14),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    reorderText: {
        color: '#FFFFFF',
        fontSize: rf(13),
        fontWeight: '800',
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#FFF1F1',
        paddingVertical: hp(1.4),
        borderRadius: rf(14),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    cancelButtonText: {
        color: '#EF4444',
        fontSize: rf(13),
        fontWeight: '800',
    },
    returnButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#FFF7ED',
        paddingVertical: hp(1.4),
        borderRadius: rf(14),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    returnButtonText: {
        color: '#F38000',
        fontSize: rf(13),
        fontWeight: '800',
    },
    invoiceButton: {
        marginTop: hp(1.5),
        flexDirection: 'row',
        backgroundColor: '#F0F9FF',
        paddingVertical: hp(1.4),
        borderRadius: rf(14),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    invoiceButtonText: {
        color: '#0284C7',
        fontSize: rf(13),
        fontWeight: '800',
        marginLeft: wp(2),
    },
    emptyContainer: {
        marginTop: hp(9.4),
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIconWrap: {
        width: wp(26.6),
        height: wp(26.6),
        borderRadius: rf(50),
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(2.3),
    },
    emptyTitle: {
        fontSize: rf(22),
        fontWeight: '900',
        color: '#111827',
    },
    emptySubText: {
        fontSize: rf(14),
        color: '#6B7280',
        marginTop: hp(0.9),
        textAlign: 'center',
        maxWidth: wp(66.6),
        lineHeight: rf(20),
    },
    shopButton: {
        marginTop: hp(3.5),
        backgroundColor: '#F38000',
        paddingHorizontal: wp(7.4),
        paddingVertical: hp(1.9),
        borderRadius: rf(16),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F38000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    shopButtonText: {
        color: '#FFFFFF',
        fontSize: rf(15),
        fontWeight: '800',
        marginRight: wp(1.6),
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(5.3)
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: rf(24),
        padding: wp(6.4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2.3)
    },
    modalTitle: {
        fontSize: rf(20),
        fontWeight: '900',
        color: '#111827'
    },
    modalLabel: {
        fontSize: rf(14),
        fontWeight: '700',
        color: '#374151',
        marginBottom: hp(0.9)
    },
    reasonInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: rf(16),
        padding: wp(4.2),
        height: hp(14),
        textAlignVertical: 'top',
        fontSize: rf(14),
        color: '#111827',
        marginBottom: hp(2.8)
    },
    modalActions: {
        flexDirection: 'row',
        gap: wp(3.2)
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: hp(1.6),
        borderRadius: rf(16),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6'
    },
    modalCancelBtnText: {
        fontSize: rf(14),
        fontWeight: '800',
        color: '#4B5563'
    },
    modalSubmitBtn: {
        flex: 2,
        paddingVertical: hp(1.6),
        borderRadius: rf(16),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F38000'
    },
    modalSubmitBtnText: {
        fontSize: rf(14),
        fontWeight: '800',
        color: '#FFF'
    },
    returnBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        paddingHorizontal: wp(2.1),
        paddingVertical: hp(0.5),
        borderRadius: rf(8),
        marginTop: hp(0.7),
        alignSelf: 'flex-start'
    },
    returnBadgeText: {
        fontSize: rf(11),
        fontWeight: '700',
        color: '#F38000',
        marginLeft: wp(1)
    }
});

export default OrdersScreen;
