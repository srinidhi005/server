var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
const exec = require("child_process").exec;
var multer  = require('multer');
const csvtojson =require('csvtojson');
// var JobQueue = require('./worker/job').JobQueue;
var rimraf = require("rimraf");
const ObjectsToCsv = require('objects-to-csv');
var https = require('https');
var request = require('request')
var kue = require('kue')
let queue = kue.createQueue();

const jsonfile = require('jsonfile')
var moment = require('moment');

var fs = require('fs');
const {Storage} = require('@google-cloud/storage');
const cloudStorage = new Storage();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
 
var upload = multer({ storage: storage })

var db = require('./models');


// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
    function(username, password, cb) {
        db.users.findOne({
          where: {
            username: username
          },
          raw: true
        }).then(user => {
          if (!user) { return cb(null, false); }
          if (user.password != password) { return cb(null, false); }
          return cb(null, user);
        }).catch(err => {
          cb(err);
        })
    }
));
  
  
// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});
  
passport.deserializeUser(function(id, cb) {
  db.users.findById(id).then(data => {
    var user = data.get({plain: true})
    cb(null, user);
  }).catch(err => {
    cb(err)
  })
});

var indexRouter = require('./routes/index');

var app = express();

// view engine setup


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use('/public' ,express.static('public'))
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'rmi insight',
  resave: false,
  saveUninitialized: true,
}))
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter(passport));

app.post('/upload', upload.single('file'), function (req, res, next) {
  var {company, period} = req.body;
  var filename = req.file.filename;
  filename = filename.replace(/ /g, '');
  var filepath = 'uploads/'+filename
  fs.renameSync(req.file.path, filepath);
  req.file = Object.assign({}, req.file, {filename: filename, path: filepath})
  db.statement.create({
    status: 'Processing',
    user_id: 1,//req.user.id,
    company: req.body.company,
    period: req.body.period,
    filename: req.file.filename
  }).then(data => {
    company = company.replace(/ /g, '_')
    var job = queue.create('pdf', Object.assign({}, req.file, req.body, {statementId: data.get('id')}));
    var folderName = path.join(__dirname, 'output', company+'-'+period);
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    }
    job.save(function(err, data, data1) {
      if (err) {
        console.log(err);
        res.status(500).status({status: "Internal Server Error"})
      } else {
        res.status(200).send({status: "FILE UPLOADED SUCCESSLY"});
      }
    })
  }).catch(err => {
    console.log(err)
    res.status(500).status({status: "Internal Server Error"})
  })
})

app.post('/doc', function (req, res, next) {
  var validation = function() {
    var {companyName, companyUUID, documentUUID, filePath} = req.body;
    if ((companyName && companyName != '')  && (companyUUID && companyUUID != '') && 
    (documentUUID && documentUUID != '') && (filePath && filePath != '')) {
      return true;
    } else {
      return false;
    }
  }
  if (validation()) {
    var extension = '.pdf';
    var filename;
    var url = req.body.filePath.split('?')[0];
    if (url.indexOf('.csv') != -1) {
      extension = '.csv';
    } else if (url.indexOf('.xlsx') != -1) {
      extension = '.xlsx';
    }
    filename = req.body.documentUUID + extension;
    var file = fs.createWriteStream('uploads/' + filename);
    https.get(req.body.filePath, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(() => {
          db.statement.create({
            status: 'Processing',
            user_id: 2, // req.user.id,
            company: req.body.companyName,
            period: req.body.period,
            companyUUID: req.body.companyUUID,
            documentUUID: req.body.documentUUID,
            filename: filename
          }).then(data => {
            console.log(data.get('id'))
            console.log(data.get({plain: true}))
            var job = queue.create('pdf', Object.assign({}, req.body, {
              company: req.body.companyName,
              path: 'uploads/' + filename,
              statementId: data.get('id'),
              filename: filename,
              originalname: filename
            }));
            var company = req.body.companyName.replace(/ /g, '_')
            var folderName = path.join(__dirname, 'output', company+'-'+req.body.period);
            if (!fs.existsSync(folderName)) {
              fs.mkdirSync(folderName);
            }
            job.save(function(err, data, data1) {
              if (err) {
                console.log(err);
                res.status(500).send({status: "Internal Server Error"});
              } else {
                res.status(200).send({status: "FILE UPLOADED SUCCESSLY"});
              }
            })
          }).catch(err => {
            console.log(err);
            res.status(500).send({status: "Internal Server Error"});
          })
        })
      });
    }).on('error', function(err) {
      console.log(err);
      fs.unlinkSync(filename);
      res.status(500).send({status: "Internal Server Error"});
    })
  } else {
    res.status(400).send({errMsg: "Data is missing"});
  }
})

