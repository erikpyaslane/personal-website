import express from 'express';
const bodyParser = require('body-parser');
const path = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const cors = require('cors');
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const initializePassport = require('./passport-config')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = "mongodb+srv://erikpyaslane:tfxzxxkd8u@portfolio.4dktmad.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

/*************************************
 *
 *      DATABASE
 *  
 ************************************/


async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

async function closeDatabaseConnection() {
  try {
    await client.close();
    console.log("Closed MongoDB connection");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
    throw error;
  }
}

// Connect to MongoDB when the application starts
connectToDatabase().catch(console.dir);

const fetchAdminUserById = async (id) => {
  const db = client.db("Portfolio");
  return await db.collection("Admins").findOne({ id: id });
};

const fetchAdminUserByUsername = async (username) => {
  const db = client.db("Portfolio");
  return await db.collection("Admins").findOne({ username: username });
};

initializePassport(passport, fetchAdminUserById, fetchAdminUserByUsername);

const app = express();
app.use(express.json());
app.use(flash());
app.use(bodyParser.json());
app.use(cors());
app.use(session({
  secret: 'your-secret-key', // Replace with a secure secret key
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000, // Example: 1 hour
  },
}));


app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.use('/images', express.static(path.join(__dirname, "../assets")))


app.get('/api/login', checkNotAuthenticated, (req, res) => {
  res.send("LoginPage")
})

app.post('/api/login', passport.authenticate('local', {
  successRedirect: '/api/dashboard',
  failureRedirect: '/api/login',
  failureFlash: true
}));

app.delete('/api/logout', (req, res) => {
  req.logOut();

  // Clear the session (example for Express session)
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }

    // Redirect to the login page
    res.redirect('/api/login');
  });
});

function checkAuthenticated(req, res, next) {
  console.log("Checking authentication status...");
  if (req.isAuthenticated()) {
    console.log("User is authenticated.");
    return next();
  }

  console.log("User is not authenticated. Redirecting to login page.");
  res.redirect('/api/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/api/dashboard')
  }
  next()
}


/*************************************
 *
 *      PROJECTS 
 *  
 ************************************/


