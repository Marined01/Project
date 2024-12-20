const mongoose = require('mongoose');

// URI до бд 
    const MONGO_URI = 'mongodb://root:root@localhost:27117/mydatabase?authSource=admin';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

module.exports = mongoose;
