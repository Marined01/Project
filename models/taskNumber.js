const mongoose = require('mongoose');

// Схема для збереження поточного порядкового номера завдання
const taskNumberSchema = new mongoose.Schema({
  currentNumber: {
    type: Number,
    default: 1, 
  },
});


module.exports = mongoose.model('TaskNumber', taskNumberSchema);
