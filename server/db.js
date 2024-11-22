const url="mongodb+srv://kartikg052:bmN3F2wZZlLPejRC@cluster0.j7woe.mongodb.net/";
const mongoose = require('mongoose');

const uri = 'mongodb+srv://kartikg052:bmN3F2wZZlLPejRC@cluster0.j7woe.mongodb.net/';

mongoose.connect(uri)
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

