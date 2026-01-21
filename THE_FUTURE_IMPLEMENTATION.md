# The Future Association - Implementation Guide

## Overview
This implementation is specifically designed for "The Future" association as per their constitution dated January 14, 2024.

## Key Features Implemented

### 1. Association Structure
- **Name**: The Future
- **Headquarters**: Southern Province, Kamonyi District, Runda Sector, Gihara Cell, Bimba Village
- **Founded**: January 14, 2024
- **Max Members**: 20 (as per Article 7.a)

### 2. Executive Committee (Article 17)
- **President**: Florien NDAGIJIMANA (0788570890)
- **Vice-President**: Dr. Athanase HATEGEKIMANA (0788738036)
- **Secretary/Accountant**: NIYONGOMBWA Didier (0788602741)
- **Advisors**: RUZIGANA Victor, HABIMANA Adolphe
- **Auditors**: KWIZERA Ivan (President), DUSABIMANA Edmond (V/President), NIYIRORA Jean Damascene (Secretary)

### 3. Financial Rules (Chapter V)

#### Monthly Contributions (Article 26)
- **Amount**: 20,000 RWF per month (mandatory)
- **New Member Fee**: Share amount + 10% of current share value
- **Payment Method**: Lanari Pay integration (0790989830)

#### Loan System (Article 28)
- **Maximum Amount**: 2/3 of member's total contributions
- **Interest Rate**: 1.7% per month
- **Repayment Period**: Maximum 6 months
- **Eligibility**: No outstanding loans
- **Late Payment**: 3.4% per month after 3 months overdue

### 4. Penalties System (Article 36)

#### Meeting Penalties
- **Unexcused Absence**: 5,000 RWF
- **Late Arrival** (>15 minutes): 1,000 RWF

#### Contribution Penalties
- **Late Payment** (10-17 days): 1,000 RWF
- **Late Payment** (after 17th): 200 RWF (1% of monthly share)

#### Loan Penalties
- **Default Payment**: 10% of remaining balance per month

### 5. Member Exit Rules (Article 8)

#### Resignation Process
1. Written request to Executive Committee
2. Executive Committee review and recommendation
3. General Assembly final decision
4. **Retention**: 20% of final amount remains with association
5. **Payout Period**: Maximum 2 months after accounting

#### Expulsion Criteria
- Non-compliance with statutes
- 3 consecutive months of missed contributions
- **Decision**: 2/3 majority of General Assembly
- **Same Financial Terms**: 20% retention applies

#### Death of Member
- Legal heirs can request funds or replacement
- Follows Rwandan inheritance laws
- Executive Committee review → General Assembly decision

### 6. Database Schema

#### Key Tables
- `users` - Member information with roles and member types
- `tontines` - The Future association details
- `contributions` - Monthly 20,000 RWF payments
- `loan_requests` - Loan applications with 1.7% interest
- `penalties` - Fine tracking system
- `member_exits` - Resignation/expulsion management
- `refunds` - Refund processing with 20% retention

### 7. API Endpoints

#### Penalties Management
```
POST /api/penalties/meeting-absence
POST /api/penalties/late-contribution
POST /api/penalties/late-meeting
POST /api/penalties/loan-default
GET /api/penalties/user/:userId
GET /api/penalties/tontine/:tontineId
POST /api/penalties/pay/:penaltyId
```

#### Member Management
```
POST /api/members/resign
POST /api/members/expel
GET /api/members/exit-requests/:tontineId
PUT /api/members/exit-request/:exitId
```

#### Enhanced Loan System
```
POST /api/loans (with 2/3 share limit and 1.7% interest)
POST /api/loans/:loanId/enforce-payment
```

### 8. Frontend Components

#### New Pages
- `/the-future` - Association-specific dashboard
- Enhanced `/payments` with Lanari integration
- Enhanced `/loans` with association rules

#### New Composables
- `useTheFuture.js` - Association-specific functions
- `usePayments.js` - Lanari payment integration
- `useLoans.js` - Loan management with rules

### 9. Lanari Payment Integration

#### Configuration
- **API Endpoint**: https://www.lanari.rw/lanari_pay/api/payment/process.php
- **Payout Number**: 0790989830 (all payments route here)
- **Currency**: RWF (Rwandan Francs)
- **Features**: Contributions, loan payments, refunds

### 10. Real-time Features
- Socket.io integration for live updates
- Real-time notifications for payments, loans, penalties
- Live dashboard updates for executives

### 11. Security & Compliance
- Role-based access control
- Executive Committee permissions
- Audit trails for all financial transactions
- Compliance with Rwandan laws

### 12. Usage Instructions

#### For Members
1. Register with ID number and phone
2. Pay monthly 20,000 RWF contributions
3. Request loans up to 2/3 of contributions
4. Pay penalties through Lanari Pay
5. Submit resignation requests if needed

#### For Executive Committee
1. Review and approve loan requests
2. Apply penalties for violations
3. Process member resignations/expulsions
4. Monitor association finances
5. Generate reports for General Assembly

#### For Auditors
1. Review financial records
2. Audit penalty applications
3. Verify loan calculations
4. Report to General Assembly

### 13. Deployment
1. Run database migration: `npm run migrate`
2. Start backend: `npm run dev`
3. Start frontend: `npm start`
4. Access The Future dashboard: `/the-future`

This implementation fully complies with "The Future" association's constitution and provides a complete digital platform for their savings and loan operations.