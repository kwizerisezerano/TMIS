import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Badge, Dropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../services/AuthContext';
import { useSocket } from '../services/SocketContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { notifications } = useSocket();

  const unreadCount = notifications.length;

  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg" className="mb-4">
      <Container>
        <LinkContainer to="/">
          <BootstrapNavbar.Brand>Ikimina</BootstrapNavbar.Brand>
        </LinkContainer>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {currentUser && (
              <>
                <LinkContainer to="/dashboard">
                  <Nav.Link>Dashboard</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/tontines">
                  <Nav.Link>Tontines</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/contributions">
                  <Nav.Link>Contributions</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/loans">
                  <Nav.Link>Loans</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/payments">
                  <Nav.Link>Payments</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
          
          <Nav>
            {currentUser ? (
              <>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="outline-light" id="notifications-dropdown">
                    🔔 {unreadCount > 0 && <Badge bg="danger">{unreadCount}</Badge>}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Header>Notifications</Dropdown.Header>
                    {notifications.length === 0 ? (
                      <Dropdown.Item disabled>No new notifications</Dropdown.Item>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <Dropdown.Item key={notification.id}>
                          <small className="text-muted">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </small>
                          <div>{notification.message}</div>
                        </Dropdown.Item>
                      ))
                    )}
                  </Dropdown.Menu>
                </Dropdown>
                
                <Dropdown align="end">
                  <Dropdown.Toggle variant="outline-light" id="user-dropdown">
                    {currentUser.username || currentUser.email}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#profile">Profile</Dropdown.Item>
                    <Dropdown.Item href="#settings">Settings</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <LinkContainer to="/login">
                  <Nav.Link>Login</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/register">
                  <Nav.Link>Register</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;