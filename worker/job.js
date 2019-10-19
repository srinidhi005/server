var path = require('path')
var fs = require('fs');
const exec = require("child_process").exec;
const kue = require('kue');
var redis = require("redis");
var rimraf = require("rimraf");
var db = require('../models');

const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

client = redis.createClient();

let queue = kue.createQueue();

queue.process('pdf', function(job, done){
    var jobId = job.id;
    client.set('q:job:'+job.id, JSON.stringify(job.data));
    console.log(job.data)
    var cmd;
    var companyName = job.data.company.replace(/ /g, '_')
    var folderName = companyName + '-' + (job.data.period || 'N');
    if (job.data.filename.indexOf('.pdf') != -1) {
        cmd = 'python3 extractor/pdf/mapping.py ';
        cmd += job.data.path + ' ' + './output/' + ' ' + 'extractor/pdf' +' '+companyName;
    } else if (job.data.filename.indexOf('.csv') != -1) {
        cmd = 'python3 extractor/csv-excel/mapping.py ';
        cmd += job.data.path + ' ' + './output/' + folderName + '/file' + ' ' + 'extractor/csv-excel';
    } else if (job.data.filename.indexOf('.xlsx') != -1) {
        var csvFile = job.data.originalname.replace('.xlsx', '.csv')
        cmd = 'python3 extractor/csv-excel/mapping.py ';
        cmd += job.data.path + ' ' + './output/' + folderName + '/file' + ' ' + 'extractor/csv-excel' + ' ' + csvFile;
    }
    console.log(cmd)
    var files = [
        path.join(__dirname, '../output', folderName, 'file0.json'),
        path.join(__dirname, '../output', folderName, 'file1.json'),
        path.join(__dirname, '../output', folderName, 'file2.json'),
        path.join(__dirname, '../output', folderName, 'file3.json')
    ];
    exec(cmd, async (err, stdOut, stdErr) => {
        if (err) {
            console.log('------------------err')
            console.log(err)
            db.statement.update({status: 'Error'}, {where: {id: job.data.statementId}})
            .then(() => {
                done();
            })
        } else {
            var promises = [];
            files.forEach((el, index) => {    
                if (fs.existsSync(el)) {
                    promises.push(storage.bucket('extraction-engine').upload(el, {
                        destination: folderName + '/file' + index + '.json',
                    }));
                }
            })
            if (promises) {
                Promise.all(promises).then(() => {
                    var items = fs.readdirSync('output/'+folderName);
                    var status = items.length == 3 ? 'Extracted' : 'Error';
                    rimraf.sync(path.join(__dirname, '../output', companyName));
                    return db.statement.update({status: status}, {where: {id: job.data.statementId}});
                }).then(() => { 
                    client.get('q:job:'+jobId, function(err, reply) {
                        var jobData = JSON.parse(reply);
                        jobData = Object.assign({}, jobData, {status: 'COMPLETED'});
                        client.set('q:job:'+jobId, JSON.stringify(jobData));
                        console.log('job completed successfully')
                        if (fs.existsSync(job.data.path)) {
                            fs.unlinkSync(job.data.path);
                        }
                        done();
                    })
                }).catch(err => {
                    console.log(err)
                })
            }
        }
    })
})

console.log('job started')
