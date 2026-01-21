import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../services/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';

const Loans = () => {
  const { currentUser } = useAuth();
  const [loans, setLoans] = useState([]);
  const [tontines, setTontines] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    tontineId: '',
    loanAmount: '',
    interestRate: 5,
    paymentFrequency: 'monthly',
    phoneNumber: ''
  });

  useEffect(() => {
    fetchLoans();
    fetchTontines();
  }, [currentUser]);

  const fetchLoans = async () => {
    try {
      const response = await axios.get(`/api/loans/user/${currentUser.id}`);
      setLoans(response.data);
    } catch (error) {
      toast.error('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const fetchTontines = async () => {
    try {
      const response = await axios.get('/api/tontines');
      setTontines(response.data);
    } catch (error) {
      console.error('Failed to fetch tontines');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/loans', {
        userId: currentUser.id,
        tontineId: formData.tontineId,
        loanAmount: formData.loanAmount,
        interestRate: formData.interestRate,
        paymentFrequency: formData.paymentFrequency,
        phoneNumber: formData.phoneNumber
      });
      toast.success('Loan request submitted!');
      setShowRequestModal(false);
      fetchLoans();
    } catch (error) {
      toast.error('Failed to submit loan request');
    }
  };

  if (loading) {
    return <Container><div className="text-center mt-5">Loading...</div></Container>;
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>My Loans</h2>
          <Button variant="primary" onClick={() => setShowRequestModal(true)}>
            Request New Loan
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Tontine</th>
                    <th>Amount</th>
                    <th>Interest</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => (
                    <tr key={loan.id}>
                      <td>{loan.tontine_name}</td>
                      <td>RWF {parseFloat(loan.loan_amount).toLocaleString()}</td>
                      <td>{loan.interest_rate}%</td>
                      <td>RWF {parseFloat(loan.total_amount).toLocaleString()}</td>
                      <td>
                        <Badge bg={
                          loan.status === 'Approved' ? 'success' :
                          loan.status === 'Pending' ? 'warning' : 'danger'
                        }>
                          {loan.status}
                        </Badge>
                      </td>
                      <td>{moment(loan.created_at).format('MMM DD, YYYY')}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Request Loan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Tontine</Form.Label>
              <Form.Select
                value={formData.tontineId}
                onChange={(e) => setFormData({...formData, tontineId: e.target.value})}
                required
              >
                <option value="">Select Tontine</option>
                {tontines.map(tontine => (
                  <option key={tontine.id} value={tontine.id}>{tontine.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Loan Amount</Form.Label>
              <Form.Control
                type="number"
                value={formData.loanAmount}
                onChange={(e) => setFormData({...formData, loanAmount: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                required
              />
            </Form.Group>
            <Button type="submit" variant="primary">Submit Request</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Loans;