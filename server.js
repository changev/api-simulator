// server.js
const path = require('path')
const http = require('http')
const md5 = require('md5')
const jsonServer = require('./src/server')
const app = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const rewriter = jsonServer.rewriter(require(path.join(__dirname, 'routes.json')))
const middlewares = jsonServer.defaults()
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(middlewares)

// customized middlewares
function authValidator (req, res, next) {
  if(req.url === "/login" || req.headers['token']){
    next()
  } else {
    res.sendStatus(401);
  }
}
app.use(authValidator)
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// customized routes
// login
app.post('/login', (req, res) => {
  var params = req.body;
  var db = require(path.join(__dirname, 'db.json'));
  var users = db.users;
  for (var i = 0; i < users.length; i++) {
    if (params && params.username === user[i].username && params.password === users[i].password){
       res.status(200).send({'token': md5(user[i].username+user[i].password)});
       return;
     }
  }
  res.status(401).send({'msg': 'Wrong username or password'});
})

app.get('/users/current', (req, res) => {
  var token = req.headers.token;
  var db = require(path.join(__dirname, 'db.json'));
  var users = db.users;
  for (var i = 0; i < users.length; i++) {
    var thisToken = md5(users[i].username + users[i].password);
    if(thisToken === token){
      res.status(200).send(users[i]);
      return;
    }
  }
  res.status(200).send({});
})

var db = require(path.join(__dirname, 'db.json'))
app.get('/inventory/devices/count_by_type', (req, res) => {
  res.status(200).send(db.devicesTypeCounts[0]);
})
app.get('/inventory/devices/count_by_status', (req, res) => {
  res.status(200).send(db.devicesStatusCounts[0]);
})

app.use(rewriter)
app.use(router)

var httpServer = http.createServer(app)
httpServer.listen(9998, () => {
  console.log('JSON Server is running')
})

const io = require('socket.io')(httpServer);
io.on('connection', (socketServer) => {
  socketServer.on('apisimulatorstop', () => {
    process.exit(0);
  });
});
