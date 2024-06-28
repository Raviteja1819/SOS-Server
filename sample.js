const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const express = require('express');
const multer = require('multer');
const uuid = require('uuid');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const fs = require('fs');
const { sin, cos, sqrt, atan2, log } = require('mathjs');
const axios = require('axios');

const userSocketMap = new Map();


function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

// Function to calculate the distance between two coordinates using the Haversine formula
function haversine(lat1, lon1, lat2, lon2) {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const a = sin(dLat / 2) * sin(dLat / 2) +
    cos(degreesToRadians(lat1)) * cos(degreesToRadians(lat2)) *
    sin(dLon / 2) * sin(dLon / 2);
  const c = 2 * atan2(sqrt(a), sqrt(1 - a));
  const R = 6371; // Radius of the Earth in kilometers
  return R * c;
}

// Function to find the nearest coordinates
function findNearestCoordinates(latitude, longitude, coordinates) {
  coordinates.sort((coord1, coord2) => {
    const dist1 = haversine(parseFloat(latitude), parseFloat(longitude), parseFloat(coord1.coordinatesLatitude), parseFloat(coord1.coordinatesLongitude));
    const dist2 = haversine(parseFloat(latitude), parseFloat(longitude), parseFloat(coord2.coordinatesLatitude), parseFloat(coord2.coordinatesLongitude));
    return dist1 - dist2;
  });

  return coordinates;
}


