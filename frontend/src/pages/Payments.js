import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Table, Badge, Alert } from 'react-bootstrap';
import PaymentForm from '../components/PaymentForm';
import axios from 'axios';
import { useAuth } from '../services/AuthContext';
import { useSocket } from '../services/SocketContext';
import { toast } from 'react-toastify';
import moment from 'moment';

const Payments = () => {
  const { currentUser } = useAuth();
  const { emitPaymentUpdate } = useSocket();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('contribution');
  const [selectedItem, setSelectedItem] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState({
    contributions: [],
    loanPayments: [],
    penaltyPayments: []
  });
  const [tontines, setTontines] = useState([]);
  const [loans, setLoans] = useState([]);
  const [missedContributions, setMissedContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch payment history
      const historyResponse = await axios.get(`/api/payments/history/${currentUser.id}`);
      setPaymentHistory(historyResponse.data);

      // Fetch user's tontines
      const tontinesResponse = await axios.get('/api/tontines');
      const userTontines = tontinesResponse.data.filter(t => 
        t.members?.some(m => m.id === currentUser.id)
      );
      setTontines(userTontines);

      // Fetch user's loans
      const loansResponse = await axios.get(`/api/loans/user/${currentUser.id}`);
      setLoans(loansResponse.data.filter(l => l.status === 'Approved'));

      // Fetch missed contributions
      const missedResponse = await axios.get(`/api/contributions/missed/${currentUser.id}`);
      setMissedContributions(missedResponse.data);

    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    toast.success('Payment processed successfully!');
    setShowPaymentModal(false);
    setSelectedItem(null);
    
    // Emit real-time update
    emitPaymentUpdate({
      type: paymentType,
      amount: selectedItem?.amount || selectedItem?.loan_amount,
      userId: currentUser.id,
      timestamp: new Date()
    });

    // Refresh data
    fetchData();
  };

  const handlePaymentError = (error) => {
    toast.error('Payment failed. Please try again.');
    console.error('Payment error:', error);
  };

  const openPaymentModal = (type, item) => {
    setPaymentType(type);
    setSelectedItem(item);
    setShowPaymentModal(true);
  };

  const getPaymentMetadata = () => {
    if (paymentType === 'contribution') {
      return {
        userId: currentUser.id,
        tontineId: selectedItem?.id,
        type: 'contribution'
      };
    } else if (paymentType === 'loan-payment') {
      return {
        userId: currentUser.id,
        loanId: selectedItem?.id,
        type: 'loan-payment'
      };
    } else if (paymentType === 'missed-contribution') {
      return {
        userId: currentUser.id,
        tontineId: selectedItem?.tontine_id,
        missedId: selectedItem?.id,
        type: 'missed-contribution'
      };
    }
    return {};
  };

  const getPaymentAmount = () => {
    if (paymentType === 'contribution') {
      return selectedItem?.contribution_amount || 0;
    } else if (paymentType === 'loan-payment') {
      return selectedItem?.total_amount || 0;
    } else if (paymentType === 'missed-contribution') {
      return selectedItem?.missed_amount || 0;
    }
    return 0;
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center mt-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Payments</h2>
          <p className="text-muted">Manage your contributions and loan payments</p>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col md={4}>
          <Card>
            <Card.Header>
              <Card.Title>Make Contribution</Card.Title>
            </Card.Header>
            <Card.Body>
              <p>Pay your regular tontine contributions</p>
              {tontines.length > 0 ? (
                <div>
                  {tontines.map(tontine => (
                    <div key={tontine.id} className="mb-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openPaymentModal('contribution', tontine)}
                        className="w-100"
                      >
                        Pay RWF {parseFloat(tontine.contribution_amount).toLocaleString()} to {tontine.name}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert variant="info">No active tontines found</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <Card.Title>Loan Payments</Card.Title>
            </Card.Header>
            <Card.Body>
              <p>Pay back your approved loans</p>
              {loans.length > 0 ? (
                <div>
                  {loans.map(loan => (
                    <div key={loan.id} className="mb-2">
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => openPaymentModal('loan-payment', loan)}
                        className="w-100"
                      >
                        Pay RWF {parseFloat(loan.total_amount).toLocaleString()} (Loan #{loan.id})
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert variant="info">No active loans found</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <Card.Title>Missed Contributions</Card.Title>
            </Card.Header>
            <Card.Body>
              <p>Pay your missed contributions</p>
              {missedContributions.length > 0 ? (
                <div>
                  {missedContributions.slice(0, 3).map(missed => (
                    <div key={missed.id} className="mb-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openPaymentModal('missed-contribution', missed)}
                        className="w-100"
                      >
                        Pay RWF {parseFloat(missed.missed_amount).toLocaleString()} ({missed.tontine_name})
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert variant="success">No missed contributions</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Payment History */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <Card.Title>Contribution History</Card.Title>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Tontine</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.contributions.slice(0, 10).map((contribution) => (
                    <tr key={contribution.id}>
                      <td>{contribution.tontine_name}</td>
                      <td>RWF {parseFloat(contribution.amount).toLocaleString()}</td>
                      <td>
                        <Badge bg={
                          contribution.payment_status === 'Approved' ? 'success' :
                          contribution.payment_status === 'Pending' ? 'warning' : 'danger'
                        }>
                          {contribution.payment_status}
                        </Badge>
                      </td>
                      <td>{moment(contribution.contribution_date).format('MMM DD, YYYY')}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <Card.Title>Loan Payment History</Card.Title>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Loan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.loanPayments.slice(0, 10).map((payment) => (
                    <tr key={payment.id}>
                      <td>Loan #{payment.loan_id}</td>
                      <td>RWF {parseFloat(payment.amount).toLocaleString()}</td>
                      <td>
                        <Badge bg={
                          payment.payment_status === 'Approved' ? 'success' :
                          payment.payment_status === 'Pending' ? 'warning' : 'danger'
                        }>
                          {payment.payment_status}
                        </Badge>
                      </td>
                      <td>{moment(payment.payment_date).format('MMM DD, YYYY')}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {paymentType === 'contribution' && 'Make Contribution'}
            {paymentType === 'loan-payment' && 'Loan Payment'}
            {paymentType === 'missed-contribution' && 'Pay Missed Contribution'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <PaymentForm
              amount={getPaymentAmount()}
              type={paymentType}
              metadata={getPaymentMetadata()}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Payments;