// server.js
const path = require('path')
const http = require('http')
const md5 = require('md5')
const jsonServer = require('./src/server')
const app = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const rewriter = jsonServer.rewriter(require(path.join(__dirname, 'routes.json')))
const middlewares = jsonServer.defaults()
const XMLHttpRequest = require('xmlhttprequest')
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(middlewares)

// customized middlewares
function authValidator (req, res, next) {
  if(req.url === "/login" || req.url.includes("/users") || req.headers['token']){
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
  var users = reloadJsonData().users;
  var guard = true;
  for (var i = 0; i < users.length; i++) {
    if (params && params.username === users[i].username && params.password === users[i].password){
       guard = false;
       res.status(200).send({'token': md5(users[i].username+users[i].password)});
     }
  }
  if(guard) res.status(400).send({'msg': 'Wrong username or password'});
})

app.post('/resetpassword', (req, res) => {
  var params = req.body;
  var users = reloadJsonData().users;
  var guard = true;
  for (var i = 0; i < users.length; i++) {
    if (params && params.email=== users[i].email){
       guard = false;
       res.status(200).send();
     }
  }
  if(guard) res.status(404).send({'msg': 'dont find related email'});
})

app.get('/users/current', (req, res) => {
  var token = req.headers.token;
  var users = reloadJsonData().users;
  for (var i = 0; i < users.length; i++) {
    var thisToken = md5(users[i].username + users[i].password);
    if(thisToken === token){
      res.status(200).send(users[i]);
      return;
    }
  }
  res.status(200).send({});
})

app.get('/inventory/devices/count_by_type', (req, res) => {
  var db = require(path.join(__dirname, 'db.json'))
  res.status(200).send(db.devicesTypeCounts[0]);
})
app.get('/inventory/devices/count_by_status', (req, res) => {
  var db = require(path.join(__dirname, 'db.json'))
  res.status(200).send(db.devicesStatusCounts[0]);
})

app.use(rewriter)
app.use(router)

var httpServer = http.createServer(app)
httpServer.listen(9999, () => {
  console.log('JSON Server is running')
})

const io = require('socket.io')(httpServer);
io.on('connection', (socketServer) => {
  socketServer.on('apisimulatorstop', () => {
    process.exit(0);
  });
});

function reloadJsonData(){
  var fs = require('fs');
  var data = fs.readFileSync(path.join(__dirname, 'db.json'), 'utf8');
  var obj = JSON.parse(data);
  return obj;
}
