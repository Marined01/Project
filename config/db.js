const mongoose = require('mongoose');

// URI до бд 
const MONGO_URI = 'mongodb://127.0.0.1:27017/mydatabase'; 

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

module.exports = mongoose;