app.get('/api/projects', async (req, res) => {
  try {
    const db = client.db("Portfolio");
    const projects = await db.collection("Projects").find({}).toArray();
    res.send(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send("Internal Server Error");
  }
})

app.get('/api/project/:projectModifiedName', async (req, res) => {
  try {
    const projectModifiedName = req.params.projectModifiedName
    const db = client.db("Portfolio");
    const project = await db.collection("Projects").findOne({ modified_name: projectModifiedName });
    res.json(project);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send("Internal Server Error");
  }
})

app.post('/api/projects', async (req, res) => {
  try {
    const { name, modified_name, description, imageURL, websiteURL} = req.body;

    // Validate required fields
    if (!name || !modified_name || !description || !imageURL) {
      return res.status(400).json({ success: false, message: 'Title, description, and imageUrl are required' });
    }

    const db = client.db("Portfolio");
    const projectsCollection = db.collection("Projects");

    // Check if a project with the same title already exists
    const existingProject = await projectsCollection.findOne({ modified_name });
    if (existingProject) {
      return res.status(400).json({ success: false, message: 'A project with the same name already exists' });
    }

    // Create a new project
    const newProject = {
      name,
      modified_name,
      description,
      imageURL,
      websiteURL,
      // Add other fields as needed
    };

    // Insert the new project into the database
    const result = await projectsCollection.insertOne(newProject);

    if (result && result.acknowledged) {
      return res.status(201).json({ success: true, message: 'Project created successfully' });
    } else {
      console.error('Failed to insert project into the database:', result);
      return res.status(500).json({ success: false, message: 'Failed to create project' });
    }
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
})

app.delete('/api/project/:projectModifiedName', async (req, res) => {
  try {
    const projectModifiedName = req.params.projectModifiedName
    const db = client.db("Portfolio");
    const project = await db.collection("Projects").findOne({ modified_name: projectModifiedName });
    if (project) {
      // If project is found, proceed with deletion
      const result = await db.collection("Projects").deleteOne({ modified_name: projectModifiedName });

      if (result.deletedCount === 1) {
        // If the project is successfully deleted
        res.status(200).json({ success: true, message: 'Project deleted successfully' });
      } else {
        // If the project is not deleted (perhaps it doesn't exist)
        res.status(404).json({ success: false, message: 'Project not found or not deleted' });
      }
    } else {
      // If project is not found
      console.log(`Project ${projectModifiedName}) not found`);
      res.status(404).json({ success: false, message: 'Project not found' });
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send("Internal Server Error");
  }
})

app.put('/api/projects/:projectModifiedName', async (req, res) => {
  try {
    const projectToUpdate = req.body;

    const projectId = projectToUpdate._id;
    console.log(projectToUpdate)
    const db = client.db("Portfolio");
    const result = await db
      .collection("Projects")
      .updateOne({ _id: new ObjectId(projectId) }, { $set: projectToUpdate });
    console.log(result)
    if (result.modifiedCount === 1) {
      res.status(200).json({ success: true, message: 'Project updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Project not found or not updated' });
    }
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).send("Internal Server Error");
  }
});

/*************************************
 * 
 *      HISTORIES
 * 
 ************************************/

app.get('/api/histories', async (req, res) => {
  try {
    const db = client.db("Portfolio");
    const histories = await db.collection("Histories").find({}).toArray();
    res.send(histories);
  } catch (error) {
    console.error("Error fetching histories:", error);
    res.status(500).send("Internal Server Error");
  }
})

app.post('/api/histories', async (req, res) => {
  try {
    const { text, imageURL } = req.body;

    // Validate required fields
    if (!text || !imageURL) {
      return res.status(400).json({ success: false, message: 'Text, and imageUrl are required' });
    }

    const db = client.db("Portfolio");
    const historiesCollection = db.collection("Histories");

    // Create a new project
    const newHistory = {
      text,
      imageURL
    };

    // Insert the new project into the database
    const result = await historiesCollection.insertOne(newHistory);

    if (result && result.acknowledged) {
      return res.status(201).json({ success: true, message: 'Project created successfully' });
    } else {
      console.error('Failed to insert project into the database:', result);
      return res.status(500).json({ success: false, message: 'Failed to create project' });
    }
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
})

/*************************************
 *
 *      CONSULTATION TIMES
 *  
 ************************************/

app.get('/api/consultations', async (req, res) => {
  try {
    const db = client.db("Portfolio");
    const consultations = await db.collection("Consultations").find({}).toArray();
    console.log(consultations)
    res.send(consultations);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send("Internal Server Error");
  }
})

app.post('/api/consultations', async (req, res) => {
  try {
    const newConsultationDate = {
      date: req.body.date, // Assuming the date is sent in the request body
    };

    // Validate that the date is not before the current day
    const currentDate = new Date();
    const consultationDate = new Date(newConsultationDate.date);

    if (consultationDate < currentDate) {
      return res.status(400).json({ error: 'Consultation date cannot be before the current day.' });
    }

    // Check if the date already exists in the database
    const db = client.db("Portfolio");
    const existingDate = await db.collection('Consultations').findOne({ date: newConsultationDate.date });

    if (existingDate) {
      return res.status(400).json({ error: 'Consultation date already exists.' });
    }

    // If the date is valid and does not exist, insert it into the database
    const result = await db.collection('Consultations').insertOne(newConsultationDate);

    const response = {
      id: result.insertedId,
      date: newConsultationDate.date,
    };

    // Return the custom response as JSON
    res.status(201).json(response);

  } catch (error) {
    console.error('Error inserting consultation date:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/deletePastDocuments', async (req, res) => {
  const db = client.db('Portfolio');
  const collection = db.collection('Consultations');
  const pastTimeThreshold = new Date();

  const query = { date: { $lt: pastTimeThreshold } };

  try {
    // Delete documents that match the query
    const result = await collection.deleteMany(query);
    console.log(`${result.deletedCount} document(s) deleted`);
    res.status(200).json({ message: `${result.deletedCount} document(s) deleted` });
  } catch (error) {
    console.error('Error deleting documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


/*************************************
 *
 *      PAGES
 *  
 ************************************/

app.get('/api/openpage', (req, res) => {
  res.send("OpenPage")
})

app.get('/api/contact', (req, res) => {
  res.send("Contact")
})

app.get('/api/dashboard', checkAuthenticated, (req, res) => {
  res.send("AdminPage");
})

process.on('SIGINT', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

app.use(express.static(path.join(__dirname, 'public/dist')));

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});