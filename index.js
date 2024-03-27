const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log('Forking a new worker...');
    cluster.fork();
  });
} else {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  const connection = mysql.createConnection({
    host: '45.112.49.217',
    user: 'root',
    password: 'password',
    database: 'aid'
  });
  // Connect to MySQL
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to database: ', err);
      return;
    }
    console.log('Connected to MySQL database.');
  });
  // Function to generate userID
  function generateUserID() {
    const timestamp = Date.now().toString(36);
    const randomChars = Math.random().toString(36).substring(2);
    const userID = timestamp + randomChars;
    return userID.substring(0, 28).padEnd(28, '0');
  }
//signup
app.post('/signup', (req, res) => {
  const {
    firstName,
    lastName,
    mobileNumber,
    email,
    password,
    dateOfBirth,
    age,
    gender,
    bloodGroup,
    address,
    emergencyContact1,
    emergencyContact2,
    emergencyContact3,
    alternateNumber,
    pincode,
    confirmPassword,
    coordinatesLatitude,
    coordinatesLongitude
  } = req.body;

  // Check if all required fields are provided
  if (!firstName || !lastName || !mobileNumber || !email || !password || !dateOfBirth || !age || !gender || !bloodGroup || !address || !emergencyContact1 || !emergencyContact2 || !emergencyContact3  || !alternateNumber || !pincode || !confirmPassword || !coordinatesLatitude || !coordinatesLongitude) {
      console.log(!firstName,!lastName,!mobileNumber, !email,!password,!dateOfBirth,!age , !gender , !bloodGroup , !address, !emergencyContact1 ,!emergencyContact2,!emergencyContact3 , !alternateNumber , !pincode , !confirmPassword , !coordinatesLatitude , !coordinatesLongitude);
      return res.status(400).send('All fields are required');
  }

  // Check if password and confirmPassword match
  if (password !== confirmPassword) {
    return res.status(400).send('Password and confirm password do not match');
  }
  // Generate 28-character userID
  const userID = generateUserID();
  console.log('Generated UserID:', userID);

  // Insert user details into NewProfileSignups table
  pool.query(
    'INSERT INTO signup (firstName, lastName, mobileNumber, email, password, dateOfBirth, age, gender, bloodGroup, address, userID, emergencyContact1,emergencyContact2,emergencyContact3,alternateNumber, pincode, coordinatesLatitude, coordinatesLongitude , confirmPassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)',
    [firstName, lastName, mobileNumber, email, password, dateOfBirth, age, gender, bloodGroup, address, userID,emergencyContact1,emergencyContact2,emergencyContact3, alternateNumber, pincode, coordinatesLatitude, coordinatesLongitude , confirmPassword],
    (error, results) => {
      if (error) {
        console.error('Error inserting user details into signup:', error);
        return res.status(500).send('Internal Server Error');
      }
      res.status(201).json({ message: 'Account created successfully', userID });
    }
  );
});
  // Login route
  app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM signup WHERE email = ? AND password = ?';
    req.mysql.query(query, [email, password], (err, results) => {
      if (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ message: 'Invalid email or password' });
      } else {
        res.status(200).json({ message: 'Login successful', user: results[0] });
      }
    });
  });

  // Route to get all users
  app.get('/users', (req, res) => {
    const query = 'SELECT * FROM signup';
    req.mysql.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      res.status(200).json(results);
    });
  });

  // Route to get a user by email
  app.get('/user/:email', (req, res) => {
    const userEmail = req.params.email;
    const query = 'SELECT * FROM NewProfileSignups WHERE email = ?';
    req.mysql.query(query, [userEmail], (err, results) => {
      if (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      if (results.length === 0) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.status(200).json(results[0]);
      }
    });
  });
