import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';

const TontineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTontineDetail();
  }, [id]);

  const fetchTontineDetail = async () => {
    try {
      const response = await axios.get(`/api/tontines/${id}`);
      setTontine(response.data);
    } catch (error) {
      toast.error('Failed to fetch tontine details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container><div className="text-center mt-5">Loading...</div></Container>;
  }

  if (!tontine) {
    return <Container><div className="text-center mt-5">Tontine not found</div></Container>;
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>{tontine.name}</h2>
              <p className="text-muted">{tontine.description}</p>
            </div>
            <div>
              <Link to={`/tontines/${id}/manage`} className="btn btn-primary">
                Manage Tontine
              </Link>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card>
            <Card.Header>Tontine Info</Card.Header>
            <Card.Body>
              <p><strong>Contribution:</strong> ${tontine.contribution_amount}</p>
              <p><strong>Frequency:</strong> {tontine.contribution_frequency}</p>
              <p><strong>Members:</strong> {tontine.members?.length || 0}/{tontine.max_members}</p>
              <p><strong>Status:</strong> <Badge bg="success">{tontine.status}</Badge></p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card>
            <Card.Header>Members</Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tontine.members?.map(member => (
                    <tr key={member.id}>
                      <td>{member.names}</td>
                      <td>{member.email}</td>
                      <td>{moment(member.joined_at).format('MMM DD, YYYY')}</td>
                      <td>
                        <Badge bg={member.status === 'approved' ? 'success' : 'warning'}>
                          {member.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>Recent Contributions</Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tontine.contributions?.map(contribution => (
                    <tr key={contribution.id}>
                      <td>{contribution.names}</td>
                      <td>${contribution.amount}</td>
                      <td>{moment(contribution.contribution_date).format('MMM DD, YYYY')}</td>
                      <td>
                        <Badge bg={
                          contribution.payment_status === 'Approved' ? 'success' :
                          contribution.payment_status === 'Pending' ? 'warning' : 'danger'
                        }>
                          {contribution.payment_status}
                        </Badge>
                      </td>
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

export default TontineDetail;