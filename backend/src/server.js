import express from 'express';
import multer from 'multer';
const path = require('path');

const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const cors = require('cors');
const flash = require('express-flash')
const methodOverride = require('method-override');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './assets'); // Specify the directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename the file to avoid conflicts
  }
});


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

const app = express();
app.use(express.json());
app.use(flash());
app.use(bodyParser.json());
app.use(cors());

app.use(methodOverride('_method'))

app.use('/images', express.static(path.join(__dirname, "../assets")))
app.use(express.static(path.resolve(__dirname, "../dist"),
  { maxAge: '1y', etag: false },));


/*************************************
 *
 *      AUTHENTICATION
 *
 ************************************/

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(username)
  console.log(password)
  try {
    const db = client.db('Portfolio');
    const users = db.collection('Admins');
    const user = await users.findOne({ username });
    console.log(user)
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, 'secretkey', { expiresIn: '1h' });
    console.log(token)
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


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
    const { name, modified_name, description, imageURL, websiteURL } = req.body;

    // Validate required fields
    if (!name || !modified_name || !description || !imageURL) {
      return res.status(400).json({ success: false, message: 'Title, description, and imageUrl are required' });
    }

    const db = client.db("Portfolio");
    const projectsCollection = db.collection("Projects");

    const lastProject = await projectsCollection.findOne({}, { sort: { "_id": -1 } });

    let _id;
    if (lastProject == null)
      _id = 1
    else
      _id = lastProject._id + 1

    const existingProject = await projectsCollection.findOne({ modified_name });
    if (existingProject) {
      return res.status(400).json({ success: false, message: 'A project with the same name already exists' });
    }
    // Create a new project
    const newProject = {
      _id,
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

app.put('/api/project/:projectModifiedName', async (req, res) => {
  try {
    const projectToUpdate = req.body;
    console.log(projectToUpdate)
    const projectId = projectToUpdate._id;
    const db = client.db("Portfolio");
    const result = await db
      .collection("Projects")
      .updateOne({ _id: projectId }, { $set: projectToUpdate });
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

app.get('/api/histories/:historyID', async (req, res) => {
  try {
    const historyIDstr = req.params.historyID
    const historyID = parseInt(historyIDstr)
    const db = client.db("Portfolio");
    const history = await db.collection("Histories").findOne({ _id: historyID });
    console.log(history)
    res.json(history);
  } catch (error) {
    console.error("Error fetching projects:", error);
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

    const lastHistory = await historiesCollection.findOne({}, { sort: { "_id": -1 } });

    let _id;
    if (lastHistory == null)
      _id = 1
    else
      _id = lastHistory._id + 1

    const newHistory = {
      _id,
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

app.delete('/api/histories/:historyID', async (req, res) => {
  try {
    const historyID = parseInt(req.params.historyID)
    const db = client.db("Portfolio");
    const history = await db.collection("Histories").findOne({ _id: historyID });
    if (history) {
      // If project is found, proceed with deletion
      const result = await db.collection("Histories").deleteOne({ _id: historyID });

      if (result.deletedCount === 1) {
        // If the project is successfully deleted
        res.status(200).json({ success: true, message: 'History deleted successfully' });
      } else {
        // If the project is not deleted (perhaps it doesn't exist)
        res.status(404).json({ success: false, message: 'History not found or not deleted' });
      }
    } else {
      // If project is not found
      console.log(`History ID ${historyID}) not found`);
      res.status(404).json({ success: false, message: 'History not found' });
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send("Internal Server Error");
  }
})

app.put('/api/histories/:historyID', async (req, res) => {
  try {
    const historyToUpdate = req.body;
    const historyID = parseInt(req.params.historyID)
    console.log(historyID)
    const db = client.db("Portfolio");
    const result = await db
      .collection("Histories")
      .updateOne({ _id: historyID }, { $set: historyToUpdate });
    if (result.modifiedCount === 1) {
      res.status(200).json({ success: true, message: 'History updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'History not found or not updated' });
    }
  } catch (error) {
    console.error("Error updating history:", error);
    res.status(500).send("Internal Server Error");
  }
}
)

/*************************************
 *
 *      NEWS
 *  
 ************************************/

app.get('/api/news', async (req, res) => {
  const { projectID } = req.query;
  try {
    const db = client.db("Portfolio");
    const news = await db.collection("News").find({ projectID: parseInt(projectID) }).toArray();
    res.send(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).send("Internal Server Error");
  }
})

app.post('/api/news', async (req, res) => {
  try {
    const db = client.db("Portfolio");
    // Validate that the date is not before the current day
    const date = new Date();
    console.log(date);

    const lastNews = await db.collection("News").findOne({}, { sort: { "_id": -1 } });

    let _id;
    if (lastNews == null)
      _id = 1
    else
      _id = lastNews._id + 1

    const { title, projectID, imageURL, text } = req.body;
    console.log(projectID);
    const news = {
      _id,
      title,
      projectID,
      date,
      imageURL,
      text,
    }

    // If the date is valid and does not exist, insert it into the database
    const result = await db.collection('News').insertOne(news);

    if (result && result.acknowledged) {
      return res.status(201).json({ success: true, message: 'News created successfully' });
    } else {
      console.error('Failed to insert project into the database:', result);
      return res.status(500).json({ success: false, message: 'Failed to create news' });
    }
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.get('/api/news/:newsID', async (req, res) => {
  try {
    const newsID = parseInt(req.params.newsID);
    const db = client.db("Portfolio");
    const news = await db.collection("News").findOne({ _id: newsID });
    res.send(news);

  } catch (err) {
    console.error('No news with such id');
  }
});

app.delete('/api/news/:newsID', async (req, res) => {
  try {
    const newsID = parseInt(req.params.newsID)
    const db = client.db("Portfolio");
    const news = await db.collection("News").findOne({ _id: newsID });
    if (news) {
      // If project is found, proceed with deletion
      const result = await db.collection("News").deleteOne({ _id: newsID });

      if (result.deletedCount === 1) {
        // If the project is successfully deleted
        res.status(200).json({ success: true, message: 'News deleted successfully' });
      } else {
        // If the project is not deleted (perhaps it doesn't exist)
        res.status(404).json({ success: false, message: 'News not found or not deleted' });
      }
    } else {
      // If project is not found
      console.log(`News ID ${newsID}) not found`);
      res.status(404).json({ success: false, message: 'News not found' });
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).send("Internal Server Error");
  }
})

app.put("/api/news/:newsID", async (req, res) => {
  try {
    const newsToUpdate = req.body;

    const newsID = parseInt(req.params.newsID);
    console.log(newsID);
    const db = client.db("Portfolio");
    const result = await db
      .collection("News")
      .updateOne({ _id: newsID }, { $set: newsToUpdate });
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
 *      FEEDBACKS
 *
 ************************************/

app.get('/api/feedbacks', async (req, res) => {
  try {
    const db = client.db("Portfolio");
    const feedbacks = await db.collection("Feedbacks").find({}).toArray();
    res.send(feedbacks);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).send("Internal Server Error");
  }
})

app.post('/api/feedbacks', async (req, res) => {
  try {
    const { name, text } = req.body;
    console.log(name)
    // Validate required fields
    if (!text || !name) {
      return res.status(400).json({ success: false, message: 'Text and name are required' });
    }

    const db = client.db("Portfolio");
    const feedbacksCollection = db.collection("Feedbacks");

    const lastFeedback = await feedbacksCollection.findOne({}, { sort: { "_id": -1 } });

    let _id;
    if (lastFeedback == null)
      _id = 1
    else
      _id = lastFeedback._id + 1

    const newFeedback = {
      _id,
      name,
      text
    };

    // Insert the new project into the database
    const result = await feedbacksCollection.insertOne(newFeedback);

    if (result && result.acknowledged) {
      return res.status(201).json({ success: true, message: 'Feedback created successfully' });
    } else {
      console.error('Failed to insert feedback into the database:', result);
      return res.status(500).json({ success: false, message: 'Failed to create feedback' });
    }
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
})

app.delete('/api/feedbacks/:feedbackID', async (req, res) => {
  try {
    const feedbackID = parseInt(req.params.feedbackID)
    const db = client.db("Portfolio");
    const feedback = await db.collection("Feedbacks").findOne({ _id: feedbackID });
    if (feedback) {
      // If project is found, proceed with deletion
      const result = await db.collection("Feedbacks").deleteOne({ _id: feedbackID });

      if (result.deletedCount === 1) {
        // If the project is successfully deleted
        res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
      } else {
        // If the project is not deleted (perhaps it doesn't exist)
        res.status(404).json({ success: false, message: 'Feedback not found or not deleted' });
      }
    } else {
      // If project is not found
      console.log(`Feedback ID ${feedbackID}) not found`);
      res.status(404).json({ success: false, message: 'Feedback not found' });
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send("Internal Server Error");
  }
})


/************************************
 * 
 *      MESSAGES
 * 
 ***********************************/


app.get('/api/messages', async (req, res) => {
  try {
    const db = client.db("Portfolio");
    const messages = await db.collection("Messages").find({}).toArray();
    res.send(messages);
  } catch (error) {
    console.error("Error fetching messages: ", error);
    res.status(500).send("Internal Server Error")
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { first_name, last_name, email, telephone, project, text, date } = req.body;
    const db = client.db("Portfolio");
    const lastMessage = await db.collection("Messages").findOne({}, { sort: { "_id": -1 } });

    let _id;
    if (lastMessage == null)
      _id = 1
    else
      _id = lastMessage._id + 1

    const newMessageToAdd = {
      _id,
      first_name,
      last_name,
      email,
      telephone,
      project,
      text,
      date 
    }  
    console.log(newMessageToAdd)
    const result = await db.collection('Messages').insertOne(newMessageToAdd);
    console.log(result)
    if (result && result.acknowledged) {
      return res.status(201).json({ success: true, message: 'Message sent successfully' });
    } else {
      console.error('Failed to insert project into the database:', result);
      return res.status(500).json({ success: false, message: 'Failed to send message' });
    }

  } catch (error) {
    console.error("Error fetching messages: ", error);
  }
})


/*************************************
 * 
 *      IMAGES
 * 
 ************************************/

app.get('/api/images', async (req, res) => {
  console.log(req.query)
  const { projectID } = req.query;
  console.log(projectID);
  try {
    const db = client.db("Portfolio");
    const images = await db.collection("Images").find({ projectID: parseInt(projectID) }).toArray();
    console.log(images)
    res.send(images);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).send("Internal Server Error");
  }
})

const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
  // Here you can handle the uploaded image
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }
  // You can perform further processing with the uploaded file here
  res.send('File uploaded successfully.');
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

app.get('/api/dashboard', (req, res) => {
  res.send("AdminPage");
})

process.on('SIGINT', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});