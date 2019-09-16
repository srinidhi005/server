module.exports = {
    apps : [{
      name        : "job",
      script      : "./worker/job.js"
    },{
      name       : "app",
      script     : "./bin/www"
    }]
  }