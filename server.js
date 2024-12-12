const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;
const dotenv = require('dotenv')
dotenv.config()
const mongoose = require('mongoose')
const uri = 'mongodb+srv://cmalco709:gvyETRsExBNq0xaV@mechazon-cluster.gaiip.mongodb.net/?retryWrites=true&w=majority&appName=MECHAZON-CLUSTER'

// Middleware
app.use(cors());

const GrocerySchema = require('./models/product-information')
const Employee = require('./models/employee-information')
const User = require('./models/user-information')

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
})
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/find/:database/:collection', async (req, res) => {
  try {

    const { database, collection } = req.params;
    const Model = await getModel(database, collection);
    const documents = await Model.find({});
    console.log(`query executed, document count is: ${documents.length}`);
    res.status(200).json(documents);
  }
  catch (err) {
    console.error('Error in GET route', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/insert/:database/:collection', async (req, res) => {
  try {
    const { database, collection } = req.params;
    const data = req.body;
    const Model = await getModel(database, collection);
    const newDocument = new Model(data)
    await newDocument.save()
    console.log(`document was saved to collection ${collection}`);
    res.status(201).json({ message: "document was created successfully", document: newDocument });
  } catch (err) {
    console.error('there was a problem creating new document', err);
    res.status(400).json({ error: err.message })
  }
});

app.put('/update/:database/:collection/:id', async (req, res) => {
  try {
    const { database, collection, id } = req.params;
    const data = req.body;
    const Model = await getModel(database, collection);
    const updatedDocument = await Model.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    if (!updatedDocument) {
      return res.status(404).json({ message: "Resource not found" })
    }
    console.log("updated document successfully");
    res.status(200).json({ message: "updated document successfuly", document: updatedDocument });
  } catch (err) {
    console.error("error in put route", err);
    res.status(400).json({ error: err.message })
  }
});

app.delete('/delete/:database/:collection/:id', async (req, res) => {
  try {
    const { database, collection, id } = req.params;
    const Model = await getModel(database, collection);
    const deletedDocument = Model.findByIdAndDelete(id);
    if (!deletedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }
    console.log(`document with id: ${id} deleted successfully`);
    res.status(200).json({ message: `Document with id: ${id} deleted successfully` });
  } catch (err) {
    console.error("Error with delete route", err);
    res.status(400).json({ error: err.message })
  }
});
// Insert MANY route
app.post('/insert-many/:database/:collection', async (req, res) => {
  try {
    const { database, collection } = req.params;
    const documents = req.body;

    if (!Array.isArray(documents)) {
      return res.status(400).json({
        error: "Request body must be an array of documents"
      });
    }

    const Model = await getModel(database, collection);

    const result = await Model.insertMany(documents, {
      ordered: true,
      runValidators: true
    });

    console.log(`${result.length} documents were saved to collection ${collection}`);

    res.status(201).json({
      message: `Successfully inserted ${result.length} documents`,
      insertedCount: result.length
    });
  } catch (err) {
    console.error('Error inserting documents:', err);
    res.status(400).json({ error: err.message });
  }
});
// DELETE route to delete a specific collection in a database
app.delete('/delete-collection/:database/:collection', async (req, res) => {
  try {
    const { database, collection } = req.params;
    const connection = await getConnection(database); // Establish or retrieve the connection

    const collections = await connection.db.listCollections({ name: collection }).toArray();
    const collectionExists = collections.length > 0;

    if (!collectionExists) {
      return res.status(404).json({ error: `Collection '${collection}' does not exist in database '${database}'.` });
    }

    await connection.db.dropCollection(collection);
    console.log(`Collection '${collection}' deleted from database '${database}'.`);

    const modelKey = `${database}-${collection}`;
    delete models[modelKey];

    res.status(200).json({ message: `Collection '${collection}' has been successfully deleted from database '${database}'.` });
  } catch (err) {
    console.error('Error deleting collection:', err);
    res.status(500).json({ error: 'An error occurred while deleting the collection.' });
  }
});


