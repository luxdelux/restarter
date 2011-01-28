var fs = require('fs'),
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    config,
    globalLogger;

function logAppender(logFile) {
  return function(data) {
    fs.open(logFile, 'a+', function(err, fd) {
      if (!err) {
        fs.write(fd, data, null, data.length, null, function(err, written) {
            if(err) throw err;
            fs.close(fd, function(err) {
              if(err) throw err;
            });
        });
      }
    });
  };
}

// function modified from Charlie Robbins' "forever" package:
function checkProcess(pids, callback) {
  exec('ps ' + pids + ' | awk \'{print $1}\' | grep -v PID', function (err, stdout, stderr) {
    if (err) return callback(false);
    callback(stdout);
  });
};

function restart(item) {
  var command = item.command, 
      pidFile = item.pid_file,
      logFile = item.log_file,
      signal  = item.signal;
      
  fs.readFile(pidFile, function(err, data) {
    if (data) {
      var pid = parseInt(data.toString().match(/(\d+)/)[0]) || 0;
      if (pid && signal) {
        try {
          process.kill(pid, signal);
          globalLogger(Date().toLocaleString() + " : killed: "+pid);
        } catch(e) {
          globalLogger(Date().toLocaleString() + " : could not find pid to kill: "+pid);
        }
      }
    }
    var cmds = command.split(' ');
    var child = spawn(cmds.shift(), cmds, { cwd: item.working_directory, env: process.env});
    globalLogger(Date().toLocaleString() + " : spawn pid: "+child.pid+" from command: "+command);
    var fd = fs.openSync(pidFile, 'w+');
    var pidString = child.pid.toString();
    item.pid = child.pid;
    fs.writeSync(fd, new Buffer(pidString, 'ascii'), 0, pidString.length, 0);
    fs.closeSync(fd);
    var appender = logAppender(logFile);
    child.stdout.on('data', appender);
    child.stderr.on('data', appender);
  });
}

exports.setConfig = function(configJson) {
  config = configJson;
};

exports.startWatching = function() {
  if (config.global_log_file) {
    var appender = logAppender(config.global_log_file);
    globalLogger = function(str) {appender(new Buffer(str+"\n"))};
  } else {
    globalLogger = console.log;
  }
  
  if (config.restartables && config.restartables.constructor === Array) {
    if (config.global_working_directory) {
      process.chdir(config.global_working_directory);
    }
    if (config.keep_alive) {
      setInterval(function() {
        var pids = config.restartables.map(function(item) {return item.pid || '';}).join(' ');
        checkProcess(pids, function(runningPids) {
          config.restartables.forEach(function(item) {
            var pid = item.pid;
            if (pid && !runningPids.match(pid.toString()+'\n')) {
              globalLogger(Date().toLocaleString() + " : keep alive command died, pid: "+pid+" for command: "+item.command);
              globalLogger(Date().toLocaleString() + " : rerunning command: "+item.command);
              restart(item);
            }
          });
        });
      }, 2000);
    }
    if (config.global_watch_file) {
      fs.watchFile(config.global_watch_file, function () {
        globalLogger(Date().toLocaleString() + " : restarting all processes!");
        config.restartables.forEach(function(item) {
          restart(item);
        });
      });
    }
    config.restartables.forEach(function(item) {
      var watchFile = item.watch_file;
      if (watchFile) {
        try {
          if (!fs.statSync(watchFile).isFile()) {
            // throw error if the watchFile is a directory, symlink, or other file type
          }
        } catch(e) {
          var fd = fs.openSync(watchFile, 'w+');
          fs.writeSync(fd, new Buffer("x"), 0, 1, 0);
          fs.closeSync(fd);
        }
        restart(item);
        fs.watchFile(watchFile, function () {
          globalLogger(Date().toLocaleString() + " : watch file updated for command: "+item.command);
          restart(item);
        });
      }    
    });
  }
}