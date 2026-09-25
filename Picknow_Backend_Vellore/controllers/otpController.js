const twilio = require('twilio');
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

// Initialize Twilio client
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// In-memory store for OTPs (for demonstration purposes)
const otpStore = {};

const sendOtp = async (req, res) => {
  const { mobileNumber } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP

  try {
    // Send OTP via SMS
    await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: TWILIO_PHONE_NUMBER,
      to: mobileNumber,
    });

    // Store OTP in memory (you may want to use a database in production)
    otpStore[mobileNumber] = otp;

    return res.status(200).json({ success: true, message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

const verifyOtp = (req, res) => {
  const { mobileNumber, otp } = req.body;

  // Check if the OTP matches
  if (otpStore[mobileNumber] && otpStore[mobileNumber] === otp) {
    delete otpStore[mobileNumber]; // Clear OTP after verification
    return res.status(200).json({ success: true, message: 'OTP verified successfully!' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
}; 