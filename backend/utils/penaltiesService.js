
const cron = require('node-cron');

class PenaltiesService {
  constructor(db, io) {
    this.db = db;
    this.io = io;
    this.loanPenaltyRate = 0.10; // 10% of remaining balance per month
    this.contributionLateFee = 1000; // 1000 RWF for 10th-17th
    this.contributionPenalty = 200; // 200 RWF (1%) after 17th
    this.meetingAbsenceFee = 5000; // 5000 RWF for unexcused absence
    this.meetingLateFee = 1000; // 1000 RWF for being late
    
    // Import email service
    const { sendPenaltyEmail } = require('./email');
    this.sendPenaltyEmail = sendPenaltyEmail;
  }

  start() {
    // Check daily at 9 AM for overdue loans and contributions
    cron.schedule('0 9 * * *', () => {
      this.checkOverdueLoans();
      this.checkLateContributions();
    });

    // Check for upcoming due dates at 6 PM
    cron.schedule('0 18 * * *', () => {
      this.checkUpcomingDueDates();
    });

    // Check for upcoming meetings daily at 8 AM
    cron.schedule('0 8 * * *', () => {
      this.checkUpcomingMeetings();
    });

    console.log('The Future penalties automation started');
  }

  async checkOverdueLoans() {
    try {
      const [overdueLoans] = await this.db.execute(`
        SELECT lr.*, u.email, u.names, t.name as tontine_name,
               TIMESTAMPDIFF(MONTH, lr.created_at, NOW()) as months_since_loan,
               COALESCE(SUM(lp.amount), 0) as paid_amount
        FROM loan_requests lr
        JOIN users u ON lr.user_id = u.id
        JOIN tontines t ON lr.tontine_id = t.id
        LEFT JOIN loan_payments lp ON lr.id = lp.loan_id AND lp.payment_status = 'Approved'
        WHERE lr.status = 'Approved' 
        AND TIMESTAMPDIFF(MONTH, lr.created_at, NOW()) >= lr.repayment_period
        GROUP BY lr.id
        HAVING paid_amount < lr.total_amount
      `);

      for (const loan of overdueLoans) {
        const remainingAmount = loan.total_amount - loan.paid_amount;
        if (remainingAmount > 0) {
          await this.applyLoanPenalty(loan, remainingAmount);
        }
      }
    } catch (error) {
      console.error('Check overdue loans error:', error);
    }
  }

