import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const PaymentForm = ({ amount, onPaymentSuccess, onPaymentError, type = 'contribution', metadata = {} }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [mobileMoneyData, setMobileMoneyData] = useState({
    phoneNumber: '',
    provider: 'mtn'
  });

  const handleStripePayment = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;

    setLoading(true);
    
    try {
      const cardElement = elements.getElement(CardElement);
      
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Process payment on backend
      const response = await axios.post(`/api/payments/${type}`, {
        ...metadata,
        amount,
        paymentMethod: 'stripe',
        paymentData: {
          paymentMethodId: paymentMethod.id
        }
      });

      if (response.data.success) {
        toast.success('Payment processed successfully!');
        onPaymentSuccess(response.data);
      } else {
        throw new Error(response.data.message);
      }

    } catch (error) {
      toast.error(error.message);
      onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = (details, data) => {
    setLoading(true);
    
    axios.post(`/api/payments/${type}`, {
      ...metadata,
      amount,
      paymentMethod: 'paypal',
      paymentData: {
        paymentId: data.paymentID,
        payerId: data.payerID
      }
    })
    .then(response => {
      if (response.data.success) {
        toast.success('PayPal payment processed successfully!');
        onPaymentSuccess(response.data);
      } else {
        throw new Error(response.data.message);
      }
    })
    .catch(error => {
      toast.error(error.message);
      onPaymentError(error);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const handleMobileMoneyPayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`/api/payments/${type}`, {
        ...metadata,
        amount,
        paymentMethod: 'mobile_money',
        paymentData: {
          phone: mobileMoneyData.phoneNumber,
          provider: mobileMoneyData.provider
        }
      });

      if (response.data.success) {
        toast.success('Mobile Money payment initiated! Please check your phone.');
        onPaymentSuccess(response.data);
      } else {
        throw new Error(response.data.message);
      }

    } catch (error) {
      toast.error(error.message);
      onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h5>Payment Method</h5>
      
      <Form.Group className="mb-3">
        <Form.Label>Select Payment Method</Form.Label>
        <Form.Select 
          value={paymentMethod} 
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="stripe">Credit/Debit Card</option>
          <option value="paypal">PayPal</option>
          <option value="mobile_money">Mobile Money</option>
        </Form.Select>
      </Form.Group>

      <Alert variant="info">
        Amount to pay: <strong>${amount}</strong>
      </Alert>

      {paymentMethod === 'stripe' && (
        <Form onSubmit={handleStripePayment}>
          <Form.Group className="mb-3">
            <Form.Label>Card Details</Form.Label>
            <div className="p-3 border rounded">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </Form.Group>
          
          <Button 
            type="submit" 
            variant="primary" 
            disabled={!stripe || loading}
            className="w-100"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              `Pay $${amount}`
            )}
          </Button>
        </Form>
      )}

      {paymentMethod === 'paypal' && (
        <div className="paypal-container">
          <PayPalButtons
            createOrder={(data, actions) => {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: amount.toString()
                  }
                }]
              });
            }}
            onApprove={(data, actions) => {
              return actions.order.capture().then((details) => {
                handlePayPalPayment(details, data);
              });
            }}
            onError={(error) => {
              toast.error('PayPal payment failed');
              onPaymentError(error);
            }}
          />
        </div>
      )}

      {paymentMethod === 'mobile_money' && (
        <Form onSubmit={handleMobileMoneyPayment}>
          <Form.Group className="mb-3">
            <Form.Label>Mobile Money Provider</Form.Label>
            <Form.Select 
              value={mobileMoneyData.provider}
              onChange={(e) => setMobileMoneyData(prev => ({
                ...prev,
                provider: e.target.value
              }))}
            >
              <option value="mtn">MTN Mobile Money</option>
              <option value="airtel">Airtel Money</option>
              <option value="tigo">Tigo Cash</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="tel"
              placeholder="Enter your phone number"
              value={mobileMoneyData.phoneNumber}
              onChange={(e) => setMobileMoneyData(prev => ({
                ...prev,
                phoneNumber: e.target.value
              }))}
              required
            />
          </Form.Group>

          <Button 
            type="submit" 
            variant="success" 
            disabled={loading}
            className="w-100"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              `Pay $${amount} via Mobile Money`
            )}
          </Button>
        </Form>
      )}
    </div>
  );
};

export default PaymentForm;