"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
function initialize(passport, fetchAdminUserById, fetchAdminUserByUsername) {
  var authenticateUser = /*#__PURE__*/function () {
    var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(username, password, done) {
      var user, isPasswordMatch;
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return fetchAdminUserByUsername(username);
          case 3:
            user = _context.sent;
            if (user) {
              _context.next = 6;
              break;
            }
            return _context.abrupt("return", done(null, false, {
              message: 'No user with that username'
            }));
          case 6:
            if (!user.password) {
              _context.next = 12;
              break;
            }
            _context.next = 9;
            return bcrypt.compare(password, user.password);
          case 9:
            _context.t0 = _context.sent;
            _context.next = 13;
            break;
          case 12:
            _context.t0 = false;
          case 13:
            isPasswordMatch = _context.t0;
            if (!isPasswordMatch) {
              _context.next = 18;
              break;
            }
            return _context.abrupt("return", done(null, user));
          case 18:
            return _context.abrupt("return", done(null, false, {
              message: 'Password incorrect'
            }));
          case 19:
            _context.next = 24;
            break;
          case 21:
            _context.prev = 21;
            _context.t1 = _context["catch"](0);
            return _context.abrupt("return", done(_context.t1));
          case 24:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[0, 21]]);
    }));
    return function authenticateUser(_x, _x2, _x3) {
      return _ref.apply(this, arguments);
    };
  }();
  passport.use(new LocalStrategy({
    usernameField: 'username'
  }, authenticateUser));
  passport.serializeUser(function (user, done) {
    return done(null, user.id);
  });
  passport.deserializeUser( /*#__PURE__*/function () {
    var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(id, done) {
      var user;
      return _regenerator["default"].wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return fetchAdminUserById(id);
          case 3:
            user = _context2.sent;
            return _context2.abrupt("return", done(null, user));
          case 7:
            _context2.prev = 7;
            _context2.t0 = _context2["catch"](0);
            return _context2.abrupt("return", done(_context2.t0));
          case 10:
          case "end":
            return _context2.stop();
        }
      }, _callee2, null, [[0, 7]]);
    }));
    return function (_x4, _x5) {
      return _ref2.apply(this, arguments);
    };
  }());
}
module.exports = initialize;