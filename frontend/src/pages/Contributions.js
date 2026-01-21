import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../services/AuthContext';
import { toast } from 'react-toastify';
import moment from 'moment';

const Contributions = () => {
  const { currentUser } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContributions();
  }, [currentUser]);

  const fetchContributions = async () => {
    try {
      const response = await axios.get(`/api/contributions/user/${currentUser.id}`);
      setContributions(response.data);
    } catch (error) {
      toast.error('Failed to fetch contributions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container><div className="text-center mt-5">Loading...</div></Container>;
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>My Contributions</h2>
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
                    <th>Payment Method</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Transaction Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map(contribution => (
                    <tr key={contribution.id}>
                      <td>{contribution.tontine_name}</td>
                      <td>RWF {parseFloat(contribution.amount).toLocaleString()}</td>
                      <td>{contribution.payment_method}</td>
                      <td>{moment(contribution.contribution_date).format('MMM DD, YYYY')}</td>
                      <td>
                        <Badge bg={
                          contribution.payment_status === 'Approved' ? 'success' :
                          contribution.payment_status === 'Pending' ? 'warning' : 'danger'
                        }>
                          {contribution.payment_status}
                        </Badge>
                      </td>
                      <td><small>{contribution.transaction_ref}</small></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Contributions;