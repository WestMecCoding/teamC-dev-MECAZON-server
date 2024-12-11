const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());

const GrocerySchema = require('./models/GroceryItems')
const Employee = require('./models/EmployeeSchema')
const User = require('./models/UserSchema')

const modelMapping = {
  GroceryInventory: GrocerySchema,
  Employees: Employee,
  User: User
}
const connections = {}
const models = {}

const getConnection = async (dbName) => {
  console.log(`getConnection called with ${dbName}`);

  if (!connections[dbName]) {
    connections[dbName] = await mongoose.createConnection(process.env.MONGO_URI, { dbName: dbName, autoIndex: false });
    // Await the 'open' event to ensure the connection is established
    await new Promise((resolve, reject) => {
      connections[dbName].once('open', resolve);
      connections[dbName].once('error', reject);
    });
    console.log(`Connected to database ${dbName}`);
  } else {
    console.log('Reusing existing connection for db', dbName);
  }
  return connections[dbName];
};

const getModel = async (dbName, collectionName) => {
  console.log("getModel called with:", { dbName, collectionName });
  const modelKey = `${dbName}-${collectionName}`;

  if (!models[modelKey]) {
    const connection = await getConnection(dbName);
    const Model = modelMapping[collectionName];

    if (!Model) {
      // Use a dynamic schema if no model is found
      const dynamicSchema = new mongoose.Schema({}, { strict: false, autoIndex: false });
      models[modelKey] = connection.model(
        collectionName,
        dynamicSchema,
        collectionName
      );
      console.log(`Created dynamic model for collection: ${collectionName}`);
    } else {
      models[modelKey] = connection.model(
        Model.modelName,
        Model.schema,
        collectionName  // Use exact collection name from request
      );
      console.log("Created new model for collection:", collectionName);
    }
  }

  return models[modelKey];
};

// Routes

app.get("/dummy-data/groceries", (req, res) => {
  const groceries = require("./dummy-data/groceries.json");
  res.json(groceries);
});

app.get("/api/groceries", (req, res) => {
  const groceries = require("./db/groceries.json");
  res.json(groceries);
});

app.get("/api/employees", (req, res) => {
  const employees = require("./db/employees.json");
  res.json(employees);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
