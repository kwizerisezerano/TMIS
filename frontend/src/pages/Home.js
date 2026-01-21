import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <Container>
      {/* Hero Section */}
      <Row className="text-center py-5">
        <Col>
          <h1 className="display-4 mb-4">Welcome to Ikimina</h1>
          <p className="lead mb-4">
            Digital Tontine Management System with Real-time Payment Integration
          </p>
          {!currentUser ? (
            <div>
              <Link to="/register" className="btn btn-primary btn-lg me-3">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-outline-primary btn-lg">
                Login
              </Link>
            </div>
          ) : (
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              Go to Dashboard
            </Link>
          )}
        </Col>
      </Row>

      {/* Features Section */}
      <Row className="py-5">
        <Col md={4} className="mb-4">
          <Card className="h-100 text-center">
            <Card.Body>
              <div className="mb-3">
                <i className="fas fa-users fa-3x text-primary"></i>
              </div>
              <Card.Title>Tontine Management</Card.Title>
              <Card.Text>
                Create and manage tontines with ease. Track members, contributions, and payouts in real-time.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100 text-center">
            <Card.Body>
              <div className="mb-3">
                <i className="fas fa-credit-card fa-3x text-success"></i>
              </div>
              <Card.Title>Multiple Payment Methods</Card.Title>
              <Card.Text>
                Accept payments via credit cards, PayPal, and mobile money. Secure and instant processing.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100 text-center">
            <Card.Body>
              <div className="mb-3">
                <i className="fas fa-bell fa-3x text-warning"></i>
              </div>
              <Card.Title>Real-time Notifications</Card.Title>
              <Card.Text>
                Get instant notifications for contributions, loan approvals, and important tontine updates.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* How It Works */}
      <Row className="py-5 bg-light">
        <Col>
          <h2 className="text-center mb-5">How It Works</h2>
          <Row>
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                  <span className="h4 mb-0">1</span>
                </div>
              </div>
              <h5>Create Account</h5>
              <p>Sign up and verify your identity to get started with Ikimina.</p>
            </Col>
            
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                  <span className="h4 mb-0">2</span>
                </div>
              </div>
              <h5>Join or Create Tontine</h5>
              <p>Join existing tontines or create your own with custom rules and schedules.</p>
            </Col>
            
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                  <span className="h4 mb-0">3</span>
                </div>
              </div>
              <h5>Make Contributions</h5>
              <p>Make regular contributions using your preferred payment method.</p>
            </Col>
            
            <Col md={3} className="text-center mb-4">
              <div className="mb-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                  <span className="h4 mb-0">4</span>
                </div>
              </div>
              <h5>Receive Payouts</h5>
              <p>Get your turn to receive the collective contributions when it's your time.</p>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* CTA Section */}
      <Row className="py-5 text-center">
        <Col>
          <h2 className="mb-4">Ready to Get Started?</h2>
          <p className="lead mb-4">
            Join thousands of users who trust Ikimina for their tontine management needs.
          </p>
          {!currentUser && (
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Your Account Today
            </Link>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Home;