import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCreditCard, FaLock, FaArrowLeft, FaWallet } from 'react-icons/fa';
import { BsBank } from 'react-icons/bs';
import './PaymentPage.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { product, cart, totalAmount, isFromCart } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically handle the payment processing
    alert('Payment successful!');
    if (isFromCart) {
      localStorage.setItem('cart', '[]');
      localStorage.setItem('cartCount', '0');
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: 0 } }));
    }
    navigate('/');
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e) => {
    const value = formatCardNumber(e.target.value);
    if (value.length <= 19) {
      setCardNumber(value);
    }
  };

  const handleExpiryDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    if (value.length <= 5) {
      setExpiryDate(value);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-page__container">
        <button className="payment-page__back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft />
          <span>Back</span>
        </button>

        <div className="payment-page__content">
          <div className="payment-page__left">
            <div className="payment-page__header">
              <h1>Select Payment Method</h1>
              <div className="payment-page__secure-badge">
                <FaLock />
                <span>100% Secure Payments</span>
              </div>
            </div>

            <div className="payment-page__payment-methods">
              <button
                type="button"
                className={`payment-page__method-button ${paymentMethod === 'card' ? 'payment-page__method-button--active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <FaCreditCard className="payment-page__method-icon" />
                <span>Credit/Debit Card</span>
              </button>
              <button
                type="button"
                className={`payment-page__method-button ${paymentMethod === 'upi' ? 'payment-page__method-button--active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <FaWallet className="payment-page__method-icon" />
                <span>UPI</span>
              </button>
              <button
                type="button"
                className={`payment-page__method-button ${paymentMethod === 'netbanking' ? 'payment-page__method-button--active' : ''}`}
                onClick={() => setPaymentMethod('netbanking')}
              >
                <BsBank className="payment-page__method-icon" />
                <span>Net Banking</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="payment-page__form">
              <div className="payment-page__form-group">
                <label>Card Number</label>
                <div className="payment-page__input-wrapper">
                  <FaCreditCard className="payment-page__input-icon" />
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    required
                  />
                </div>
              </div>

              <div className="payment-page__form-row">
                <div className="payment-page__form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={handleExpiryDateChange}
                    required
                  />
                </div>
                <div className="payment-page__form-group">
                  <label>CVV</label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength="3"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>

              <div className="payment-page__form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="payment-page__pay-button">
                Pay ₹{isFromCart ? totalAmount : product?.price}
              </button>

              <div className="payment-page__secure-info">
                <FaLock />
                <span>Your payment information is securely encrypted</span>
              </div>
            </form>
          </div>

          <div className="payment-page__right">
            <div className="payment-page__order-summary">
              <h2>Order Summary</h2>
              {isFromCart ? (
                cart?.map((item) => (
                  <div key={item.id} className="payment-page__product-info">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <h3>{item.name}</h3>
                      <p>Quantity: {item.quantity}</p>
                      <p>₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="payment-page__product-info">
                  <img src={product?.image} alt={product?.name} />
                  <div>
                    <h3>{product?.name}</h3>
                    <p>Quantity: 1</p>
                    <p>₹{product?.price}</p>
                  </div>
                </div>
              )}
              <div className="payment-page__price-breakdown">
                <div className="payment-page__price-row">
                  <span>Subtotal</span>
                  <span>₹{isFromCart ? totalAmount : product?.price}</span>
                </div>
                <div className="payment-page__price-row">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="payment-page__price-row payment-page__price-row--total">
                  <span>Total</span>
                  <span>₹{isFromCart ? totalAmount : product?.price}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;