// View profile page
app.get('/profile/:email', (req, res) => {
  const userEmail = req.params.email;
  const query = 'SELECT * FROM signup WHERE email = ?';
  connection.query(query, [userEmail], (err, results) => {
      if (err) {
          console.error('Error fetching user profile:', err);
          res.status(500).json({ message: 'Internal server error' });
          return;
      }
      if (results.length === 0) {
          res.status(404).json({ message: 'User not found' });
      } else {
          res.status(200).json(results[0]);
      }
  });
});
// change password
let userData = {
  username: 'user',
  password: 'password' 
};
app.post('/change-password', (req, res) => {
  try {
      const { oldPassword, newPassword, confirmPassword } = req.body;

      if (!oldPassword || !newPassword || !confirmPassword) {
          return res.status(400).json({ error: "Old password, new password, and confirm password are required" });
      }

      if (newPassword !== confirmPassword) {
          return res.status(400).json({ error: "New password and confirm password don't match" });
      }

      if (userData.password !== oldPassword) {
          return res.status(400).json({ error: "Old password is incorrect" });
      }

      userData.password = newPassword;
      console.log("Password changed successfully");

      res.json({ message: 'Password changed successfully' });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err);
    return;
  }
  console.log('Connected to MySQL database.');
});
// Define the validateFields middleware functionfunction validateFields(req, res, next) {
  function validateFields(req, res, next) {
    const { Name, mobileNumber, place, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;
    if (!Name || !mobileNumber || !place || !pincode || !status || !coordinatesLatitude || !coordinatesLongitude) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    // If all fields are present, call next() to proceed to the next middleware/route handler
    next();
  }
// POST endpoint to handle blood checkup creation
function validateFields(req, res, next) {
  const { Name, mobileNumber, place, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;
  if (!Name || !mobileNumber || !place || !pincode || !status || !coordinatesLatitude || !coordinatesLongitude) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  next();
}
}
app.post('/bloodcheckup', validateFields, (req, res) => {
  const { Name, mobileNumber, place, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;

  // Insert blood checkup data into the database
  pool.query(
    'INSERT INTO bloodCheckup (name, mobileNumber, place, status, pincode, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [Name, mobileNumber, place, status, pincode, coordinatesLatitude, coordinatesLongitude],
    (error, result) => {
      if (error) {
        console.error('Error inserting details into bloodCheckup:', error);
        return res.status(500).send('Internal Server Error');
      }
  
      // Retrieve the auto-generated userId and send response
      const userId = result.insertId;
      res.status(201).json({ userId, message: 'Blood checkup created successfully' });
    }
  );
});

// GET endpoint to retrieve blood checkup by ID
app.get('/bloodcheckup/:id', (req, res) => {
  const id = req.params.id;


  pool.query('SELECT * FROM bloodCheckup WHERE id = ?', id, (err, results) => {
    if (err) {
      console.error('Error retrieving blood checkup:', err);
      return res.status(500).json({ message: 'Error retrieving blood checkup' });
    }

    // If blood checkup not found, return 404
    if (results.length === 0) {
      return res.status(404).json({ message: 'Blood checkup not found' });
    }

    // Send the retrieved blood checkup data in the response
    const bloodCheckup = results[0];
    res.json(bloodCheckup);
  });
});

/// Blood Requirements

app.post('/blood-requirements', async (req, res) => {
  const { userId, patientName, date, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, coordinatesLatitude, coordinatesLongitude } = req.body;

  if (!userId || !patientName || !date || !bloodType || !mobileNumber || !hospitalName || !hospitalAddress || !purposeOfBlood || !pincode || !coordinatesLatitude || !coordinatesLongitude) {
      return res.status(400).send('All fields are required');
  }

  try {
      // Insert blood requirement into BloodRequirement table
      await pool.query(
          'INSERT INTO BloodRequirement (userId, patientName, date, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, patientName, date, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, coordinatesLatitude, coordinatesLongitude]
      );
      res.status(201).send('Blood requirement created');
  } catch (error) {
      console.error('Error creating blood requirement:', error);
      res.status(500).send('Internal Server Error');
  }
});
app.get('/blood-requirements', async (req, res) => {
  try {
      // Retrieve all blood requirements from BloodRequirement table
      const bloodRequirements = await pool.query('SELECT * FROM BloodRequirement');
      res.json(bloodRequirements);
  } catch (error) {
      console.error('Error retrieving blood requirements:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Callback requests
let callbacks = [];

app.post('/callback', (req, res) => {
    const { Date, Time, mobileNumber, subject, topictospeakabout } = req.body;

    if (!Date || !Time || !mobileNumber || !subject || !topictospeakabout) {
        return res.status(400).send('All fields are required');
    }

    // Here you can handle the callback request data as per your requirement
    callbacks.push({ Date, Time, mobileNumber, subject, topictospeakabout });

    res.status(201).send('Callback request received');
});

app.get('/callbacks', (req, res) => {
    res.json(callbacks);
});
//  emergency contacts
// Initialize emergencyContacts as an object
let emergencyContacts = {};

// Handle adding emergency contacts
const pool = mysql.createPool({
  host: '45.112.49.217',
  port:3306,
  user: 'root',
  password: 'password',
  database: 'aid',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Endpoint to add emergency contact
app.post('/add-contact/:person', (req, res) => {
  const userId = req.params.person;
  const { name, relation, mobilenumber } = req.body;

  if (!name || !relation || !mobilenumber) {
      return res.status(400).json({ error: 'Name, Relation, and Phone Number are required' });
  }

  // Insert contact information into MySQL database
  const query = 'INSERT INTO EmergencyContacts (userId, name, relation, mobilenumber) VALUES (?, ?, ?, ?)';
  pool.query(query, [userId, name, relation, mobilenumber], (err, results) => {
      if (err) {
          console.error('Error adding emergency contact:', err);
          return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json({ message: `Emergency contact added for ${userId}` });
  });
});

// Retrieve emergency contacts for a person
app.get('/contacts/:person', (req, res) => {
    const person = req.params.person;

    // Check if the person exists in emergencyContacts and if they have any emergency contacts
    if (!emergencyContacts[person] || emergencyContacts[person].length === 0) {
        return res.status(404).json({ error: 'Person not found or no emergency contacts available' });
    }

    // Return the emergency contacts for the specified person
    res.json(emergencyContacts[person]);
});


//report an issue
app.post('/report', (req, res) => {
  const { Date, Time, email, mobileNumber, subject, explaininBrief } = req.body;

  if (!Date || !Time || !email || !mobileNumber || !subject || !explaininBrief) {
      return res.status(400).send('All fields are required');
  }

  // Validate date 
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(Date)) {
      return res.status(400).send('Invalid date format. Date should be in YYYY-MM-DD format');
  }

  // Validate time 
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(Time)) {
      return res.status(400).send('Invalid time format. Time should be in HH:MM format (24-hour)');
  }

  // Validate email
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
      return res.status(400).send('Invalid email format');
  }

  // Validate mobile number 
  const mobileNumberRegex = /^\d{10}$/;
  if (!mobileNumberRegex.test(mobileNumber)) {
      return res.status(400).send('Invalid mobile number format. Please enter a 10-digit number without spaces or special characters.');
  }
  const dateTime = new Date(`${Date}T${Time}`);
  const DateTime = `${dateTime.toDateString()} ${dateTime.toLocaleTimeString()}`;

  console.log('Received report:');
  console.log('Date:', Date);
  console.log('Time:', Time);
  console.log('Email:', email);
  console.log('Mobile Number:', mobileNumber);
  console.log('Subject:', subject);
  console.log('Explanation:', explaininBrief);

  res.status(201).send('Report submitted successfully!');
});

app.get('/report', (req, res) => {
  const { Date, Time, email, mobileNumber, subject, explaininBrief } = req.query;
  res.send(`Received report request with parameters:
  Date: ${Date}
  Time: ${Time}
  Email: ${email}
  Mobile Number: ${mobileNumber}
  Subject: ${subject}
  Explain in Brief: ${explaininBrief}`);
});

//anonymous report

// Function to insert anonymous report data into the database

function insertAnonymousReport(reportData) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO AnonymousReports (date, time, placeOfIncident, subject, explaininBrief) VALUES (?, ?, ?, ?, ?)';
    pool.query(query, [reportData.Date, reportData.Time, reportData.placeOfIncident, reportData.subject, reportData.explaininBrief], (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

app.post('/anonymousreport', (req, res) => {
  const { Date, Time, placeOfIncident, subject, explaininBrief } = req.body;

  if (!Date || !Time || !placeOfIncident || !subject || !explaininBrief) {
    return res.status(400).send('All fields are required');
  }

  // Validate date
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(Date)) {
    return res.status(400).send('Invalid date format. Date should be in YYYY-MM-DD format');
  }

  // Validate time
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(Time)) {
    return res.status(400).send('Invalid time format. Time should be in HH:MM format (24-hour)');
  }

  // Insert report data into the database
  insertAnonymousReport(req.body)
    .then(() => {
      console.log('Anonymous report submitted successfully');
      res.status(201).send('Report submitted successfully!');
    })
    .catch(error => {
      console.error('Error submitting anonymous report:', error);
      res.status(500).send('Internal Server Error');
    });
});

app.get('/anonymousreports', (req, res) => {
  pool.query('SELECT * FROM AnonymousReports', (err, results) => {
    if (err) {
      console.error('Error retrieving anonymous reports:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.json(results);
  });
});

// blood emergency
let bloodEmergencyRequests = [];

app.post('/blood-emergency', (req, res) => {
    const {
        patientName,
        bloodType,
        mobileNumber,
        hospitalName,
        hospitalAddress,
        location,
        pincode,
        purposeOfBlood,
    } = req.body;

    if (!patientName || !bloodType || !mobileNumber || !hospitalName || !hospitalAddress || !location || !pincode || !purposeOfBlood) {
        return res.status(400).send('All fields are required');
    }
    const request = {
        patientName,
        bloodType,
        mobileNumber,
        hospitalName,
        hospitalAddress,
        location,
        pincode,
        purposeOfBlood,
        timestamp: new Date().toISOString() 
    };
    bloodEmergencyRequests.push(request);

    res.status(201).send('Blood emergency request submitted successfully!');
});

app.get('/blood-emergency', (req, res) => {
    res.json(bloodEmergencyRequests);
});

app.listen(3000, () => {
    console.log(`Worker ${process.pid} started and listening on port 3000`);
  });
