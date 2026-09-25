import { Alert, Platform, NativeModules } from 'react-native';

let RazorpayCheckout: any;

// Set this to true to force simulation mode (e.g., during development)
const FORCE_SIMULATION = false; 

const isNativeModuleAvailable = 
    Platform.OS !== 'web' && 
    NativeModules && 
    (NativeModules.RazorpayCheckout || NativeModules.RNRazorpayCheckout || NativeModules.Razorpay);

if (Platform.OS !== 'web') {
    console.log('--- Razorpay Native Modules Debug ---');
    console.log('NativeModules.RazorpayCheckout:', !!NativeModules?.RazorpayCheckout);
    console.log('NativeModules.RNRazorpayCheckout:', !!NativeModules?.RNRazorpayCheckout);
    console.log('NativeModules keys:', Object.keys(NativeModules || {}));
    console.log('------------------------------------');
}

if (isNativeModuleAvailable) {
    try {
        // We only require if the native module is actually present
        const Razorpay = require('react-native-razorpay');
        // Handle different export patterns (CommonJS vs ES Modules)
        RazorpayCheckout = Razorpay.default || Razorpay;
    } catch (error) {
        console.warn('Failed to load Razorpay native module:', error);
    }
}

const RazorpayMock = {
    open: (options: any) => {
        return new Promise((resolve, reject) => {
            console.log('Razorpay Mock Open with options:', options);
            Alert.alert(
                'Payment Simulation',
                'Razorpay is in simulation mode.\n\nWould you like to simulate a successful payment?',
                [
                    {
                        text: 'Cancel Payment',
                        onPress: () => reject({ code: 2, description: 'Payment cancelled by user' }),
                        style: 'cancel',
                    },
                    {
                        text: 'Simulate Success',
                        onPress: () => resolve({
                            razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(7),
                            razorpay_order_id: options.order_id,
                            razorpay_signature: 'mock_signature',
                        }),
                    },
                ]
            );
        });
    },
};

// If FORCE_SIMULATION is true, we always use the mock
// Otherwise, we use the real module if available, failing back to mock
export default FORCE_SIMULATION ? RazorpayMock : (RazorpayCheckout || RazorpayMock);
