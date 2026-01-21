import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../services/AuthContext';
import { toast } from 'react-toastify';

const Tontines = () => {
  const { currentUser } = useAuth();
  const [tontines, setTontines] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contribution_amount: '',
    contribution_frequency: 'monthly',
    max_members: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchTontines();
  }, []);

  const fetchTontines = async () => {
    try {
      const response = await axios.get('/api/tontines');
      setTontines(response.data);
    } catch (error) {
      toast.error('Failed to fetch tontines');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/tontines', {
        ...formData,
        creator_id: currentUser.id
      });
      toast.success('Tontine created successfully!');
      setShowCreateModal(false);
      fetchTontines();
    } catch (error) {
      toast.error('Failed to create tontine');
    }
  };

  const handleJoin = async (tontineId) => {
    try {
      await axios.post(`/api/tontines/${tontineId}/join`, {
        userId: currentUser.id
      });
      toast.success('Join request sent!');
      fetchTontines();
    } catch (error) {
      toast.error('Failed to join tontine');
    }
  };

  if (loading) {
    return <Container><div className="text-center mt-5">Loading...</div></Container>;
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Tontines</h2>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create New Tontine
          </Button>
        </Col>
      </Row>

      <Row>
        {tontines.map(tontine => (
          <Col md={4} key={tontine.id} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>{tontine.name}</Card.Title>
                <Card.Text>{tontine.description}</Card.Text>
                <p><strong>Contribution:</strong> RWF {parseFloat(tontine.contribution_amount).toLocaleString()}</p>
                <p><strong>Members:</strong> {tontine.member_count || 0}/{tontine.max_members}</p>
                <div className="d-flex gap-2">
                  <Link to={`/tontines/${tontine.id}`} className="btn btn-outline-primary btn-sm">
                    View Details
                  </Link>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => handleJoin(tontine.id)}
                  >
                    Join
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Tontine</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contribution Amount</Form.Label>
              <Form.Control
                type="number"
                value={formData.contribution_amount}
                onChange={(e) => setFormData({...formData, contribution_amount: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Max Members</Form.Label>
              <Form.Control
                type="number"
                value={formData.max_members}
                onChange={(e) => setFormData({...formData, max_members: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.start_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </Form.Group>
            <Button type="submit" variant="primary">Create Tontine</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Tontines;