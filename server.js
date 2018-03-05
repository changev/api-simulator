// server.js
const path = require('path')
const http = require('http')
const jsonServer = require('./src/server')
const app = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const rewriter = jsonServer.rewriter(require(path.join(__dirname, 'routes.json')))
const middlewares = jsonServer.defaults()
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

// customized middlewares
function authValidator (req, res, next) {
  if(req.url === "/login" || req.headers['token']){
    next()
  } else {
    res.sendStatus(401);
  }
}

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// customized routes
// login
const username = 'admin'
const password = 'admin'
app.post('/login', (req, res) => {
  var params = req.body;
  if (params && params.username === username && params.password === password){
     res.status(200).send({'token': '12345'});
  } else {
     res.status(401).send({'msg': 'Wrong username or password'});
  }
})

console.log(middlewares)
app.use(middlewares)
app.use(authValidator)
// app.use(rewriter)
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