app.post('/file_data', function(req, res, next) {
  var {id, company, documentUUID, period} = req.query;
  var foldername = company.replace(/ /g, '_');
  foldername = foldername + '-' + (period || 'N');
  var getPeriodValue = function(value, date) {
    if (typeof value !== 'string') {
      return "";
    }
    var val = value.split(',');
    for (var i = 0, len = val.length; i < len; i++) {
      var arr = val[i].split('=');
      var key = arr[0];
      // console.log('arr[1] ----------------- ', arr[1])
      if (key == date) {
        if (arr.length >= 2) {
          if (!arr[1] || arr[1] == '' || isNaN(arr[1])) {
            return "";
          } else {
            return parseFloat(arr[1]);
          }
        } else {
          return "";
        }
      }
    }
  }
  var sendJson = function(documentUUID, rmiJson) {
    return new Promise((resolve, reject) => {
      request({
        method: 'POST',
        uri: 'https://app.rmistaging.com:8443/rmi/api/saveJsonForDocument/'+documentUUID,
        // uri: 'https://app.rmistaging.com:8443/rmi/api/saveJsonForDocument/'+documentUUID,
        // uri: 'http://localhost:4200/api/json?id=' + documentUUID,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(rmiJson)
      }, function (error, response, body) {
        if (error) {
          reject(error)
        }
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
        resolve();
      })
    })
  }
  var totalExist = function(total) {
    if (total && typeof total == 'object' && (total.code || total.value)) {
      return true;
    } else {
      return false;
    }
  }
  var subItems = function(items, date) {
    var newItems = items.map(el => {
      var subItem = Object.assign({}, el);
      delete subItem.type;
      subItem.value = subItem.value ? getPeriodValue(el.value, date) : "";
      if (subItem.total || subItem.total1) {
        if (totalExist(subItem.total)) {
          subItem.total = Object.assign({}, el.total);
          subItem.total.value = subItem.total.value ? getPeriodValue(el.total.value, date) : "";
        }
        if (totalExist(subItem.total1)) {
          subItem.total1 = Object.assign({}, el.total1);
          subItem.total1.value = subItem.total1.value ? getPeriodValue(el.total1.value, date) : "";
        }
      }
      if (Array.isArray(subItem.items) && subItem.items.length > 0) {
        subItem.items = subItems(subItem.items, date)
      }
      return subItem;
    })
    return newItems;
  }
  var jsonData = Object.keys(req.body).map((key, indexmain) => {
    var el = req.body[key];
    el.period = el.asof.map(date => {
      var date = date, formatedDate;
      if (moment(date, 'MMMMDDYYYY', true).isValid()) {
        formatedDate = moment(date, 'MMMMDDYYYY').format('YYYY-MM-DD');
      }
      var obj = {
        asof: formatedDate ? formatedDate : date,
        statement: el.period[0].statement.map((elem, index) => {
          var statement = Object.assign({}, elem);
          delete statement.type;
          statement.value = statement.value ? getPeriodValue(elem.value, date) : "";
          if (totalExist(statement.total)) {
            statement.total = Object.assign({}, elem.total);
            statement.total.value = statement.total.value ? getPeriodValue(elem.total.value, date) : "";
          }
          if (totalExist(statement.total1)) {
            statement.total1 = Object.assign({}, elem.total1);
            statement.total1.value = statement.total1.value ? getPeriodValue(elem.total1.value, date) : "";
          }
          if (Array.isArray(statement.items) && statement.items.length > 0) {
            statement.items = subItems(statement.items, date);
            if (!statement.value || statement.value == '') {
              for (var i = 0, len = statement.items.length; i < len; i++) {
                var subItem = statement.items[i];
                if (typeof subItem.total == 'boolean' && subItem.total) {
                  statement.value = subItem.value;
                  if (!statement.code || statement.code  == '') {
                    statement.code = subItem.code;
                  }
                  break;
                }
              }
            }
          }
          return statement;
        })
      }
      if (el.type == 'statement_of_income' && el.period[0].additional) {
        obj.Additional = el.period[0].additional[date];
      }
      return obj;
    })
    delete el.asof;
    delete el.periodCount;
    return el;
  })
  if (!fs.existsSync('./output/'+foldername)){
    fs.mkdirSync('./output/'+foldername);
  }
  return cloudStorage.bucket('extraction-engine').getFiles({
    prefix: foldername,
  }).then(data => {
    return data[0].map(el => el.name)
  }).then(data => {
    var promises = [];
    files = data;
    files.forEach((el, index) => {
      var obj = jsonData[0], filepath = path.join(__dirname, 'output', el);
      if (index == 1) obj = jsonData[1];
      if (index == 2) obj = jsonData[2];
      promises.push(jsonfile.writeFile (filepath, obj));
    })
    return Promise.all(promises);
  }).then(() => {
    var promises = [];
    files.forEach(el => {
      var filepath = './output/' + el;
      promises.push(cloudStorage.bucket('extraction-engine').upload(filepath, {
        destination: el,
      }));
    })
    return Promise.all(promises);
  }).then(() => {
    if (documentUUID && documentUUID != '') {
      return db.statement.findOne({where: {id: id}, raw: true}).then(data => {
        var rmiJson = {
          "company": data.company, 
          "units": jsonData[0].units,
          "currency": jsonData[0].currency,
          "period": data.period, // possible values [Y=yearly/M=monthly/Q=quartely]
          "income_statement": jsonData.filter(el => el.type.indexOf('statement_of_income') != -1).map(el => el.period)[0],
          "cash_flow": jsonData.filter(el => el.type.indexOf('cash_flow_statement') != -1).map(el => el.period)[0],
          "balance_sheet": jsonData.filter(el => el.type.indexOf('Balance_sheet') != -1).map(el => el.period)[0]
        }
        return sendJson(documentUUID, rmiJson);
      })
    }
  }).then(() => {
    var obj = {
      updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
    }
    if (documentUUID) {
      obj.status = 'Finalized';
    }
    return db.statement.update(obj, {where: {id: id}})
  }).then(() => {
    res.status(200).send({status: 'SUCCESS'})
  })
})

