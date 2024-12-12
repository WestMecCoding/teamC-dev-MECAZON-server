const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"]

    },
    name: {
        type: String,
        required: [false, "Name is not required"]
    },
    accountid: {
        type: Number,
        required: [true, "Account id is required"],
        min: 0
    },
    password: {
        type: String,
        required: [true, "password is required"]
    }


})
module.exports = mongoose.model('User', UserSchema)
