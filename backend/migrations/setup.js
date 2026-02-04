/*  */const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function setupDatabase() {
  let connection;
  
  try {
    // Connect to MySQL server
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    console.log('Connected to MySQL server');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`Database "${process.env.DB_NAME}" created or already exists`);
    
    await connection.end();

    // Connect to the specific database
    connection = await mysql.createConnection(dbConfig);
    console.log(`Connected to ${process.env.DB_NAME} database`);

    // Drop existing tables in correct order
    const dropTables = [
      'DROP TABLE IF EXISTS meeting_attendance',
      'DROP TABLE IF EXISTS meetings',
      'DROP TABLE IF EXISTS penalties',
      'DROP TABLE IF EXISTS notifications',
      'DROP TABLE IF EXISTS loan_payments',
      'DROP TABLE IF EXISTS loan_requests',
      'DROP TABLE IF EXISTS contributions',
      'DROP TABLE IF EXISTS tontine_members',
      'DROP TABLE IF EXISTS tontines',
      'DROP TABLE IF EXISTS users'
    ];

    for (const query of dropTables) {
      await connection.execute(query);
    }
    console.log('Existing tables dropped');

    // Create users table with all verification fields
    await connection.execute(`
      CREATE TABLE users (
        id int(11) NOT NULL AUTO_INCREMENT,
        names varchar(100) NOT NULL,
        email varchar(100) NOT NULL UNIQUE,
        password varchar(255) NOT NULL,
        phone varchar(20) NOT NULL,
        role enum('member','admin') DEFAULT 'member',
        email_verified tinyint(1) DEFAULT 0,
        verification_code varchar(6) DEFAULT NULL,
        verification_key varchar(64) DEFAULT NULL,
        verification_attempts int DEFAULT 0,
        id_number varchar(50) DEFAULT NULL,     
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id)
      )
    `);
    console.log('Users table created');

    // Create tontines table
    await connection.execute(`
      CREATE TABLE tontines (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        description text,
        contribution_amount decimal(10,2) NOT NULL DEFAULT 20000.00,
        contribution_frequency varchar(50) NOT NULL DEFAULT 'monthly',
        max_members int(11) NOT NULL DEFAULT 20,
        creator_id int(11) NOT NULL,
        start_date date,
        end_date date,
        status enum('active','inactive','completed') DEFAULT 'active',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        FOREIGN KEY (creator_id) REFERENCES users(id)
      )
    `);
    console.log('Tontines table created');

    // Create tontine_members table
    await connection.execute(`
      CREATE TABLE tontine_members (
        id int(11) NOT NULL AUTO_INCREMENT,
        tontine_id int(11) NOT NULL,
        user_id int(11) NOT NULL,
        shares int(11) DEFAULT 1,
        joined_at timestamp NOT NULL DEFAULT current_timestamp(),
        status enum('pending','approved','rejected') DEFAULT 'pending',
        PRIMARY KEY (id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('Tontine members table created');

    // Create contributions table
    await connection.execute(`
      CREATE TABLE contributions (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        tontine_id int(11) NOT NULL,
        amount decimal(10,2) NOT NULL DEFAULT 20000.00,
        payment_method varchar(100) NOT NULL DEFAULT 'mobile_money',
        contribution_date date DEFAULT (curdate()),
        transaction_ref varchar(255) NOT NULL,
        payment_status enum('Approved','Pending','Failed') DEFAULT 'Pending',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id)
      )
    `);
    console.log('Contributions table created');

    // Create loan_requests table
    await connection.execute(`
      CREATE TABLE loan_requests (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        tontine_id int(11) NOT NULL,
        amount decimal(10,2) NOT NULL,
        interest_rate decimal(5,2) NOT NULL DEFAULT 1.70,
        total_amount decimal(10,2) NOT NULL,
        repayment_period int DEFAULT 6,
        phone_number varchar(20) NOT NULL,
        status enum('Pending','Approved','Rejected','Disbursed','Repaid') DEFAULT 'Pending',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id)
      )
    `);
    console.log('Loan requests table created');

    // Create loan_payments table
    await connection.execute(`
      CREATE TABLE loan_payments (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        loan_id int(11) NOT NULL,
        amount decimal(10,2) NOT NULL,
        payment_method varchar(100) DEFAULT 'mobile_money',
        payment_date date DEFAULT (curdate()),
        payment_status enum('Pending','Approved','Failed') DEFAULT 'Pending',
        transaction_ref varchar(255) DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (loan_id) REFERENCES loan_requests(id)
      )
    `);
    console.log('Loan payments table created');

    // Create notifications table
    await connection.execute(`
      CREATE TABLE notifications (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) DEFAULT NULL,
        title varchar(255) NOT NULL,
        message text NOT NULL,
        type enum('success','error','info','warning') DEFAULT 'info',
        is_read tinyint(1) DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('Notifications table created');

    // Create penalties table
    await connection.execute(`
      CREATE TABLE penalties (
        id int(11) NOT NULL AUTO_INCREMENT,
        loan_id int(11) DEFAULT NULL,
        user_id int(11) NOT NULL,
        tontine_id int(11) NOT NULL,
        amount decimal(10,2) NOT NULL,
        reason text NOT NULL,
        status enum('pending','paid') DEFAULT 'pending',
        paid_at timestamp NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        FOREIGN KEY (loan_id) REFERENCES loan_requests(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id)
      )
    `);
    console.log('Penalties table created');

    // Create meetings table
    await connection.execute(`
      CREATE TABLE meetings (
        id int(11) NOT NULL AUTO_INCREMENT,
        tontine_id int(11) NOT NULL,
        title varchar(255) NOT NULL,
        description text,
        meeting_date datetime NOT NULL,
        location varchar(255),
        status enum('scheduled','completed','cancelled') DEFAULT 'scheduled',
        created_by int(11) NOT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('Meetings table created');

    // Create meeting_attendance table
    await connection.execute(`
      CREATE TABLE meeting_attendance (
        id int(11) NOT NULL AUTO_INCREMENT,
        meeting_id int(11) NOT NULL,
        user_id int(11) NOT NULL,
        status enum('present','absent','late','excused') DEFAULT 'absent',
        arrival_time timestamp NULL,
        excuse_reason text,
        penalty_applied tinyint(1) DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_attendance (meeting_id, user_id),
        FOREIGN KEY (meeting_id) REFERENCES meetings(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('Meeting attendance table created');

    // Insert default users from The Future leadership
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('future2024', 10);
    
    const leaders = [
      ['NDAGIJIMANA Florien', 'tabitakwizerisezerano@gmail.com', '0788570890', 'admin'], // President
      ['Dr. Athanase HATEGEKIMANA', 'kwizerisezerano@gmail.com', '0788738036', 'admin'], // V/President
      ['NIYONGOMBWA Didier', 'kwizerisezerano250@gmail.com', '0788602741', 'admin'], // Secretary/Accountant
      ['RUZIGANA Victor', 'victor@thefuture.com', '0788679876', 'member'], // Advisor
      ['HABIMANA Adolphe', 'adolphe@thefuture.com', '0788565026', 'member'], // Advisor
      ['KWIZERA Ivan', 'ivan@thefuture.com', '0788828128', 'member'], // Auditor President
      ['DUSABIMANA Edmond', 'edmond@thefuture.com', '0788786066', 'member'], // Auditor V/President
      ['NIYIRORA Jean Damascene', 'jean@thefuture.com', '0783107539', 'member'], // Auditor Secretary
      ['KAMANA Celestin', 'celestin@thefuture.com', '0788680791', 'member'],
      ['MUKWIYE Philippe', 'philippe@thefuture.com', '0784156785', 'member'],
      ['HABIMANA Jean Bosco', 'jeanbosco@thefuture.com', '0788616459', 'member'],
      ['UWIRINGIYIMANA Clement', 'clement@thefuture.com', '0784031935', 'member'],
      ['MUTABAZI Arsene', 'arsene@thefuture.com', '0788354338', 'member'],
      ['RUMANZI Aime', 'aime@thefuture.com', '0788474683', 'member'],
      ['HARERIMANA Germain', 'germain@thefuture.com', '0788532451', 'member']
    ];
    
    let creatorId = null;
    for (const [names, email, phone, role] of leaders) {
      const [result] = await connection.execute(
        `INSERT INTO users (names, email, password, phone, role, email_verified, created_at) 
         VALUES (?, ?, ?, ?, ?, 1, NOW())`,
        [names, email, defaultPassword, phone, role]
      );
      
      if (names === 'NDAGIJIMANA Florien') {
        creatorId = result.insertId; // President creates the tontine
      }
    }
    console.log('The Future leadership members created');

    // Insert default tontine "The Future" and add all members
    const [tontineResult] = await connection.execute(
      `INSERT INTO tontines (name, description, contribution_amount, contribution_frequency, 
       max_members, creator_id, start_date, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        'The Future',
        'Official tontine for The Future members - Founded at Runda on 14/01/2024',
        20000.00,
        'monthly',
        20,
        creatorId,
        '2024-01-14',
        'active'
      ]
    );
    const tontineId = tontineResult.insertId;
    console.log('Default tontine "The Future" created');

    // Add all leadership members to the tontine
    const [allUsers] = await connection.execute('SELECT id FROM users');
    for (const user of allUsers) {
      await connection.execute(
        `INSERT INTO tontine_members (tontine_id, user_id, joined_at, status) 
         VALUES (?, ?, NOW(), 'approved')`,
        [tontineId, user.id]
      );
    }
    console.log('All members added to The Future tontine');

    console.log('✅ Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();