app.get('/file_output', function(req, res, next) {
  var foldername = req.query.file.replace(/ /g, '_'), files;
  foldername = foldername + '-' + req.query.period;
  var promises = [], resp = {tab1: null, tab2: null, tab3: null};
  if (!fs.existsSync('./output/'+foldername)){
    fs.mkdirSync('./output/'+foldername);
  }
  var getFilesList = function() {
    return cloudStorage.bucket('extraction-engine').getFiles({
      prefix: foldername
    }).then(data => {
    return data[0].map(el => el.name)
    })
  }
  var totalExist = function(total) {
    if (total && typeof total == 'object' && (total.code || total.value)) {
      return true;
    } else {
      return false;
    }
  }
  var subItems = function(periodIndex, items, respItems, date) {
    items.forEach((el, elIndex) => {
      if (el && (el.code || el.value)) {
        if (periodIndex == 0) {
          respItems[elIndex].value = date + '=' + el.value;
        } else {
          respItems[elIndex].value += ',' + date + '=' + el.value;
        }
      }
      if (Array.isArray(el.items) && el.items.length > 0) {
        respItems[elIndex].items = subItems(periodIndex, el.items, respItems[elIndex].items, date);
      }
      if (totalExist(el.total)) {
        if (periodIndex == 0) {
          respItems[elIndex].total = Object.assign({}, respItems[elIndex].total, {value: date + '=' + el.total.value});
        } else {
          respItems[elIndex].total.value += ',' + date + '=' + el.total.value;
        }
      }
      if (totalExist(el.total1)) {
        if (periodIndex == 0) {
          respItems[elIndex].total1 = Object.assign({}, respItems[elIndex].total1, {value: date + '=' + el.total1.value});
        } else {
          respItems[elIndex].total1.value += ',' + date + '=' + el.total1.value;
        }
      }
    })
    return respItems;
  }
  getFilesList().then(data => {
    files = data;
    files.forEach(el => {
      promises.push(cloudStorage
        .bucket('extraction-engine')
        .file(el)
        .download({
          destination: path.join(__dirname, 'output', el),
        })
      )
    })
    return Promise.all(promises);
  }).then(() => {
    files.forEach((el, index) => {
      var jsonData = jsonfile.readFileSync(path.join(__dirname, 'output', el));
      var obj = {
        asof: '',
        statement: []
      };
      var tabIndex = 'tab1';
      jsonData.period.forEach((el, elemIndex) => {
        var date = el.asof;
        obj.asof = date;
        if (jsonData.type == 'statement_of_income') {
          if (obj.additional) {
            obj.additional[date] = el.Additional 
          } else {
            obj.additional = {[date]: el.Additional};
          }
        }
        el.statement.forEach((el, sIndex) => {
          if (elemIndex == 0) {
            obj.statement.push(el)
          }
          if (el && (el.code || el.value)) {
            if (elemIndex == 0) {
              obj.statement[sIndex].value = date + '=' + el.value;
            } else {
              obj.statement[sIndex].value += ',' + date + '=' + el.value;
            }
          }
          if (Array.isArray(el.items) && el.items.length > 0) {
            obj.statement[sIndex].items = subItems(elemIndex, el.items, obj.statement[sIndex].items, date);
          }
          if (totalExist(el.total)) {
            if (elemIndex == 0) {
              obj.statement[sIndex].total = Object.assign({}, obj.statement[sIndex].total, {
                value: date + '=' + el.total.value
              });
            } else {
              obj.statement[sIndex].total.value += ',' + date + '=' + el.total.value;
            }
            if (!el.value || el.value == '') {
              obj.statement[sIndex].value = obj.statement[sIndex].total.value;
            }
            if (!el.code || el.code == '') {
              obj.statement[sIndex].code = obj.statement[sIndex].total.code;
            }
          }
          if (totalExist(el.total1)) {
            if (elemIndex == 0) {
              obj.statement[sIndex].total1 = Object.assign({}, obj.statement[sIndex].total1, {
                value: date + '=' + el.total1.value
              });
            } else {
              obj.statement[sIndex].total1.value += ',' + date + '=' + el.total1.value;
            }
            if (!el.value || el.value == '') {
              obj.statement[sIndex].value = obj.statement[sIndex].total1.value;
            }
            if (!el.code || el.code == '') {
              obj.statement[sIndex].code = obj.statement[sIndex].total.code;
            }
          }
        })
      })
      if (jsonData.type == 'statement_of_income') {
        tabIndex = 'tab2';
      } else if (jsonData.type == 'cash_flow_statement') {
        tabIndex = 'tab3';
      }
      resp[tabIndex] = {
        "period": [obj],
        "asof": jsonData.period.map(el => el.asof),
        "periodCount": jsonData.period.length,
        "title": jsonData.title,
        "company": jsonData.company,
        "units":  jsonData.units,
        "currency":  jsonData.currency,
        "type":  jsonData.type
      };
    })
    rimraf.sync(path.join(__dirname, 'output', foldername));
    res.status(200).send({data: resp, dataCopy: JSON.stringify(resp)})
  }).catch(err => {
    console.log(err);
    res.status(500).send({status: "Internal Server Error"})
  })
})

app.get("/index",function(req,res){
	res.render('index');
})
app.get("/index2",function(req,res){
	res.render('index2');
})
app.get("/subscribe",function(req,res){
	res.render('subscribe');
})
 
app.get("/",function(req,res){
    res.render('login');
})
app.get("/register",function(req,res){
    res.render('register');
})
app.get("/source",function(req,res){
    res.render('source');
})

app.get("/subscribe login",function(req,res){
    res.render('subscribe login');
})
app.get("/charts",function(req,res){
    res.render('high Charts');
})
app.get("/file",function(req,res){
    res.render('file upload');
})
app.get("/excel",function(req,res){
    res.render('email');
})
app.get("/connect",function(req,res){
    res.render('quickbooks');
})

app.get("/finan",function(req,res){
	res.render('financial');
})
app.get("/target",function(req,res){
	res.render('targetvsactual');
})
app.get("/actual",function(req,res){
	res.render('actuals');
})
app.get("/adjust",function(req,res){
	res.render('AdjustAsm');
})
app.get("/pdf",function(req,res){
	res.render('pdf');
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  console.log(err)
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;