if (cluster.isMaster && false) {
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
  const images = multer({ dest: 'images/' });
  const certificates = multer({ dest: 'certificates/' })
  // Middleware
  app.use(cors());
  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
  app.use(bodyParser.json());

  // mysql connection
  const connection = mysql.createConnection({
    host: '192.168.1.6',
    user: 'root',
    password: 'Ravi@1819',
    port:3307,
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
  app.use(express.static('public'));
  app.use(express.json());
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  function removeFromArray(array, id) {
    const index = array.indexOf(id);
    if (index > -1) { // only splice array when item is found
      array.splice(index, 1); // 2nd parameter means remove one item only
    }
  }
  const adminArray = [];
  const userSocketArray = [];
  const mp3File = fs.createWriteStream('output.mp3')
  io.on('connection', (userSocket) => {
    console.log(userSocket.handshake.query)
    if (userSocket.handshake.query['CLIENT_TYPE'] == 'ADMIN') {
      adminArray.push(userSocket.id);
      userSocket.on('disconnect', (_) => {
        removeFromArray(adminArray, userSocket.id);
      })
    } else if (userSocket.handshake.query['CLIENT_TYPE'] == 'MOBILE') {
      userSocketArray.push(userSocket.id);
    }
    userSocket.emit('isConnected', "true");
    console.log('connected');
    userSocket.on('toServer', (data) => {
const {buffer, userId} = data
console.log(Buffer.from(buffer).byteLength);
      adminArray.forEach((adminSocketId)=>{
        const adminSocket = io.sockets.sockets.get(adminSocketId);
        if(adminSocket.connected) {
          adminSocket.emit(userId, buffer);
        }
      })
      // userSocket.emit(userId,{"lat":latitude,"lng":longitude});
    });

    userSocket.on('listenToEmergency', (data) => {
      const { userId, lat, lng } = data;
      // console.log(data);
      // connection.query('UPDATE emergency SET coordinatesLatitude=? ,coordinatesLongitude=? WHERE userId=?', [lat, lng, userId]);
      // console.log(userId);
    })
    setInterval(() => {
     
    })
  });
  // Generating the userID
  function generateUserId() {
    const timestamp = Date.now().toString(36);
    const randomChars = Math.random().toString(36).substring(2);
    const userId = timestamp + randomChars;
    return userId.substring(0, 28).padEnd(28, '0');
  }

  app.get('/contacts/:id', (req, res) => {
    const userId = req.header('userId');  // Extract the id parameter from the request URL

    // Query the database to retrieve emergency contacts for the specified person ID
    connection.query('SELECT * FROM emergencyContacts WHERE userId = ?', req.params.id, (error, results) => {
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
  // Signup route

  app.post('/signup', (req, res, next) => {
    console.log(req.body);
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
      certified,
      confirmPassword,
      coordinatesLatitude,
      coordinatesLongitude
    } = req.body;

    const photo = req.file ? req.file.buffer : null;

    // Check if all required fields are provided
    if (!firstName || !lastName || !mobileNumber || !email || !password || !dateOfBirth || !age || !gender || !bloodGroup || !address || !emergencyContact1 || !emergencyContact2 || !emergencyContact3 || !alternateNumber || !pincode || !confirmPassword || !coordinatesLatitude || !coordinatesLongitude) {
      return res.status(400).send('All fields are required');
    }

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(400).send('Password and confirm password do not match');
    }

    // Generate 28-character userID
    const userId = generateUserId();
    console.log('Generated UserId:', userId);

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).send('Internal Server Error');
      }

      connection.connect((err) => {
        if (err) {
          console.error('Error connecting to database:', err);
          return res.status(500).send('Internal Server Error');
        }

        // Insert user details into 'users' table
        const userInsertQuery = `
          INSERT INTO users (firstName, lastName, mobileNumber, email, dateOfBirth, age, gender, bloodGroup, address, photo, userId, alternateNumber, pincode, coordinatesLatitude, coordinatesLongitude, passkey)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        connection.query(
          userInsertQuery,
          [firstName, lastName, mobileNumber, email, dateOfBirth, age, gender, bloodGroup, address, photo, userId, alternateNumber, pincode, coordinatesLatitude, coordinatesLongitude, hashedPassword],
          (error, userInsertResults) => {
            if (error) {
              console.error('Error inserting user details into users:', error);
              return res.status(500).send('Internal Server Error');
            }

            // Insert emergency contact information into 'emergencyContacts' table
            const emergencyContacts = [emergencyContact1, emergencyContact2, emergencyContact3].filter(contact => contact);
            // Check if there are less than 2 or more than 3 emergency contacts
            if (emergencyContacts.length < 2 || emergencyContacts.length > 3) {
              return res.status(400).json({ error: 'At least two and no more than three emergency contacts are required' });
            }

            // Insert emergency contacts
            const emergencyContactInsertQuery = `
              INSERT INTO emergencyContacts (userId, name, relation, mobileNumber,id)
              VALUES (?, ?, ?, ?,?)
            `;

            const emergencyContactPromises = emergencyContacts.map(contact => {
              return new Promise((resolve, reject) => {
                const id = uuid.v4().substring(0, 8);
                connection.query(
                  emergencyContactInsertQuery,
                  [userId, contact.name, contact.relation, contact.mobileNumber, id],
                  (error, results) => {
                    if (error) {
                      console.error('Error inserting emergency contact:', error);
                      reject(error);
                    } else {
                      console.log('Emergency contact inserted:', contact);
                      resolve(results);
                    }
                  }
                );
              });
            });




            Promise.all(emergencyContactPromises)
              .then(() => {
                // After successful signup, retrieve user details from the database (excluding passkey) and send in the response
                const userDetailsQuery = 'SELECT userId,firstName, lastName, mobileNumber, email, dateOfBirth, age, gender, bloodGroup, address, alternateNumber, pincode, coordinatesLatitude, coordinatesLongitude FROM users WHERE userId = ?';
                connection.query(userDetailsQuery, [userId], (err, userResults) => {
                  if (err) {
                    console.error('Error retrieving user details:', err);
                    return res.status(500).send('Internal Server Error');
                  }

                  if (userResults.length === 0) {
                    return res.status(404).send('User not found');
                  }

                  const user = userResults[0];
                  res.status(200).json({ message: 'Account created successfully', user });
                });
              })
              .catch(error => {
                console.error('Error inserting emergency contacts:', error);
                return res.status(500).json({ error: 'Internal server error' });
              });
          }
        );
      });
    });
  });

  // update emergency contacts
  app.put('/contacts/:id', (req, res) => {
    const contactId = req.params.id;
    const { name, mobileNumber, relation } = req.body;  // Check if the required fields are present
    if (!name || !mobileNumber || !relation) {
      return res.status(400).json({ message: 'Name and mobileNumber,relation are required' });
    }  // Update the emergency contact in the database
    const query = 'UPDATE emergencyContacts SET name = ?, mobileNumber = ? , relation= ? WHERE id = ?';
    connection.query(query, [name, mobileNumber, relation, contactId], (error, results) => {
      if (error) {
        console.error('Error updating emergency contact:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.json({ message: 'Emergency contact updated successfully' });
    });
  });

  // Login route
  app.post('/login', (req, res) => {
    console.log('entered Login');
    const { identifier, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? OR mobileNumber = ?';
    connection.query(query, [identifier, identifier], (err, results) => {
      if (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      if (results.length === 0) {
        res.status(400).json({ message: 'Invalid email/phone number or password' });
        return;
      }

      const user = results[0];
      const hashedPassword = user.passkey;
      bcrypt.compare(password, hashedPassword, (compareErr, match) => {
        if (compareErr) {
          console.error('Error comparing passwords:', compareErr);
          res.status(500).json({ message: 'Internal server error' });
          return;
        }
        if (match) {
          const userWithoutPasskey = {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            mobileNumber: user.mobileNumber,
            email: user.email,
            address: user.address,
            alternateNumber: user.alternateNumber,
            pincode: user.pincode,
            bloodGroup: user.bloodGroup,
            dateOfBirth: user.dateOfBirth,
            age: user.age,
            gender: user.gender,
            coordinatesLatitude: user.coordinatesLatitude,
            coordinatesLongitude: user.coordinatesLongitude,
            photo: user.photo,
            certified: user.certified == 0 ? false : true
          };

          res.status(200).json({ message: 'Login successful', user: userWithoutPasskey });
        } else {
          // Passwords don't match
          res.status(400).json({ message: 'Invalid email/phone number or password' });
        }
      });
    });
  });
  app.get('/addressFromCoordinates', async (res, req) => {
    var url = "http://api.positionstack.com/v1/reverse?access_key=fa095d8e3b12c7877902c8f2bb5e294e&query=" + res.query.lat + "," + res.query.lng;

    const response = await axios.get(url);
    var firstResponce = response.data['data'][0];
    var address = firstResponce['name'] + ' ' + firstResponce['street'] + ' ' + firstResponce['county'] + ' ' + firstResponce['region'] + ' ' + firstResponce['country'] + ' ' + firstResponce['postal_code'];
    req.send({ 'address': address });
    console.log(response.data['data']['0']);

  })
  app.get('/isCertified/:userId', (res, req) => {
    var userId = res.params.userId;
    console.log(userId);
    const query = 'SELECT certified FROM users WHERE userId = ?';
    connection.query(query, [userId], (err, result) => {
      req.send({ 'certified': result[0]['certified'] == 0 ? false : true })
    })
  })
  //change password
  const bcrypt = require('bcrypt');

  // POST endpoint to update password with old password verification
  app.post('/update-password', (req, res) => {
    const { email, mobileNumber, oldPassword, newPassword } = req.body;

    // Fetch the user data from the database based on email or mobileNumber
    const query = 'SELECT * FROM users WHERE email = ? OR mobileNumber = ?';
    connection.query(query, [email, mobileNumber], (err, results) => {
      if (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const user = results[0];

      // Compare the old password provided with the hashed password stored in the database
      bcrypt.compare(oldPassword, user.passkey, (compareErr, match) => {
        if (compareErr) {
          console.error('Error comparing passwords:', compareErr);
          res.status(500).json({ message: 'Internal server error' });
          return;
        }

        if (!match) {
          // Old password doesn't match
          res.status(400).json({ message: 'Old password is incorrect' });
          return;
        }

        // Hash the new password
        bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error('Error hashing password:', hashErr);
            res.status(500).json({ message: 'Internal server error' });
            return;
          }

          // Update the password in the database
          const updateQuery = 'UPDATE users SET passkey = ? WHERE userId = ?';
          connection.query(updateQuery, [hashedPassword, user.userId], (updateErr, updateResults) => {
            if (updateErr) {
              console.error('Error updating password:', updateErr);
              res.status(500).json({ message: 'Internal server error' });
              return;
            }
            res.status(200).json({ message: 'Password updated successfully' });
          });
        });
      });
    });
  });


  // update profile data
  app.put('/users', (req, res) => {
    const userId = req.headers.userid;
    console.log(req.body);
    const { firstName, lastName, mobileNumber, email, address, alternateNumber, pincode } = req.body;

    // Check if required fields are provided
    if (!firstName || !lastName || !mobileNumber || !email || !address || !alternateNumber || !pincode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Update user in the database
    connection.query('UPDATE users SET firstName=?, lastName=?, mobileNumber=?, email=?, address=?, alternateNumber=?, pincode=? WHERE userId=?',
      [firstName, lastName, mobileNumber, email, address, alternateNumber, pincode, userId],
      (error, results) => {
        if (error) {
          console.error('Error updating user', error);
          return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
      }
    );
  });

  // profile photo
  app.post('/upload-photo', images.single('photo'), (req, res) => {
    // Extract the userId from request headers
    const userId = req.header('userId');

    // Check if userId header is missing or empty
    if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
    }

    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    // Prepare the SQL query to insert data into the users table
    const query = 'UPDATE users SET photo = ? WHERE userId = ?';

    // Read the photo file
    fs.readFile(req.file.path, (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

      // Execute the query with parameters
      connection.query(query, [data.toString('base64'), userId], (err, results) => {
        if (err) {
          console.error('Error updating user photo:', err);
          return res.status(500).json({ message: 'Internal Server Error' });
        }

        // Return success message
        res.status(200).json({ message: 'Photo uploaded successfully' });
      });
    });
  });

  // Define the validateFields middleware function
  function validateFields(req, res, next) {
    const { userId, name, mobileNumber, place, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;
    if (!userId || !name || !mobileNumber || !place || !pincode || !status || !coordinatesLatitude || !coordinatesLongitude) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    next();
  }
  //  blood checkup creation
  app.post('/bloodcheckup', validateFields, (req, res, next) => {
    // Destructure fields from request body
    const {
      userId,
      name,
      mobileNumber,
      place,
      pincode,
      status,
      coordinatesLatitude,
      coordinatesLongitude
    } = req.body;

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
      'INSERT INTO bloodCheckup (Id, userId, name, mobileNumber, place, status, pincode, coordinatesLatitude, coordinatesLongitude) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [Id, userId, name, mobileNumber, place, status, pincode, coordinatesLatitude, coordinatesLongitude],
      (error, result) => {
        if (error) {
          console.error('Error inserting details into bloodCheckup:', error);
          return res.status(500).send('Internal Server Error');
        }

        // Generate unique Id with 8 characters for notification
        const notificationId = uuid.v4().substring(0, 8);
        const message = 'Blood checkup required';
        const type = 'bloodcheckup';

        // Insert notification data into the database
        connection.query(
          'INSERT INTO notifications (Id,notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude, notified, `read`) VALUES (?,?, ?, ?, ?, ?, ?, false, false)',
          [Id, notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude],
          (error, result) => {
            if (error) {
              console.error('Error inserting details into notifications:', error);
              return res.status(500).send('Error inserting notification data');
            }
            // Send response with the generated Id
            res.status(200).json({ Id, message: 'Blood checkup created successfully' });
          }
        );
      }
    );
    connection.query('UPDATE users SET certified = 1 WHERE userId = ?', [userId]);
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
      connection.query('SELECT * FROM bloodCheckup WHERE Id = ?', req.params.id, (error, results) => {
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
      connection.query(query, [reportData.userId, reportData.date, reportData.time, reportData.placeOfIncident, reportData.subject, reportData.explaininBrief, reportData.coordinatesLatitude, reportData.coordinatesLongitude, reportData.status], (err, results) => {
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
    const { reportedAccount, userId, date, time, placeOfIncident, subject, explainInBreif, coordinatesLatitude, coordinatesLongitude, status } = req.body;

    // Validate if all fields are provided
    if (!reportedAccount || !userId || !date || !time || !placeOfIncident || !subject || !explainInBreif || !coordinatesLatitude || !coordinatesLongitude || !status) {
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
      'INSERT INTO anonymousReport (Id, reportedAccount, userId, date, time, placeOfIncident, subject, explainInBreif, coordinatesLatitude, coordinatesLongitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [Id, reportedAccount, userId, date, time, placeOfIncident, subject, explainInBreif, coordinatesLatitude, coordinatesLongitude, status],
      (error, result) => {
        if (error) {
          console.error('Error inserting details into anonymousReport:', error);
          return res.status(500).send('Internal Server Error');
        }

        // Generate unique Id with 8 characters for notification
        const notificationId = uuid.v4().substring(0, 8);
        const message = explainInBreif; // Use explainInBreif as message
        const type = 'anonymousReport';

        // Insert notification data into the database
        connection.query(
          'INSERT INTO notifications (Id, notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude, notified, `read`) VALUES (?, ?, ?, ?, ?, ?, ?, false, false)',
          [Id, notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude],
          (error, result) => {
            if (error) {
              console.error('Error inserting details into notifications:', error);
              return res.status(500).send('Error inserting notification data');
            }
            console.log('Anonymous report submitted successfully');
            res.status(200).send('Report submitted successfully!');
          }
        );
      }
    );
  });

  // app.get('/anonymousreport', (req, res) => {
  //   const userId = req.header('userId'); // Extract the userId from request headers
  //   if (!userId) {
  //     return res.status(400).json({ message: 'userId header is required' });
  //   }
  //   connection.query('SELECT * FROM anonymousReport WHERE Id = ?', userId, (err, results) => {
  //     if (err) {
  //       console.error('Error retrieving anonymous reports:', err);
  //       return res.status(500).send('Internal Server Error');
  //     }
  //     res.json(results);
  //   });
  // });
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
      // Generate unique Id with 8 characters for notification
      const notificationId = uuid.v4().substring(0, 8);
      const message = purposeOfBlood;
      const type = 'bloodEmergency';

      // Insert notification data into the database
      connection.query(
        'INSERT INTO notifications (Id, notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude, notified, `read`) VALUES (?, ?, ?, ?, ?, ?, ?, false, false)',
        [Id, notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude],
        (error, result) => {
          if (error) {
            console.error('Error inserting details into notifications:', error);
            return res.status(500).send('Error inserting notification data');
          }
          res.status(200).send('Blood emergency request submitted successfully!');
        });
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
      const query = 'SELECT * FROM bloodEmergency WHERE Id = ?';
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
    const { userId, patientName, date, time, bloodType, mobileNumber, hospitalName, hospitalAddress, location, purposeOfBlood, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;

    // Generate unique Id
    const Id = uuid.v4().substring(0, 8); // Generating unique Id and extracting first 8 characters

    // Check if all required fields are provided
    if (!userId || !patientName || !date || !time || !bloodType || !mobileNumber || !hospitalName || !hospitalAddress || !location || !purposeOfBlood || !pincode || !status || !coordinatesLatitude || !coordinatesLongitude) {
      return res.status(400).send('All fields are required');
    }
    try {
      // Insert blood requirement into BloodRequirement table
      await new Promise((resolve, reject) => {
        connection.query(
          'INSERT INTO bloodRequirement (Id, userId, patientName, date, time, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, status, location, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [Id, userId, patientName, date, time, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, status, location, coordinatesLatitude, coordinatesLongitude],
          (error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          }
        );
      });

      // Generate unique Id with 8 characters for notification
      const notificationId = uuid.v4().substring(0, 8);
      const message = purposeOfBlood;
      const type = 'bloodRequirement';

      // Insert notification data into the database
      await new Promise((resolve, reject) => {
        connection.query(
          'INSERT INTO notifications (Id, notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude, notified, `read`) VALUES (?, ?, ?, ?, ?, ?, ?, false, false)',
          [Id, notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude],
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
      });

      res.status(200).send('Blood requirement created');
    } catch (error) {
      console.error('Error creating blood requirement:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // // blood requirements
  // app.get('/blood-requirements', async (req, res) => {
  //   try {
  //     const userId = req.header('userId');

  //     // Check if userId is provided in headers
  //     if (!userId) {
  //       return res.status(400).json({ message: 'userId parameter is required in headers' });
  //     }

  //     // Retrieve all blood requirements for a specific user from the BloodRequirement table
  //     const bloodRequirements = await new Promise((resolve, reject) => {
  //       connection.query('SELECT * FROM bloodRequirement WHERE userId = ?', userId, (error, results) => {
  //         if (error) {
  //           reject(error);
  //         } else {
  //           resolve(results);
  //         }
  //       });
  //     });
  //     res.json(bloodRequirements);
  //   } catch (error) {
  //     console.error('Error retrieving blood requirements:', error);
  //     res.status(500).send('Internal Server Error');
  //   }
  // });
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
      connection.query('SELECT * FROM bloodRequirement WHERE Id = ?', [req.params.id], (error, results) => {
        if (error) {
          console.error('Error retrieving blood requirement case:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
        if (results.length === 0) {
          return res.status(404).json({ message: 'Blood requirement case not found' });
        }
        res.json(results[0]); // Return the first (and only) result
      });
    } else {
      console.log('false');
      // If no ID is provided, retrieve all blood requirement cases for the user
      connection.query('SELECT * FROM bloodRequirement', (error, results) => {
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
    const { userId, name, date, time, mobileNumber, subject, topicToSpeakAbout, status, coordinatesLatitude, coordinatesLongitude } = req.body;

    // Check if any required field is missing
    if (!userId || !name || !date || !time || !mobileNumber || !subject || !topicToSpeakAbout || !status || !coordinatesLatitude || !coordinatesLongitude) {
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
      mobileNumber,
      subject,
      topicToSpeakAbout,
      status,
      coordinatesLatitude,
      coordinatesLongitude
    };

    // Insert callback request into the database
    connection.query(
      'INSERT INTO callbackRequest (Id, userId, name, date, time,  mobileNumber, subject, topicToSpeakAbout, status, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [Id, userId, name, date, time, mobileNumber, subject, topicToSpeakAbout, status, coordinatesLatitude, coordinatesLongitude],
      (error, results) => {
        if (error) {
          console.error('Error inserting callback request:', error);
          return res.status(500).send('Internal Server Error');
        }
        // Generate unique Id with 8 characters for notification
        const notificationId = uuid.v4().substring(0, 8);
        const message = topicToSpeakAbout; // Use explainInBreif as message
        const type = 'callbackRequest';

        // Insert notification data into the database
        connection.query(
          'INSERT INTO notifications (Id, notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude, notified, `read`) VALUES (?, ?, ?, ?, ?, ?, ?, false, false)',
          [Id, notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude],
          (error, result) => {
            if (error) {
              console.error('Error inserting details into notifications:', error);
              return res.status(500).send('Error inserting notification data');
            }
            console.log('Callback request inserted successfully');
            res.status(200).send('Callback request received');
          }
        );
      });
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
    console.log('true', req.params.id,);
    const query = 'SELECT * FROM callbackRequest WHERE userId = ?';
    // Retrieve all callback requests from the database
    if (req.params.id) {
      console.log('true');
      connection.query('SELECT * FROM callbackRequest WHERE Id = ?', [req.params.id], (error, results) => {
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
    console.log('entered users here');
    const userId = req.header('userId');
    console.log(userId);
    if (!userId) {
      return res.status(400).json({ message: 'userId parameter is requirerd' });
    }
    console.log('true', req.params.userId,);
    const query = 'SELECT * FROM users WHERE userId = ?';
    if (req.params.userId) {
      console.log(req.params.userId, userId);
      connection.query('SELECT * FROM users WHERE userId = ?', [req.params.userId], (error, results) => {
        if (error) {
          console.error('Error retriving user', error);
          return res.status(400).send('Internal server error');
        }
        if (results.length === 0) {
          return res.status(400).json('user not found');
        }
        res.json(results);
      });
    } else {
      connection.query('SELECT * FROM users', (error, results) => {
        if (error) {
          console.error('Error retriving user', error);
          return res.status(400).send('Internal server error');
        }
        if (results.length === 0) {
          return res.status(400).json('user not found');
        }
        res.json(results);
      });
    }
  });

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Define the destination folder where images will be stored
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      // Define how file names will be generated
      const userId = req.body.firstName + req.body.lastName; // Assuming user ID is sent in the request body
      const filename = userId + path.extname(file.originalname);
      cb(null, filename);
    }
  });
  // list of sponsors
  // Set storage engine
  app.post('/sponsors', images.single('photo'), (req, res) => {
    // Extract the userId from request headers
    const userId = req.header('userId');
    console.log(req.file);
    // Check if userId header is missing or empty
    if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
    }

    // const { firstName, lastName, designation, area } = req.body;
    const firstName = req.body["firstName"]
    const lastName = req.body["lastName"]
    const designation = req.body["designation"]
    const area = req.body["area"]
    console.log(req.body);
    // Check if all required fields are provided
    if (!firstName || !lastName || !designation || !area) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Prepare the SQL query to insert data into the sponsors table
    let query = 'INSERT INTO sponsors (firstName, lastName, designation, area, photo) VALUES (?, ?, ?, ?, ?)';
    const queryParams = [firstName, lastName, designation, area];
    var imagebase = ''
    var id = uuid.v4().substring(0, 8);
    // Check if a file was uploaded
    if (req.file) {
      const imagePath = req.file.path;
      console.log(imagePath);
      fs.readFile(imagePath, (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
        // console.log(data.toString('base64'));
        imagebase = data.toString('base64');
        connection.query('INSERT INTO sponsors (id, firstName, lastName, designation, area, photo) VALUES (?, ?, ?, ?, ?, ?)', [id, firstName, lastName, designation, area, data.toString('base64')], (err, results) => {
          console.log(id, firstName, lastName, designation, area);
          if (err) {
            console.error('Error adding sponsor:', err.message);
            return res.status(500).json({ message: 'Internal Server Error' });
          }
          // console.log(imagebase);
          // fsExtra.remove(path.join(__dirname, imagePath), err => {
          //   if (err) return console.error(err)
          //   console.log('success!')
          // })
          res.status(200).json({ message: 'Sponsor added successfully' });
        })
      })
      // queryParams.push(base64Photo);
    } else {
      res.status(400).json({ message: 'Sponsor added Failed Need Image' });
    }
    // Execute the query with parameters

  });

  // to fetch all the sponsors
  app.get('/sponsors/:Id?', (req, res) => {
    console.log('Entered endpoint');

    // Extract the userId from request headers
    const userId = req.header('userId');

    // Check if userId header is missing or empty
    if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
    }

    // Check if an `Id` parameter is provided in the URL
    const Id = req.params.Id;

    if (Id) {
      // Fetch a single sponsor by `Id`
      console.log('Fetching single sponsor with ID:', Id);

      // Prepare the SQL query to fetch a single sponsor by `Id`
      const query = 'SELECT * FROM sponsors WHERE Id = ?';
      const queryParams = [Id];

      // Execute the query
      connection.query(query, queryParams, (error, results) => {
        if (error) {
          console.error('Error retrieving sponsor:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }

        // Check if a sponsor was found
        if (results.length === 0) {
          return res.status(404).json({ message: 'Sponsor not found' });
        }

        // Return the single sponsor as a JSON response
        res.status(200).json(results[0]);
      });
    } else {
      // Fetch all sponsors
      console.log('Fetching all sponsors');
      const query = 'SELECT * FROM sponsors';

      connection.query(query, (error, results) => {
        if (error) {
          console.error('Error fetching sponsors:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
        res.status(200).json(results);
      });
    }
  });

  // delete sponsors 
  app.delete('/sponsors/:Id', (req, res) => {
    console.log('Entered DELETE endpoint');
    const userId = req.header('userId');
    if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
    }
    const Id = req.params.Id;
    if (!Id) {
      return res.status(400).json({ message: 'Sponsor Id is required' });
    }
    const query = 'DELETE FROM sponsors WHERE Id = ?';
    const queryParams = [Id];
    connection.query(query, queryParams, (error, results) => {
      if (error) {
        console.error('Error deleting sponsor:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Sponsor not found' });
      }
      res.status(200).json({ message: 'Sponsor deleted successfully' });
    });
  });

  // add and display partners
  app.post('/partners', images.single('photo'), async (req, res) => {
    try {
      // Extract the userId from request headers
      const userId = req.header('userId');
      if (!userId) {
        return res.status(400).json({ message: 'userId header is required' });
      }
      const { name, link } = req.body;
      console.log(req.body);
      if (!name || !link) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      // Check if a file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: 'Partner addition failed. Image is required.' });
      }
      const imagePath = req.file.path;
      console.log(imagePath);
      // Read the uploaded file and convert it to base64
      const data = await fs.promises.readFile(imagePath);
      const base64Photo = data.toString('base64');
      const query = 'INSERT INTO partners (id, name, link, photo) VALUES (?, ?, ?, ?)';
      const id = uuid.v4().substring(0, 8);

      const queryParams = [id, name, link, base64Photo];
      connection.query(query, queryParams, (err) => {
        console.log(imagePath);
        console.log(req.body['photo']);
        if (err) {
          console.error('Error adding partner:', err);
          return res.status(500).json({ message: 'Internal Server Error' });
        }

        res.status(200).json({ message: 'Partner added successfully' });
      });

    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });


  // GET endpoint to display all partners data
  app.get('/partners/:id?', (req, res) => {
    console.log('entered');

    // Extract the userId from request headers
    const userId = req.header('userId');

    // Check if userId header is missing or empty
    if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
    }

    // Retrieve either all partners or a single partner based on the presence of the `id` parameter
    if (req.params.id) {
      console.log('Fetching single partner');

      // Prepare the SQL query to fetch a single partner by `id`
      const query = 'SELECT * FROM partners WHERE id = ? ';
      const queryParams = [req.params.id];

      connection.query(query, queryParams, (error, results) => {
        if (error) {
          console.error('Error retrieving partner:', error);
          return res.status(500).send('Internal Server Error');
        }
        if (results.length === 0) {
          return res.status(404).json({ message: 'Partner not found' });
        }
        // Return the single partner as a JSON response
        res.status(200).json(results[0]);
      });
    } else {
      console.log('Fetching all partners');

      // Prepare the SQL query to fetch all partners for the given userId
      const query = 'SELECT * FROM partners ';
      const queryParams = [userId];

      connection.query(query, queryParams, (error, results) => {
        if (error) {
          console.error('Error fetching partners:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
        // Return all partners as a JSON response
        res.status(200).json(results);
      });
    }
  });
  // update partners
  app.put('/partners', (req, res) => {
    try {
      // Extract the userId from request headers
      const userId = req.header('userId');
      if (!userId) {
        return res.status(400).json({ message: 'userId header is required' });
      }

      // Extract the partner ID from request body
      const id = req.body.Id;
      console.log(req.body);
      if (!id) {
        return res.status(400).json({ message: 'Id parameter is required' });
      }

      const { name, link } = req.body;
      if (!name || !link) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const query = `
          UPDATE partners
          SET name = ?, link = ?
          WHERE id = ?
      `;

      const queryParams = [name, link, id];

      connection.query(query, queryParams, (err, results) => {
        if (err) {
          console.error('Error updating partners:', err.message);
          return res.status(500).json({ message: 'Internal Server Error' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ message: 'Partner not found' });
        }

        res.status(200).json({ message: 'Partner updated successfully' });
      });
    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });


  //update sponsors
  app.put('/sponsors', (req, res) => {
    try {
      // Extract the userId from request headers
      const userId = req.header('userId');
      if (!userId) {
        return res.status(400).json({ message: 'userId header is required' });
      }

      // Extract the sponsor ID from request body
      const id = req.body.Id;
      console.log(req.body);
      if (!id) {
        return res.status(400).json({ message: 'id parameter is required' });
      }

      const { firstName, lastName, designation } = req.body;
      if (!firstName || !lastName || !designation) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const query = `
      UPDATE sponsors
      SET firstName = ?, lastName = ?, designation = ?
      WHERE id = ?
    `;

      const queryParams = [firstName, lastName, designation, id];

      connection.query(query, queryParams, (err, results) => {
        if (err) {
          console.error('Error updating sponsor:', err.message);
          return res.status(500).json({ message: 'Internal Server Error' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ message: 'Sponsor not found' });
        }

        res.status(200).json({ message: 'Sponsor updated successfully' });
      });
    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ message: 'Internal Server Error' });
    }
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
        // Generate unique Id with 8 characters for notification
        const notificationId = uuid.v4().substring(0, 8);
        const message = explainInBreif; // Use explainInBreif as message
        const type = 'reportedissues';

        // Insert notification data into the database
        connection.query(
          'INSERT INTO notifications (Id, notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude, notified, `read`) VALUES (?, ?, ?, ?, ?, ?, ?, false, false)',
          [Id, notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude],
          (error, result) => {
            if (error) {
              console.error('Error inserting details into notifications:', error);
              return res.status(500).send('Error inserting notification data');
            }
            console.log('Issue report submitted successfully');
            res.status(200).send('Report submitted successfully!');
          }
        );
      });
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
      connection.query('SELECT * FROM reportIssue WHERE Id = ?', req.params.userId, (error, results) => {
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
  // // notifications
  // app.post('/notification', (req, res) => {
  //   console.log(JSON.stringify(req.body));
  //   const { userId, type, message, coordinatesLatitude, coordinatesLongitude } = req.body;
  //   if (!userId || !type || !message || !coordinatesLatitude || !coordinatesLongitude) {
  //     return res.status(400).json({ error: 'userId, type, message, coordinatesLatitude, coordinatesLongitude are required fields' });
  //   }
  //   const notificationId = uuidv4().substring(0, 8); // Generate unique notification ID using uuidv4()
  //   const insertQuery = 'INSERT INTO notifications (notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude , notified , read) VALUES (?, ?, ?, ?, ?, ?, false , false)';
  //   connection.query(insertQuery, [notificationId, userId, type, message, coordinatesLatitude, coordinatesLongitude], (error, results) => {
  //     if (error) {
  //       console.error('Error inserting notification:', error);
  //       return res.status(500).json({ error: 'Internal server error' });
  //     }
  //     res.status(200).json({ message: 'Notification created successfully', notificationId });
  //   });
  // });

  //  update notification status
  app.put('/notifications/:notificationId', (req, res) => {
    const notificationId = req.params.notificationId;
    const { notified, read } = req.body;
    const notifiedBool = notified === 'True' ? 1 : 0;
    const readBool = read === 'True' ? 1 : 0;
    const query = 'UPDATE notifications SET notified = ?, `read` = ? WHERE notificationId = ?';
    connection.query(query, [notifiedBool, readBool, notificationId], (error, result) => {
      if (error) {
        console.error('Error updating notification status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      console.log('Notification status updated successfully');
      res.status(200).json({ message: 'Notification status updated successfully' });
    });
  });
  // fetch notifications 
  app.get('/notifications', (req, res) => {
    const userId = req.query.userId;
    let query = 'SELECT * FROM notifications';
    let queryParams = [];
    if (userId) {
      query += ' WHERE userId = ?';
      queryParams.push(userId);
    }
    connection.query(query, queryParams, (error, results) => {
      if (error) {
        console.error('Error retrieving notifications:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'No notifications found' });
      }
      res.status(200).json(results);
    });
  });

  // update status in all the reports
  app.post('/update-status', (req, res) => {
    const { reportType, reportId, status } = req.body;

    // Validate if all fields are provided
    if (!reportType || !reportId || !status) {
      return res.status(400).send('reportType, reportId, and status are required fields');
    }

    // Define the appropriate table based on the report type
    let tableName;
    switch (reportType) {
      case 'reportedissues':
        tableName = 'reportIssue';
        break;
      case 'callback':
        tableName = 'callbackRequest';
        break;
      case 'blood-requirements':
        tableName = 'bloodRequirement';
        break;
      case 'bloodcheckup':
        tableName = 'bloodCheckup';
        break;
      case 'anonymousreport':
        tableName = 'anonymousReport';
        break;
      case 'blood-emergency':
        tableName = 'bloodEmergency';
        break;
      case 'bloodEmergency':
        tableName = 'bloodEmergency';
        break;
      default:
        return res.status(400).send('Invalid reportType');
    }

    // Update status in the specified table
    const query = `UPDATE ${tableName} SET status = ? WHERE Id = ?`;
    connection.query(query, [status, reportId], (error, results) => {
      if (error) {
        console.error(`Error updating status in ${tableName}:`, error);
        return res.status(500).send('Internal Server Error');
      }
      res.status(200).json({ message: 'Status updated successfully' });
    });
  });

  app.post('/suggested-users', (req, res) => {
    const userId = req.header('userId');
    const { bloodGroup, coordinatesLatitude, coordinatesLongitude, } = req.body
    if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
    }

    // Fetch user's blood group and coordinates
    connection.query('SELECT bloodGroup, coordinatesLatitude, coordinatesLongitude,userId FROM users WHERE bloodGroup = ?', [bloodGroup], (error, userResults) => {
      if (error) {
        console.error('Error fetching user data:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      const coordinatesLatitudeParsed = parseFloat(coordinatesLatitude);
      const coordinatesLongitudeParsed = parseFloat(coordinatesLongitude);
      // Fetch suggested users with the same blood group
      // Filter suggested users by nearby locations
      const suggestedUsers = findNearestCoordinates(coordinatesLatitudeParsed, coordinatesLongitudeParsed, userResults);
      res.json({ suggestedUsers });

    });
  });

  // fetch all in single route

  app.post('/data', async (req, res) => {
    try {
      const { tableName, userId } = req.body;

      if (!tableName) {
        return res.status(400).json({ message: 'tableName parameter is required in the request body' });
      }

      let sql = `SELECT * FROM ${tableName}`;
      let params = [];

      if (userId) {
        sql += ' WHERE userId = ?';
        params.push(userId);
      }

      const tableData = await queryDatabase(sql, params);

      res.status(200).json({ [tableName]: tableData });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // Function to execute SQL queries asynchronously
  function queryDatabase(sql, params = []) {
    return new Promise((resolve, reject) => {
      connection.query(sql, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  // all solved cases
  app.get('/solved-cases', (req, res) => {
    const tables = ['reportIssue', 'callbackRequest', 'bloodRequirement', 'bloodCheckup', 'anonymousReport', 'bloodEmergency'];
    const fetchSolvedCasesFromTable = (table) => {
      return new Promise((resolve, reject) => {
        let query = `SELECT * FROM ${table} WHERE status = 'solved'`;
        // switch (table) {
        //   case 'reportIssue':
        //   case 'callbackRequest':
        //   case 'bloodRequirement':
        //   case 'bloodCheckup':
        //   case 'anonymousReport':
        //   case 'bloodEmergency':
        //     query = `SELECT * FROM ${table} WHERE status = 'solved'`;
        //     break;
        //   default:
        //     return reject(`Unknown table: ${table}`);
        // }
        connection.query(query, (err, results) => {
          if (err) {
            return reject(err);
          }
          resolve(results);
        });
      });
    };
    const fetchAllSolvedCases = async () => {
      try {
        const allResults = await Promise.all(tables.map(fetchSolvedCasesFromTable));
        const allSolvedCases = allResults.flat();
        res.json(allSolvedCases);
      } catch (err) {
        console.error('Error fetching solved cases:', err);
        res.status(500).json({ error: 'Failed to fetch solved cases' });
      }
    };
    fetchAllSolvedCases();
  });



  // admin signup

  function generateUserId() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  // Admin sign-up endpoint
  app.post('/admin-signup', async (req, res) => {
    const { firstName, lastName, email, mobileNumber, designation, loginTime, password } = req.body;
    console.log(req.body);
    if (!firstName || !lastName || !email || !designation || !mobileNumber || !loginTime || !password) {
      return res.status(400).send('All fields are required');
    }
    const userId = generateUserId();
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO admin (userId, firstName, lastName, email, mobileNumber, designation, loginTime, passkey)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    connection.query(query, [userId, firstName, lastName, email, mobileNumber, designation, loginTime, hashedPassword], (error, results) => {
      if (error) {
        console.error('Error inserting admin data:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.status(201).json({ message: 'Admin user created successfully', userId: userId });
    });
  });

  //admin login
  app.post('/admin-login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.send("all fields are required");
    }

    const query = `SELECT * FROM admin WHERE email = ? `;
    connection.query(query, [email], async (error, results) => {
      if (error) {
        console.error('Error querying admin data:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid email' });
      }

      const admin = results[0];

      const passwordMatch = await bcrypt.compare(password, admin.passkey);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid password' });
      }
      const { userId, firstName, lastName, email, mobileNumber, designation, loginTime } = admin;
      console.log('Admin Details:', {
        userId,
        firstName,
        lastName,
        email,
        mobileNumber,
        designation,
        loginTime
      });
      res.json({ message: 'Login successful', userId, firstName, lastName, email, mobileNumber, designation, loginTime });
    });
  });

  // emergency-cases

  app.post('/emergency', (req, res) => {
    try {
      const { userId, coordinatesLatitude, coordinatesLongitude } = req.body;
      console.log(req.body);
      if (!userId || !coordinatesLatitude || !coordinatesLongitude) {
        return res.status(400).json({ message: 'userId, latitude, and longitude are required' });
      }
      const query = 'INSERT INTO emergency (userId, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?)';
      const queryParams = [userId, coordinatesLatitude, coordinatesLongitude];
      connection.query(query, queryParams, (err, results) => {
        if (err) {
          console.error('Error inserting emergency data:', err.message);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
        res.status(201).json({ message: 'Emergency data stored successfully' });
      });
    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  // get all the emergency data
  app.get('/emergency', (req, res) => {
    const query = 'SELECT userId, coordinatesLatitude AS lat, coordinatesLongitude AS lng FROM emergency WHERE status = "pending"'; 
    let timeElapsed = 0;
    const i1 = setInterval(() => {
      timeElapsed++;
    }, 1000);
    connection.query(query, [], (err, results) => {
      clearInterval(i1);
      console.log(`${timeElapsed} seconds`);
      if (err) {
        console.error('Error fetching pending emergency data:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'No pending emergency data found' });
      }
      res.status(200).json(results);
    });
  });

  // Start the server
  server.listen(3000, () => {
    console.log(`Server is running on port 3000`);
  });
}