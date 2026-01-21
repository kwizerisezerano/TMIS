import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { useAuth } from '../services/AuthContext';
import { useSocket } from '../services/SocketContext';
import moment from 'moment';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { notifications } = useSocket();
  const [dashboardData, setDashboardData] = useState({
    tontines: [],
    contributions: [],
    loans: [],
    stats: {
      totalContributions: 0,
      totalLoans: 0,
      activeTontines: 0,
      pendingPayments: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's tontines
      const tontinesResponse = await axios.get('/api/tontines');
      const userTontines = tontinesResponse.data.filter(t => 
        t.creator_id === currentUser.id || 
        t.members?.some(m => m.id === currentUser.id)
      );

      // Fetch user's contributions
      const contributionsResponse = await axios.get(`/api/contributions/user/${currentUser.id}`);
      
      // Fetch user's loans
      const loansResponse = await axios.get(`/api/loans/user/${currentUser.id}`);

      // Calculate stats
      const totalContributions = contributionsResponse.data
        .filter(c => c.payment_status === 'Approved')
        .reduce((sum, c) => sum + parseFloat(c.amount), 0);
      
      const totalLoans = loansResponse.data
        .filter(l => l.status === 'Approved')
        .reduce((sum, l) => sum + parseFloat(l.loan_amount), 0);

      const activeTontines = userTontines.filter(t => t.status === 'active').length;
      
      const pendingPayments = contributionsResponse.data
        .filter(c => c.payment_status === 'Pending').length;

      setDashboardData({
        tontines: userTontines,
        contributions: contributionsResponse.data,
        loans: loansResponse.data,
        stats: {
          totalContributions,
          totalLoans,
          activeTontines,
          pendingPayments
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const contributionChartData = {
    labels: dashboardData.contributions
      .slice(-6)
      .map(c => moment(c.contribution_date).format('MMM DD')),
    datasets: [
      {
        label: 'Contributions',
        data: dashboardData.contributions
          .slice(-6)
          .map(c => parseFloat(c.amount)),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const statusChartData = {
    labels: ['Approved', 'Pending', 'Failed'],
    datasets: [
      {
        data: [
          dashboardData.contributions.filter(c => c.payment_status === 'Approved').length,
          dashboardData.contributions.filter(c => c.payment_status === 'Pending').length,
          dashboardData.contributions.filter(c => c.payment_status === 'Failure').length,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
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
          <h2>Dashboard</h2>
          <p className="text-muted">Welcome back, {currentUser.username || currentUser.email}!</p>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-primary">RWF {dashboardData.stats.totalContributions.toLocaleString()}</Card.Title>
              <Card.Text>Total Contributions</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-warning">RWF {dashboardData.stats.totalLoans.toLocaleString()}</Card.Title>
              <Card.Text>Total Loans</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-success">{dashboardData.stats.activeTontines}</Card.Title>
              <Card.Text>Active Tontines</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-danger">{dashboardData.stats.pendingPayments}</Card.Title>
              <Card.Text>Pending Payments</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Header>
              <Card.Title>Recent Contributions</Card.Title>
            </Card.Header>
            <Card.Body>
              <Bar data={contributionChartData} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>
              <Card.Title>Payment Status</Card.Title>
            </Card.Header>
            <Card.Body>
              <Doughnut data={statusChartData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <Card.Title>Recent Contributions</Card.Title>
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
                  {dashboardData.contributions.slice(0, 5).map((contribution) => (
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
              <Card.Title>Recent Notifications</Card.Title>
            </Card.Header>
            <Card.Body>
              {notifications.length === 0 ? (
                <p className="text-muted">No recent notifications</p>
              ) : (
                <div>
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="border-bottom pb-2 mb-2">
                      <small className="text-muted">
                        {moment(notification.timestamp).fromNow()}
                      </small>
                      <div>{notification.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;