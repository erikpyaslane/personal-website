"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _express = _interopRequireDefault(require("express"));
var bodyParser = require('body-parser');
var path = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
var cors = require('cors');
var bcrypt = require('bcrypt');
var passport = require('passport');
var flash = require('express-flash');
var session = require('express-session');
var methodOverride = require('method-override');
var initializePassport = require('./passport-config');
var _require = require('mongodb'),
  MongoClient = _require.MongoClient,
  ServerApiVersion = _require.ServerApiVersion,
  ObjectId = _require.ObjectId;
var uri = "mongodb+srv://erikpyaslane:tfxzxxkd8u@portfolio.4dktmad.mongodb.net/?retryWrites=true&w=majority";
var client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

/*************************************
 *
 *      DATABASE
 *  
 ************************************/
function connectToDatabase() {
  return _connectToDatabase.apply(this, arguments);
}
function _connectToDatabase() {
  _connectToDatabase = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14() {
    return _regenerator["default"].wrap(function _callee14$(_context14) {
      while (1) switch (_context14.prev = _context14.next) {
        case 0:
          _context14.prev = 0;
          _context14.next = 3;
          return client.connect();
        case 3:
          console.log("Connected to MongoDB");
          _context14.next = 10;
          break;
        case 6:
          _context14.prev = 6;
          _context14.t0 = _context14["catch"](0);
          console.error("Error connecting to MongoDB:", _context14.t0);
          throw _context14.t0;
        case 10:
        case "end":
          return _context14.stop();
      }
    }, _callee14, null, [[0, 6]]);
  }));
  return _connectToDatabase.apply(this, arguments);
}
function closeDatabaseConnection() {
  return _closeDatabaseConnection.apply(this, arguments);
} // Connect to MongoDB when the application starts
function _closeDatabaseConnection() {
  _closeDatabaseConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15() {
    return _regenerator["default"].wrap(function _callee15$(_context15) {
      while (1) switch (_context15.prev = _context15.next) {
        case 0:
          _context15.prev = 0;
          _context15.next = 3;
          return client.close();
        case 3:
          console.log("Closed MongoDB connection");
          _context15.next = 10;
          break;
        case 6:
          _context15.prev = 6;
          _context15.t0 = _context15["catch"](0);
          console.error("Error closing MongoDB connection:", _context15.t0);
          throw _context15.t0;
        case 10:
        case "end":
          return _context15.stop();
      }
    }, _callee15, null, [[0, 6]]);
  }));
  return _closeDatabaseConnection.apply(this, arguments);
}
connectToDatabase()["catch"](console.dir);
var fetchAdminUserById = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(id) {
    var db;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          db = client.db("Portfolio");
          _context.next = 3;
          return db.collection("Admins").findOne({
            id: id
          });
        case 3:
          return _context.abrupt("return", _context.sent);
        case 4:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function fetchAdminUserById(_x) {
    return _ref.apply(this, arguments);
  };
}();
var fetchAdminUserByUsername = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(username) {
    var db;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          db = client.db("Portfolio");
          _context2.next = 3;
          return db.collection("Admins").findOne({
            username: username
          });
        case 3:
          return _context2.abrupt("return", _context2.sent);
        case 4:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return function fetchAdminUserByUsername(_x2) {
    return _ref2.apply(this, arguments);
  };
}();
initializePassport(passport, fetchAdminUserById, fetchAdminUserByUsername);
var app = (0, _express["default"])();
app.use(_express["default"].json());
app.use(flash());
app.use(bodyParser.json());
app.use(cors());
app.use(session({
  secret: 'your-secret-key',
  // Replace with a secure secret key
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000 // Example: 1 hour
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use('/images', _express["default"]["static"](path.join(__dirname, "../assets")));
app.use(_express["default"]["static"](path.resolve(__dirname, "../dist"), {
  maxAge: '1y',
  etag: false
}));
app.get('/api/login', checkNotAuthenticated, function (req, res) {
  res.send("LoginPage");
});
app.post('/api/login', passport.authenticate('local', {
  successRedirect: '/api/dashboard',
  failureRedirect: '/api/login',
  failureFlash: true
}));
app["delete"]('/api/logout', function (req, res) {
  req.logOut();

  // Clear the session (example for Express session)
  req.session.destroy(function (err) {
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
    return res.redirect('/api/dashboard');
  }
  next();
}

/*************************************
 *
 *      PROJECTS 
 *  
 ************************************/

app.get('/api/projects', /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var db, projects;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          db = client.db("Portfolio");
          _context3.next = 4;
          return db.collection("Projects").find({}).toArray();
        case 4:
          projects = _context3.sent;
          res.send(projects);
          _context3.next = 12;
          break;
        case 8:
          _context3.prev = 8;
          _context3.t0 = _context3["catch"](0);
          console.error("Error fetching projects:", _context3.t0);
          res.status(500).send("Internal Server Error");
        case 12:
        case "end":
          return _context3.stop();
      }
    }, _callee3, null, [[0, 8]]);
  }));
  return function (_x3, _x4) {
    return _ref3.apply(this, arguments);
  };
}());
app.get('/api/project/:projectModifiedName', /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(req, res) {
    var projectModifiedName, db, project;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          projectModifiedName = req.params.projectModifiedName;
          db = client.db("Portfolio");
          _context4.next = 5;
          return db.collection("Projects").findOne({
            modified_name: projectModifiedName
          });
        case 5:
          project = _context4.sent;
          res.json(project);
          _context4.next = 13;
          break;
        case 9:
          _context4.prev = 9;
          _context4.t0 = _context4["catch"](0);
          console.error("Error fetching projects:", _context4.t0);
          res.status(500).send("Internal Server Error");
        case 13:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[0, 9]]);
  }));
  return function (_x5, _x6) {
    return _ref4.apply(this, arguments);
  };
}());
app.post('/api/projects', /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(req, res) {
    var _req$body, name, modified_name, description, imageURL, websiteURL, db, projectsCollection, existingProject, newProject, result;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _req$body = req.body, name = _req$body.name, modified_name = _req$body.modified_name, description = _req$body.description, imageURL = _req$body.imageURL, websiteURL = _req$body.websiteURL; // Validate required fields
          if (!(!name || !modified_name || !description || !imageURL)) {
            _context5.next = 4;
            break;
          }
          return _context5.abrupt("return", res.status(400).json({
            success: false,
            message: 'Title, description, and imageUrl are required'
          }));
        case 4:
          db = client.db("Portfolio");
          projectsCollection = db.collection("Projects"); // Check if a project with the same title already exists
          _context5.next = 8;
          return projectsCollection.findOne({
            modified_name: modified_name
          });
        case 8:
          existingProject = _context5.sent;
          if (!existingProject) {
            _context5.next = 11;
            break;
          }
          return _context5.abrupt("return", res.status(400).json({
            success: false,
            message: 'A project with the same name already exists'
          }));
        case 11:
          // Create a new project
          newProject = {
            name: name,
            modified_name: modified_name,
            description: description,
            imageURL: imageURL,
            websiteURL: websiteURL
            // Add other fields as needed
          }; // Insert the new project into the database
          _context5.next = 14;
          return projectsCollection.insertOne(newProject);
        case 14:
          result = _context5.sent;
          if (!(result && result.acknowledged)) {
            _context5.next = 19;
            break;
          }
          return _context5.abrupt("return", res.status(201).json({
            success: true,
            message: 'Project created successfully'
          }));
        case 19:
          console.error('Failed to insert project into the database:', result);
          return _context5.abrupt("return", res.status(500).json({
            success: false,
            message: 'Failed to create project'
          }));
        case 21:
          _context5.next = 27;
          break;
        case 23:
          _context5.prev = 23;
          _context5.t0 = _context5["catch"](0);
          console.error('Error creating project:', _context5.t0);
          res.status(500).json({
            success: false,
            message: 'Internal Server Error'
          });
        case 27:
        case "end":
          return _context5.stop();
      }
    }, _callee5, null, [[0, 23]]);
  }));
  return function (_x7, _x8) {
    return _ref5.apply(this, arguments);
  };
}());
app["delete"]('/api/project/:projectModifiedName', /*#__PURE__*/function () {
  var _ref6 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(req, res) {
    var projectModifiedName, db, project, result;
    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          projectModifiedName = req.params.projectModifiedName;
          db = client.db("Portfolio");
          _context6.next = 5;
          return db.collection("Projects").findOne({
            modified_name: projectModifiedName
          });
        case 5:
          project = _context6.sent;
          if (!project) {
            _context6.next = 13;
            break;
          }
          _context6.next = 9;
          return db.collection("Projects").deleteOne({
            modified_name: projectModifiedName
          });
        case 9:
          result = _context6.sent;
          if (result.deletedCount === 1) {
            // If the project is successfully deleted
            res.status(200).json({
              success: true,
              message: 'Project deleted successfully'
            });
          } else {
            // If the project is not deleted (perhaps it doesn't exist)
            res.status(404).json({
              success: false,
              message: 'Project not found or not deleted'
            });
          }
          _context6.next = 15;
          break;
        case 13:
          // If project is not found
          console.log("Project ".concat(projectModifiedName, ") not found"));
          res.status(404).json({
            success: false,
            message: 'Project not found'
          });
        case 15:
          _context6.next = 21;
          break;
        case 17:
          _context6.prev = 17;
          _context6.t0 = _context6["catch"](0);
          console.error("Error fetching projects:", _context6.t0);
          res.status(500).send("Internal Server Error");
        case 21:
        case "end":
          return _context6.stop();
      }
    }, _callee6, null, [[0, 17]]);
  }));
  return function (_x9, _x10) {
    return _ref6.apply(this, arguments);
  };
}());
app.put('/api/projects/:projectModifiedName', /*#__PURE__*/function () {
  var _ref7 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(req, res) {
    var projectToUpdate, projectId, db, result;
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          projectToUpdate = req.body;
          projectId = projectToUpdate._id;
          console.log(projectToUpdate);
          db = client.db("Portfolio");
          _context7.next = 7;
          return db.collection("Projects").updateOne({
            _id: new ObjectId(projectId)
          }, {
            $set: projectToUpdate
          });
        case 7:
          result = _context7.sent;
          console.log(result);
          if (result.modifiedCount === 1) {
            res.status(200).json({
              success: true,
              message: 'Project updated successfully'
            });
          } else {
            res.status(404).json({
              success: false,
              message: 'Project not found or not updated'
            });
          }
          _context7.next = 16;
          break;
        case 12:
          _context7.prev = 12;
          _context7.t0 = _context7["catch"](0);
          console.error("Error updating project:", _context7.t0);
          res.status(500).send("Internal Server Error");
        case 16:
        case "end":
          return _context7.stop();
      }
    }, _callee7, null, [[0, 12]]);
  }));
  return function (_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}());

