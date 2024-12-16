const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"]

    },

    id: {
        type: Number,
        required: [true, "Employee id is required"],
        min: 0

    },
    password: {
        type: String,
        required: [true, "Password is required"]
    }
})

module.exports = employeeSchema