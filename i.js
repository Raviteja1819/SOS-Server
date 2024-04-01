

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
        const dist1 = haversine(latitude.map(parseFloat), longitude.map(parseFloat), coord1.latitude.map(parseFloat), coord1.longitude.map(parseFloat));
        const dist2 = haversine(latitude.map(parseFloat), longitude.map(parseFloat), coord2.latitude.map(parseFloat), coord2.longitude.map(parseFloat));
        return dist1 - dist2;
    });

    return coordinates;
}

// Example usage:
const list_of_coordinates = [
    {"name": "London", "latitude":51.5074, "longitude":-0.1278},   
    {"name": "Paris", "latitude":48.8566, "longitude":2.3522}  ,
    {"name": "New York City", "latitude":40.7128, "longitude":-74.0060},  
    {"name": "Los Angeles", "latitude":34.0522, "longitude":-118.2437}, 
       
];

const input_latitude = 40.730610;
const input_longitude = -73.935242;

const nearestCoords = findNearestCoordinates(input_latitude, input_longitude, list_of_coordinates);
console.log("Nearest coordinates at the top:", nearestCoords);

//   //    //   //   //   //   //   //   //   //   //   //   //   //   //   //
function haversine(lat1, lon1, lat2, lon2) {
    const degreesToRadians = (degrees) => {
      return degrees * Math.PI / 180;
    };
  
    const sin = Math.sin;
    const cos = Math.cos;
    const sqrt = Math.sqrt;
    const atan2 = Math.atan2;
  
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
      const dist1 = haversine(latitude, longitude, coord1.coordinatesLatitude, coord1.coordinatesLongitude);
      const dist2 = haversine(latitude, longitude, coord2.coordinatesLatitude, coord2.coordinatesLongitude);
      return dist1 - dist2;
    });
  
    return coordinates;
  }
  
  // Route to fetch suggested users based on blood group and nearby locations
  app.post('/suggested-users', (req, res) => {
    const userId = req.header('userId');
   const {bloodGroup, coordinatesLatitude,coordinatesLongitude,} = req.body
    if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
    }
  
    // Fetch user's blood group and coordinates
    connection.query('SELECT bloodGroup, coordinatesLatitude, coordinatesLongitude,userId FROM users WHERE bloodGroup = ?', [bloodGroup], (error, userResults) => {
      if (error) {
        console.error('Error fetching user data:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
  
      
  
      const coordinatesLatitude = coordinatesLatitude.map(parseFloat);
      const coordinatesLongitude = coordinatesLongitude.map(parseFloat);
  
      // Fetch suggested users with the same blood group
    
  
        // Filter suggested users by nearby locations
        const suggestedUsers = findNearestCoordinates(coordinatesLatitude, coordinatesLongitude, userResults);
  
        res.json({ suggestedUsers });
     
    });
  });
  