  async checkLateContributions() {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const currentDay = new Date().getDate();

      if (currentDay >= 10) {
        const [lateMembers] = await this.db.execute(`
          SELECT u.id, u.names, u.email, tm.tontine_id, t.name as tontine_name
          FROM users u
          JOIN tontine_members tm ON u.id = tm.user_id
          JOIN tontines t ON tm.tontine_id = t.id
          WHERE tm.status = 'approved' AND t.status = 'active'
          AND u.id NOT IN (
            SELECT c.user_id FROM contributions c 
            WHERE MONTH(c.contribution_date) = ? AND YEAR(c.contribution_date) = ?
            AND c.payment_status = 'Approved'
          )
        `, [currentMonth, currentYear]);

        for (const member of lateMembers) {
          await this.applyContributionPenalty(member, currentDay);
        }
      }
    } catch (error) {
      console.error('Check late contributions error:', error);
    }
  }

  async checkUpcomingDueDates() {
    try {
      // Check loans due in 3 days
      const [upcomingLoans] = await this.db.execute(`
        SELECT lr.*, u.email, u.names, t.name as tontine_name,
               COALESCE(SUM(lp.amount), 0) as paid_amount
        FROM loan_requests lr
        JOIN users u ON lr.user_id = u.id
        JOIN tontines t ON lr.tontine_id = t.id
        LEFT JOIN loan_payments lp ON lr.id = lp.loan_id AND lp.payment_status = 'Approved'
        WHERE lr.status = 'Approved'
        AND DATEDIFF(DATE_ADD(lr.created_at, INTERVAL lr.repayment_period MONTH), NOW()) <= 3
        AND DATEDIFF(DATE_ADD(lr.created_at, INTERVAL lr.repayment_period MONTH), NOW()) > 0
        GROUP BY lr.id
        HAVING paid_amount < lr.total_amount
      `);

      for (const loan of upcomingLoans) {
        const remainingAmount = loan.total_amount - loan.paid_amount;
        if (remainingAmount > 0) {
          await this.sendLoanWarning(loan, remainingAmount);
        }
      }

      // Check contribution due dates (warn on 8th of month)
      const currentDay = new Date().getDate();
      if (currentDay === 8) {
        await this.sendContributionReminder();
      }
    } catch (error) {
      console.error('Check upcoming due dates error:', error);
    }
  }

  async applyLoanPenalty(loan, remainingAmount) {
    try {
      const penaltyAmount = remainingAmount * this.loanPenaltyRate; // 10% of remaining balance

      // Check if penalty already applied this month
      const [existingPenalty] = await this.db.execute(
        'SELECT id FROM penalties WHERE loan_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())',
        [loan.id]
      );

      if (existingPenalty.length === 0) {
        await this.db.execute(
          `INSERT INTO penalties (loan_id, user_id, amount, reason, status, created_at) 
           VALUES (?, ?, ?, ?, 'pending', NOW())`,
          [loan.id, loan.user_id, penaltyAmount, 'Overdue loan payment - 10% monthly penalty']
        );

        await this.db.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [loan.user_id, 'Loan Penalty Applied', 
           `A penalty of RWF ${penaltyAmount.toLocaleString()} (10% of remaining balance) has been applied for overdue loan payment.`, 
           'warning']
        );

        this.io.to(`user-${loan.user_id}`).emit('penalty-applied', {
          type: 'loan',
          amount: penaltyAmount,
          reason: 'Overdue loan payment',
          timestamp: new Date()
        });

        // Send penalty email
        await this.sendPenaltyEmail(loan.email, {
          userName: loan.names,
          amount: penaltyAmount.toLocaleString(),
          reason: 'Overdue loan payment - 10% monthly penalty'
        });
      }
    } catch (error) {
      console.error('Apply loan penalty error:', error);
    }
  }

  async applyContributionPenalty(member, currentDay) {
    try {
      let penaltyAmount, reason;
      
      if (currentDay >= 10 && currentDay <= 17) {
        penaltyAmount = this.contributionLateFee; // 1000 RWF
        reason = 'Late contribution payment (10th-17th)';
      } else if (currentDay > 17) {
        penaltyAmount = this.contributionPenalty; // 200 RWF (1%)
        reason = 'Late contribution payment (after 17th)';
      }

      // Check if penalty already applied this month
      const [existingPenalty] = await this.db.execute(
        'SELECT id FROM penalties WHERE user_id = ? AND reason LIKE "%contribution%" AND MONTH(created_at) = MONTH(NOW())',
        [member.id]
      );

      if (existingPenalty.length === 0 && penaltyAmount) {
        await this.db.execute(
          `INSERT INTO penalties (user_id, amount, reason, status, created_at) 
           VALUES (?, ?, ?, 'pending', NOW())`,
          [member.id, penaltyAmount, reason]
        );

        await this.db.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [member.id, 'Contribution Penalty', 
           `A penalty of RWF ${penaltyAmount.toLocaleString()} has been applied for late monthly contribution.`, 
           'warning']
        );

        this.io.to(`user-${member.id}`).emit('penalty-applied', {
          type: 'contribution',
          amount: penaltyAmount,
          reason,
          timestamp: new Date()
        });

        // Send penalty email
        await this.sendPenaltyEmail(member.email, {
          userName: member.names,
          amount: penaltyAmount.toLocaleString(),
          reason: reason
        });
      }
    } catch (error) {
      console.error('Apply contribution penalty error:', error);
    }
  }

  async sendLoanWarning(loan, remainingAmount) {
    try {
      const [existingWarning] = await this.db.execute(
        `SELECT id FROM notifications 
         WHERE user_id = ? AND title = 'Loan Payment Due Soon' 
         AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`,
        [loan.user_id]
      );

      if (existingWarning.length === 0) {
        await this.db.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [loan.user_id, 'Loan Payment Due Soon', 
           `Your loan payment of RWF ${remainingAmount.toLocaleString()} is due soon. Pay now to avoid 10% monthly penalty.`, 
           'warning']
        );

        this.io.to(`user-${loan.user_id}`).emit('payment-warning', {
          type: 'loan',
          amount: remainingAmount,
          message: 'Loan payment due soon',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Send loan warning error:', error);
    }
  }

  async sendContributionReminder() {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [membersWithoutContribution] = await this.db.execute(`
        SELECT u.id, u.names, u.email
        FROM users u
        JOIN tontine_members tm ON u.id = tm.user_id
        JOIN tontines t ON tm.tontine_id = t.id
        WHERE tm.status = 'approved' AND t.status = 'active'
        AND u.id NOT IN (
          SELECT c.user_id FROM contributions c 
          WHERE MONTH(c.contribution_date) = ? AND YEAR(c.contribution_date) = ?
          AND c.payment_status = 'Approved'
        )
      `, [currentMonth, currentYear]);

      for (const member of membersWithoutContribution) {
        await this.db.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [member.id, 'Monthly Contribution Reminder', 
           'Your monthly contribution of RWF 20,000 is due by the 10th. Late payments incur penalties.', 
           'info']
        );

        this.io.to(`user-${member.id}`).emit('contribution-reminder', {
          amount: 20000,
          dueDate: '10th of the month',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Send contribution reminder error:', error);
    }
  }

  async checkUpcomingMeetings() {
    try {
      // Check meetings in next 24 hours
      const [upcomingMeetings] = await this.db.execute(`
        SELECT m.*, t.name as tontine_name
        FROM meetings m
        JOIN tontines t ON m.tontine_id = t.id
        WHERE m.status = 'scheduled'
        AND m.meeting_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
      `);

      for (const meeting of upcomingMeetings) {
        await this.sendMeetingReminder(meeting);
      }
    } catch (error) {
      console.error('Check upcoming meetings error:', error);
    }
  }

  async sendMeetingReminder(meeting) {
    try {
      const [members] = await this.db.execute(
        'SELECT user_id FROM tontine_members WHERE tontine_id = ? AND status = "approved"',
        [meeting.tontine_id]
      );

      const meetingTime = new Date(meeting.meeting_date).toLocaleString();

      for (const member of members) {
        // Check if reminder already sent today
        const [existingReminder] = await this.db.execute(
          `SELECT id FROM notifications 
           WHERE user_id = ? AND title = 'Meeting Reminder' 
           AND message LIKE '%${meeting.title}%'
           AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`,
          [member.user_id]
        );

        if (existingReminder.length === 0) {
          await this.db.execute(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [member.user_id, 'Meeting Reminder', 
             `Reminder: "${meeting.title}" meeting tomorrow at ${meetingTime}. Location: ${meeting.location}. Absence penalty: RWF 5,000.`, 
             'info']
          );

          this.io.to(`user-${member.user_id}`).emit('meeting-reminder', {
            meetingId: meeting.id,
            title: meeting.title,
            meetingDate: meeting.meeting_date,
            location: meeting.location,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Send meeting reminder error:', error);
    }
  }
}

module.exports = PenaltiesService;