/*************************************
 * 
 *      HISTORIES
 * 
 ************************************/

app.get('/api/histories', /*#__PURE__*/function () {
  var _ref8 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(req, res) {
    var db, histories;
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          db = client.db("Portfolio");
          _context8.next = 4;
          return db.collection("Histories").find({}).toArray();
        case 4:
          histories = _context8.sent;
          res.send(histories);
          _context8.next = 12;
          break;
        case 8:
          _context8.prev = 8;
          _context8.t0 = _context8["catch"](0);
          console.error("Error fetching histories:", _context8.t0);
          res.status(500).send("Internal Server Error");
        case 12:
        case "end":
          return _context8.stop();
      }
    }, _callee8, null, [[0, 8]]);
  }));
  return function (_x13, _x14) {
    return _ref8.apply(this, arguments);
  };
}());
app.post('/api/histories', /*#__PURE__*/function () {
  var _ref9 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(req, res) {
    var _req$body2, text, imageURL, db, historiesCollection, newHistory, result;
    return _regenerator["default"].wrap(function _callee9$(_context9) {
      while (1) switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          _req$body2 = req.body, text = _req$body2.text, imageURL = _req$body2.imageURL; // Validate required fields
          if (!(!text || !imageURL)) {
            _context9.next = 4;
            break;
          }
          return _context9.abrupt("return", res.status(400).json({
            success: false,
            message: 'Text, and imageUrl are required'
          }));
        case 4:
          db = client.db("Portfolio");
          historiesCollection = db.collection("Histories"); // Create a new project
          newHistory = {
            text: text,
            imageURL: imageURL
          }; // Insert the new project into the database
          _context9.next = 9;
          return historiesCollection.insertOne(newHistory);
        case 9:
          result = _context9.sent;
          if (!(result && result.acknowledged)) {
            _context9.next = 14;
            break;
          }
          return _context9.abrupt("return", res.status(201).json({
            success: true,
            message: 'Project created successfully'
          }));
        case 14:
          console.error('Failed to insert project into the database:', result);
          return _context9.abrupt("return", res.status(500).json({
            success: false,
            message: 'Failed to create project'
          }));
        case 16:
          _context9.next = 22;
          break;
        case 18:
          _context9.prev = 18;
          _context9.t0 = _context9["catch"](0);
          console.error('Error creating project:', _context9.t0);
          res.status(500).json({
            success: false,
            message: 'Internal Server Error'
          });
        case 22:
        case "end":
          return _context9.stop();
      }
    }, _callee9, null, [[0, 18]]);
  }));
  return function (_x15, _x16) {
    return _ref9.apply(this, arguments);
  };
}());

