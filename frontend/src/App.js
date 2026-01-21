import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification';
import Dashboard from './pages/Dashboard';
import Tontines from './pages/Tontines';
import TontineDetail from './pages/TontineDetail';
import TontineManage from './pages/TontineManage';
import Contributions from './pages/Contributions';
import Loans from './pages/Loans';
import Payments from './pages/Payments';
import { AuthProvider } from './services/AuthContext';
import { SocketProvider } from './services/SocketContext';

// Initialize Stripe
const stripePromise = loadStripe('your_stripe_publishable_key');

function App() {
  return (
    <PayPalScriptProvider options={{ "client-id": "your_paypal_client_id" }}>
      <Elements stripe={stripePromise}>
        <AuthProvider>
          <SocketProvider>
            <Router>
            <div className="App">
              <Navbar />
              <div className="container-fluid">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<EmailVerification />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tontines" element={<Tontines />} />
                  <Route path="/tontines/:id/manage" element={<TontineManage />} />
                  <Route path="/tontines/:id" element={<TontineDetail />} />
                  <Route path="/contributions" element={<Contributions />} />
                  <Route path="/loans" element={<Loans />} />
                  <Route path="/payments" element={<Payments />} />
                </Routes>
              </div>
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </Elements>
    </PayPalScriptProvider>
  );
}

export default App;