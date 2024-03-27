const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const express = require('express');
const multer = require('multer');
const uuid = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const upload = multer({ dest: 'uploads/' });
const { log } = require('console');
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
}
  // Middleware
  app.use(cors());
  app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
  app.use(bodyParser.json());
  // mysql connection
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

  // Middleware to parse JSON bodies
  app.use(express.json());

  // Generating the userID
  function generateUserID() {
    const timestamp = Date.now().toString(36);
    const randomChars = Math.random().toString(36).substring(2);
    const userID = timestamp + randomChars;
    return userID.substring(0, 28).padEnd(28, '0');
  }

  // Signup route
  
  app.post('/signup', (req, res, next) => {
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
  
    const photo = req.file ? req.file.buffer : null;
    // Check if all required fields are provided
    if (!firstName || !lastName || !mobileNumber || !email || !password || !dateOfBirth || !age || !gender || !bloodGroup || !address || !emergencyContact1 || !emergencyContact2 || !alternateNumber || !pincode || !confirmPassword || !coordinatesLatitude || !coordinatesLongitude) {
      return res.status(400).send('All fields are required');
    }
  
    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(400).send('Password and confirm password do not match');
    }
  
    // Generate 28-character userID
    const userID = generateUserID();
    console.log('Generated UserID:', userID);
  
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to database:', err);
        return res.status(500).send('Internal Server Error');
      }
  
      // Use the connection variable here
      connection.query(
        'INSERT INTO users (firstName, lastName, mobileNumber, email, dateOfBirth, age, gender, bloodGroup, address, photo, userID, alternateNumber, pincode, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [firstName, lastName, mobileNumber, email, dateOfBirth, age, gender, bloodGroup, address, photo, userID, alternateNumber, pincode, coordinatesLatitude, coordinatesLongitude],
        (error, results) => {
            connection.release();

            if (error) {
                console.error('Error inserting user details into users:', error);
                return res.status(500).send('Internal Server Error');
            }

          // Insert emergency contact information into emergencyContacts table
          const emergencyContactData = [];
  
          if (emergencyContact1) {
            emergencyContactData.push({
              name: emergencyContact1.name,
              relation: emergencyContact1.relation,
              mobileNumber: emergencyContact1.mobileNumber
            });
          }
  
          if (emergencyContact2) {
            emergencyContactData.push({
              name: emergencyContact2.name,
              relation: emergencyContact2.relation,
              mobileNumber: emergencyContact2.mobileNumber
            });
          }
          if (emergencyContact3) {
            emergencyContactData.push({
              name: emergencyContact2.name,
              relation: emergencyContact2.relation,
              mobileNumber: emergencyContact2.mobileNumber
            });
          }
          
          // Check if there are less than 2 emergency contacts or more than 3
if (emergencyContactData.length < 2 || emergencyContactData.length > 3) {
    return res.status(400).json({ error: 'At least two and no more than three emergency contacts are required' });
  }
// Insert emergency contact information into emergencyContacts table
const emergencyContactPromises = emergencyContactData.map((contact) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO emergencyContacts (userId, name, relation, mobileNumber) VALUES (?, ?, ?, ?)';
        connection.query(query, [userID, contact.name, contact.relation, contact.mobileNumber], (error, results) => {
            if (error) {
                console.error('Error inserting emergency contact:', error);
                reject(error);
            }
            resolve(results);
        });
    });
});
          Promise.all(emergencyContactPromises)
            .then(() => {
              res.status(201).json({ message: 'Account created successfully', userID });
            })
            .catch((error) => {
              console.error('Error inserting emergency contacts:', error);
              return res.status(500).json({ error: 'Internal server error' });
            });
        }
      );
    });
  });

  // Login route
  app.post('/login', (req, res) => {
    const { identifier, password } = req.body;
    const query = 'SELECT * FROM users WHERE (email = ? OR mobileNumber = ?) AND password = ?';
    connection.query(query, [identifier, identifier, password], (err, results) => {
      if (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      if (results.length === 0) {
        res.status(401).json({ message: 'Invalid email/phone number or password' });
      } else {
        res.status(200).json({ message: 'Login successful', user: results[0] });
      }
    });
});


  // Retrieve emergency contacts for a person
  app.get('/contacts', (req, res) => {
    const userId = req.header('userId');  // Extract the id parameter from the request URL
  
    // Query the database to retrieve emergency contacts for the specified person ID
    connection.query('SELECT * FROM emergencyContacts WHERE userId = ?', userId, (error, results) => {
      if (error) {
        console.error('Error retrieving emergency contacts:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      // Check if any emergency contacts were found for the specified person ID
      if (results.length === 0) {
        return res.status(404).json({ error: 'Person not found or no emergency contacts available' });
      }
      // Return the emergency contacts for the specified person ID
      res.json(results);
    });
});
// Define the validateFields middleware function
function validateFields(req, res, next) {
  const { userId, name, mobileNumber, place, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;
  if (!userId||!name || !mobileNumber || !place || !pincode || !status || !coordinatesLatitude || !coordinatesLongitude) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  next();
}
// POST endpoint to handle blood checkup creation
app.post('/bloodcheckup', validateFields, (req, res, next) => {
  // Destructure fields from request body
  const { userId, name, mobileNumber, place, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;
  
  // Check if any required field is missing
  if (!userId || !name || !mobileNumber || !place || !pincode || !status || !coordinatesLatitude || !coordinatesLongitude) {
    console.log('All fields are required');
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Log the data being written
  console.log('Data being written to bloodCheckup table:', {
    userId,
    name,
    mobileNumber,
    place,
    pincode,
    status,
    coordinatesLatitude,
    coordinatesLongitude
  });

  // Generate unique Id with 8 characters
  const Id = uuid.v4().substring(0, 8);

  // Insert blood checkup data into the database
  connection.query(
    'INSERT INTO bloodCheckup (Id, userId, name, mobileNumber, place, status, pincode, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [Id, userId, name, mobileNumber, place, status, pincode, coordinatesLatitude, coordinatesLongitude],
    (error, result) => {
      if (error) {
        console.error('Error inserting details into bloodCheckup:', error);
        return res.status(500).send('Internal Server Error');
      }
      // Send response with the generated Id
      res.status(201).json({ Id, message: 'Blood checkup created successfully' });
    }
  );
});
// list of all bloodcheckups
app.get('/bloodcheckup/:id?', (req, res) => {
  console.log('entered');
  const userId = req.header('userId'); // Extract the userId from request headers

  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }

  // Retrieve blood checkups based on ID if provided, otherwise retrieve all blood checkups
  if (req.params.id) {
    console.log('true');
    // Fetch a single blood checkup report based on the provided ID
    connection.query('SELECT * FROM bloodCheckup WHERE userId = ?', req.params.id, (error, results) => {
      if (error) {
        console.error('Error retrieving blood checkup report:', error);
        return res.status(500).send('Internal Server Error');
      }
      // Check if the blood checkup report with the specified ID was found
      if (results.length === 0) {
        return res.status(404).json({ message: 'Blood checkup report not found' });
      }
      // Send the retrieved blood checkup report as a JSON response
      res.json(results[0]);
    });
  } else {
    console.log('false');
    // Fetch all blood checkup reports
    connection.query('SELECT * FROM bloodCheckup', (error, results) => {
      if (error) {
        console.error('Error retrieving blood checkup reports:', error);
        return res.status(500).send('Internal Server Error');
      }
      // Send all retrieved blood checkup reports as a JSON response
      res.json(results);
    });
  }
});

  // anonymous report
  function insertanonymousReport(reportData) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO anonymousReport (userId,date, time, placeOfIncident, subject, explaininBrief,coordinatesLatitude,coordinatesLongitude, status) VALUES (?, ?, ?, ?, ?,?, ?, ?, ?)';
      connection.query(query, [reportData.userId,reportData.date, reportData.time, reportData.placeOfIncident, reportData.subject, reportData.explaininBrief, reportData.coordinatesLatitude, reportData.coordinatesLongitude , reportData.status], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }
  // post anonymous reports
  app.post('/anonymousreport', (req, res) => {
    console.log(JSON.stringify(req.body));
      const { userId, date, time, placeOfIncident, subject, explainInBreif, coordinatesLatitude, coordinatesLongitude, status } = req.body;
    
      // Validate if all fields are provided
      if (!userId || !date || !time || !placeOfIncident || !subject || !explainInBreif || !coordinatesLatitude || !coordinatesLongitude || !status) {
        
        return res.status(400).send('All fields are required');
      }
    
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        console.log('Invalid date format');
        return res.status(400).send('Invalid date format. Date should be in YYYY-MM-DD format');
      }
    
      // Validate time format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        console.log('Invalid time format');
        return res.status(400).send('Invalid time format. Time should be in HH:MM format (24-hour)');
      }
    
      // Generate unique 8-character ID
      const Id = uuid.v4().substring(0, 8);
    
      // Insert report data into the database
      connection.query(
        'INSERT INTO anonymousReport (Id, userId, date, time, placeOfIncident, subject, explainInBreif, coordinatesLatitude, coordinatesLongitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [Id, userId, date, time, placeOfIncident, subject, explainInBreif, coordinatesLatitude, coordinatesLongitude, status],
        (error, result) => {
          if (error) {
            console.error('Error inserting details into anonymousReport:', error);
            return res.status(500).send('Internal Server Error');
          }
          console.log('Anonymous report submitted successfully');
          res.status(201).send('Report submitted successfully!');
        }
      );
  });
  app.get('/anonymousreport', (req, res) => {
    const userId = req.header('userId'); // Extract the userId from request headers
    if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
    }
    connection.query('SELECT * FROM anonymousReport WHERE userId = ?', userId, (err, results) => {
      if (err) {
        console.error('Error retrieving anonymous reports:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.json(results);
    });
  });
  // fetch anonymous data of all the users 
  app.get('/anonymousreports/:id?', (req, res) => {
    console.log('entered');
    const userId = req.header('userId'); // Extract the userId from request headers
    // Check if userId header is missing or empty
    if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
    }
    // If an ID is provided in the URL, fetch a single anonymous report by that ID
    if (req.params.id) {
      console.log('true');
      connection.query('SELECT * FROM anonymousReport WHERE id = ?', req.params.id, (error, results) => {
        if (error) {
          console.error('Error retrieving anonymous report:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
        res.json(results);
      });
    } else {
      console.log('false');
      // If no ID is provided, retrieve all anonymous reports
      connection.query('SELECT * FROM anonymousReport', (error, results) => {
        if (error) {
          console.error('Error retrieving anonymous reports:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
        res.json(results);
      });
    }
  });
  // bloodemergency
app.post('/blood-emergency', (req, res) => {
  console.log(JSON.stringify(req.body));
    const {
        userId,
        patientName,
        bloodType,
        mobileNumber,
        hospitalName,
        hospitalAddress,
        location,
        pincode,
        purposeOfBlood,
        coordinatesLatitude,
        coordinatesLongitude,
        status
    } = req.body;

    const Id = uuid.v4().substring(0, 8); 
    if (!userId || !patientName || !bloodType || !mobileNumber || !hospitalName || !hospitalAddress || !location || !pincode || !purposeOfBlood || !coordinatesLatitude || !coordinatesLongitude || !status) {
        return res.status(400).send('All fields are required');
    }

    // Insert blood emergency request into the database
    const query = 'INSERT INTO bloodEmergency (Id, userId, patientName, bloodType, mobileNumber, hospitalName, hospitalAddress, location, pincode, purposeOfBlood, coordinatesLatitude, coordinatesLongitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [Id, userId, patientName, bloodType, mobileNumber, hospitalName, hospitalAddress, location, pincode, purposeOfBlood, coordinatesLatitude, coordinatesLongitude, status];
    
    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error inserting blood emergency request:', error);
            return res.status(500).send('Internal Server Error');
        }
        res.status(201).send('Blood emergency request submitted successfully!');
    });
});

app.get('/blood-emergency', (req, res) => {
  const userId = req.header('userId');  // Extract the userId from query parameters
  if (!userId) {
    return res.status(400).json({ message: 'userId parameter is required' });
  }
  // Query the database to retrieve blood emergency data for the specified userId
  connection.query('SELECT * FROM bloodEmergency WHERE userId = ?', userId, (err, results) => {
    if (err) {
      console.error('Error retrieving blood emergency:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.json(results);
  });
});
//list of all the bloodemergency
app.get('/bloodEmergency/:userId?', (req, res) => {
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  
  // If userId is provided in the URL, retrieve blood emergency reports for that user
  if (req.params.userId) {
    const userIdParam = req.params.userId;
    // Prepare the SQL query to select blood emergency reports for the specified userId
    const query = 'SELECT * FROM bloodEmergency WHERE userId = ?';
    // Execute the query with the userId parameter
    connection.query(query, userIdParam, (err, results) => {
      if (err) {
        console.error('Error fetching blood emergency reports:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.status(200).json(results);
    });
  } else {
    // If userId is not provided in the URL, retrieve all blood emergency reports
    // Prepare the SQL query to select all data from the bloodEmergency table
    const query = 'SELECT * FROM bloodEmergency';
    // Execute the query
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching blood emergency reports:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.status(200).json(results);
    });
  }
});

// blood requirements
app.post('/blood-requirements', async (req, res) => {
  console.log(JSON.stringify(req.body));
  const { userId, patientName, date, time, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;

  // Generate unique Id
  const Id = uuid.v4().substring(0, 8); // Generating unique Id and extracting first 8 characters

  // Check if all required fields are provided
  if (!userId || !patientName || !date || !time || !bloodType || !mobileNumber || !hospitalName || !hospitalAddress || !purposeOfBlood || !pincode || !status || !coordinatesLatitude || !coordinatesLongitude) {
    return res.status(400).send('All fields are required');
  }
  try {
    // Insert blood requirement into BloodRequirement table
    await new Promise((resolve, reject) => {
      connection.query(
        'INSERT INTO bloodRequirement (Id, userId, patientName, date, time, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, status, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [Id, userId, patientName, date, time, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, status, coordinatesLatitude, coordinatesLongitude],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
    res.status(201).send('Blood requirement created');
  } catch (error) {
    console.error('Error creating blood requirement:', error);
    res.status(500).send('Internal Server Error');
  }
});

// blood requirements
app.get('/blood-requirements', async (req, res) => {
  try {
    const userId = req.header('userId');

    // Check if userId is provided in headers
    if (!userId) {
      return res.status(401).json({ message: 'userId parameter is required in headers' });
    }

    // Retrieve all blood requirements for a specific user from the BloodRequirement table
    const bloodRequirements = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM bloodRequirement WHERE userId = ?', userId, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    res.json(bloodRequirements);
  } catch (error) {
    console.error('Error retrieving blood requirements:', error);
    res.status(500).send('Internal Server Error');
  }
});
// list of all blood requirements
app.get('/blood-requirements/:id?', (req, res) => {
  console.log('entered');
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // If an ID is provided in the URL, fetch a single blood requirement case by that ID
  if (req.params.id) {
    console.log('true');
    connection.query('SELECT * FROM bloodRequirement WHERE userId = ?', req.params.id, (error, results) => {
      if (error) {
        console.error('Error retrieving blood requirement case:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.json(results);
    });
  } else {
    console.log('false');
    // If no ID is provided, retrieve all blood requirement cases for the user
    connection.query('SELECT * FROM bloodRequirement WHERE userId = ?', userId, (error, results) => {
      if (error) {
        console.error('Error retrieving blood requirement cases:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.json(results);
    });
  }
});
// Callback requests
app.post('/callback', (req, res) => {
  console.log(JSON.stringify(req.body));
  const { userId, name, date, time, place, mobileNumber, subject, topictospeakabout, status, coordinatesLatitude, coordinatesLongitude } = req.body;

  // Check if any required field is missing
  if (!userId || !name || !date || !time || !place || !mobileNumber || !subject || !topictospeakabout || !status || !coordinatesLatitude || !coordinatesLongitude) {
    return res.status(400).send('All fields are required');
  }

  // Generate unique Id with 8 characters
  const Id = uuid.v4().substring(0, 8);

  const callbackRequest = {
    Id,
    userId,
    name,
    date,
    time,
    place,
    mobileNumber,
    subject,
    topictospeakabout,
    status,
    coordinatesLatitude,
    coordinatesLongitude
  };

  // Insert callback request into the database
  connection.query(
    'INSERT INTO callbackRequest (Id, userId, name, date, time, place, mobileNumber, subject, topictospeakabout, status, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [Id, userId, name, date, time, place, mobileNumber, subject, topictospeakabout, status, coordinatesLatitude, coordinatesLongitude],
    (error, results) => {
      if (error) {
        console.error('Error inserting callback request:', error);
        return res.status(500).send('Internal Server Error');
      }
      console.log('Callback request inserted successfully');
      res.status(201).send('Callback request received');
    }
  );
});
// Endpoint to retrieve all callback requests
app.get('/callback/:id?', (req, res) => {
  console.log('entered');
 
  // console.log(id);
  const userId = req.header('userId'); // Extract the userId from request headers

  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }

  // Retrieve all callback requests from the database
  if (req.params.id) {
    console.log('true');
    connection.query('SELECT * FROM callbackRequest WHERE userId = ?',req.params.id, (error, results) => {
      if (error) {
        console.error('Error retrieving callback requests:', error);
        return res.status(500).send('Internal Server Error');
      }
      res.json(results);
    });
  } else {
    console.log('false');
    connection.query('SELECT * FROM callbackRequest', (error, results) => {
      if (error) {
        console.error('Error retrieving callback requests:', error);
        return res.status(500).send('Internal Server Error');
      }
      res.json(results);
    });
  }
});
//list af all users
app.get('/users/:userId?', (req, res) => {
  console.log('entered');

  // Extract the userId from request headers
  const userId = req.header('userId');

  // Check if userId header is missing or empty
  if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
  }

  // Retrieve all users or a single user based on the presence of userId parameter
  if (req.params.userId) {
      console.log('true');
      const query = 'SELECT * FROM users WHERE userId = ?';
      connection.query(query, req.params.userId, (error, results) => {
          if (error) {
              console.error('Error retrieving user:', error);
              return res.status(500).send('Internal Server Error');
          }
          if (results.length === 0) {
              return res.status(404).json({ message: 'User not found' });
          }
          res.json(results[0]);
      });
  } else {
      console.log('false');
      const query = 'SELECT * FROM signup';
      connection.query(query, (error, results) => {
          if (error) {
              console.error('Error fetching users:', error);
              return res.status(500).json({ message: 'Internal server error' });
          }
          res.status(200).json(results);
      });
  }
});
// Set up multer to handle file uploads
const storage = multer.memoryStorage();
// list of sponsors
// Set storage engine
app.post('/sponsors', upload.single('photo'), (req, res) => {
  // Extract the userId from request headers
  const userId = req.header('userId');

  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }

  const { firstName, lastName, designation, area } = req.body;

  // Check if all required fields are provided
  if (!firstName || !lastName || !designation || !area) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Prepare the SQL query to insert data into the sponsors table
  let query = 'INSERT INTO sponsors (firstName, lastName, designation, area, photo) VALUES (?, ?, ?, ?, ?)';
  const queryParams = [firstName, lastName, designation, area];

  // Check if a file was uploaded
  if (req.file) {
    // Convert the photo buffer to base64 encoding
    const base64Photo = req.file.buffer.toString('base64');
    queryParams.push(base64Photo);
  } else {
    // If no photo was uploaded, provide a placeholder value (e.g., NULL) for the photo field
    queryParams.push(null);
  }

  // Execute the query with parameters
  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error adding sponsor:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.status(201).json({ message: 'Sponsor added successfully' });
  });
});

// to fetch all the sponsors
app.get('/sponsors/:userId?', (req, res) => {
  console.log('entered');

  // Extract the userId from request headers
  const userId = req.header('userId');

  // Check if userId header is missing or empty
  if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
  }

  // Retrieve all sponsors or a single sponsor based on the presence of userId parameter
  if (req.params.userId) {
      console.log('true');
      const query = 'SELECT * FROM sponsors WHERE userId = ?';
      connection.query(query, req.params.userId, (error, results) => {
          if (error) {
              console.error('Error retrieving sponsors:', error);
              return res.status(500).send('Internal Server Error');
          }
          if (results.length === 0) {
              return res.status(404).json({ message: 'Sponsors not found' });
          }
          res.json(results[0]);
      });
  } else {
      console.log('false');
      const query = 'SELECT * FROM sponsors';
      connection.query(query, (error, results) => {
          if (error) {
              console.error('Error fetching sponsors:', error);
              return res.status(500).json({ message: 'Internal server error' });
          }
          res.status(200).json(results);
      });
  }
});


// add and display partners
app.post('/partners', upload.single('photo'), (req, res) => {
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // Extract data from request body
  const { name, link } = req.body;
  // Check if all required fields are provided
  if (!name || !link) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  // Prepare the SQL query to insert data into the partners table
  const query = 'INSERT INTO partners (name, link, photo) VALUES (?, ?, ?)';
  // Execute the query with parameters
  const queryParams = [name, link];
  if (req.file) {
    // Convert the photo buffer to base64 encoding
    const base64Photo = req.file.buffer.toString('base64');
    queryParams.push(base64Photo);
  } else {
    // If no photo was uploaded, provide a placeholder value (e.g., NULL) for the photo field
    queryParams.push(null);
  }

  // Execute the query with parameters
  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error adding partner:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.status(201).json({ message: 'Partner added successfully' });
  });
});
// GET endpoint to display all partners data
app.get('/partners', (req, res) => {
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // Prepare the SQL query to select all data from the partners table
  const query = 'SELECT * FROM partners';
  // Execute the query
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching partners:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.status(200).json(results);
  });
});

// report an issue
app.post('/reportedissues', (req, res) => {
  console.log(JSON.stringify(req.body));
  const {
    userId,
    name,
    date,
    time,
    email,
    mobileNumber,
    subject,
    explainInBreif,
    status,
    coordinatesLatitude,
    coordinatesLongitude
  } = req.body;

  // Validate if all fields are provided
  if (!userId || !name || !date || !time || !email || !mobileNumber || !subject || !explainInBreif || !coordinatesLatitude || !coordinatesLongitude || !status) {
    return res.status(400).send('All fields are required');
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    console.log('Invalid date format');
    return res.status(400).send('Invalid date format. Date should be in YYYY-MM-DD format');
  }

  // Validate time format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    console.log('Invalid time format');
    return res.status(400).send('Invalid time format. Time should be in HH:MM format (24-hour)');
  }

  // Generate unique 8-character ID
  const Id = uuid.v4().substring(0, 8);

  // Insert report data into the database
  connection.query(
    'INSERT INTO reportIssue (Id, userId, name, date, time, email, mobileNumber, subject, explainInBreif, coordinatesLatitude, coordinatesLongitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [Id, userId, name, date, time, email, mobileNumber, subject, explainInBreif, coordinatesLatitude, coordinatesLongitude, status],
    (error, result) => {
      if (error) {
        console.error('Error inserting details into reportIssue:', error);
        return res.status(500).send('Internal Server Error');
      }
      console.log('Issue report submitted successfully');
      res.status(201).send('Report submitted successfully!');
    }
  );
});
// fetch the reported issues
app.get('/reportedissues/:userId?', (req, res) => {
  console.log('entered');
 
  const userId = req.header('userId'); // Extract the userId from request headers

  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }

  // Retrieve all reported issues from the database
  if (req.params.userId) {
    console.log('true');
    connection.query('SELECT * FROM reportIssue WHERE userId = ?', req.params.userId, (error, results) => {
      if (error) {
        console.error('Error retrieving reported issues:', error);
        return res.status(500).send('Internal Server Error');
      }
      res.json(results);
    });
  } else {
    console.log('false');
    connection.query('SELECT * FROM reportIssue', (error, results) => {
      if (error) {
        console.error('Error retrieving reported issues:', error);
        return res.status(500).send('Internal Server Error');
      }
      res.json(results);
    });
  }
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});