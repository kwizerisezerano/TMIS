import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import axios from '../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';

const TontineManage = () => {
  const { id } = useParams();
  
  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1 style={{color: 'red', fontSize: '48px'}}>MANAGE PAGE WORKS!</h1>
          <h2>Tontine ID: {id}</h2>
          <p>This is the management page for tontine {id}</p>
        </Col>
      </Row>
    </Container>
  );
};

export default TontineManage;