/*************************************
 *
 *      CONSULTATION TIMES
 *  
 ************************************/

app.get('/api/consultations', /*#__PURE__*/function () {
  var _ref10 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(req, res) {
    var db, consultations;
    return _regenerator["default"].wrap(function _callee10$(_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          db = client.db("Portfolio");
          _context10.next = 4;
          return db.collection("Consultations").find({}).toArray();
        case 4:
          consultations = _context10.sent;
          console.log(consultations);
          res.send(consultations);
          _context10.next = 13;
          break;
        case 9:
          _context10.prev = 9;
          _context10.t0 = _context10["catch"](0);
          console.error("Error fetching projects:", _context10.t0);
          res.status(500).send("Internal Server Error");
        case 13:
        case "end":
          return _context10.stop();
      }
    }, _callee10, null, [[0, 9]]);
  }));
  return function (_x17, _x18) {
    return _ref10.apply(this, arguments);
  };
}());
app.post('/api/consultations', /*#__PURE__*/function () {
  var _ref11 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(req, res) {
    var newConsultationDate, currentDate, consultationDate, db, existingDate, result, response;
    return _regenerator["default"].wrap(function _callee11$(_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          newConsultationDate = {
            date: req.body.date // Assuming the date is sent in the request body
          }; // Validate that the date is not before the current day
          currentDate = new Date();
          consultationDate = new Date(newConsultationDate.date);
          if (!(consultationDate < currentDate)) {
            _context11.next = 6;
            break;
          }
          return _context11.abrupt("return", res.status(400).json({
            error: 'Consultation date cannot be before the current day.'
          }));
        case 6:
          // Check if the date already exists in the database
          db = client.db("Portfolio");
          _context11.next = 9;
          return db.collection('Consultations').findOne({
            date: newConsultationDate.date
          });
        case 9:
          existingDate = _context11.sent;
          if (!existingDate) {
            _context11.next = 12;
            break;
          }
          return _context11.abrupt("return", res.status(400).json({
            error: 'Consultation date already exists.'
          }));
        case 12:
          _context11.next = 14;
          return db.collection('Consultations').insertOne(newConsultationDate);
        case 14:
          result = _context11.sent;
          response = {
            id: result.insertedId,
            date: newConsultationDate.date
          }; // Return the custom response as JSON
          res.status(201).json(response);
          _context11.next = 23;
          break;
        case 19:
          _context11.prev = 19;
          _context11.t0 = _context11["catch"](0);
          console.error('Error inserting consultation date:', _context11.t0);
          res.status(500).json({
            error: 'Internal Server Error'
          });
        case 23:
        case "end":
          return _context11.stop();
      }
    }, _callee11, null, [[0, 19]]);
  }));
  return function (_x19, _x20) {
    return _ref11.apply(this, arguments);
  };
}());
app["delete"]('/api/deletePastDocuments', /*#__PURE__*/function () {
  var _ref12 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12(req, res) {
    var db, collection, pastTimeThreshold, query, result;
    return _regenerator["default"].wrap(function _callee12$(_context12) {
      while (1) switch (_context12.prev = _context12.next) {
        case 0:
          db = client.db('Portfolio');
          collection = db.collection('Consultations');
          pastTimeThreshold = new Date();
          query = {
            date: {
              $lt: pastTimeThreshold
            }
          };
          _context12.prev = 4;
          _context12.next = 7;
          return collection.deleteMany(query);
        case 7:
          result = _context12.sent;
          console.log("".concat(result.deletedCount, " document(s) deleted"));
          res.status(200).json({
            message: "".concat(result.deletedCount, " document(s) deleted")
          });
          _context12.next = 16;
          break;
        case 12:
          _context12.prev = 12;
          _context12.t0 = _context12["catch"](4);
          console.error('Error deleting documents:', _context12.t0);
          res.status(500).json({
            error: 'Internal Server Error'
          });
        case 16:
        case "end":
          return _context12.stop();
      }
    }, _callee12, null, [[4, 12]]);
  }));
  return function (_x21, _x22) {
    return _ref12.apply(this, arguments);
  };
}());

/*************************************
 *
 *      PAGES
 *  
 ************************************/

app.get('/api/openpage', function (req, res) {
  res.send("OpenPage");
});
app.get('/api/contact', function (req, res) {
  res.send("Contact");
});
app.get('/api/dashboard', checkAuthenticated, function (req, res) {
  res.send("AdminPage");
});
process.on('SIGINT', /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13() {
  return _regenerator["default"].wrap(function _callee13$(_context13) {
    while (1) switch (_context13.prev = _context13.next) {
      case 0:
        _context13.next = 2;
        return closeDatabaseConnection();
      case 2:
        process.exit(0);
      case 3:
      case "end":
        return _context13.stop();
    }
  }, _callee13);
})));
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
var port = process.env.PORT || 8000;
app.listen(port, function () {
  console.log("Server is listening on port ".concat(port));
});