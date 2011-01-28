Restarter - start-stop-daemon for multiple processes
====================================================


Quick Example:
--------------

Make a config called "restarter.conf" file that looks like this:

    {
      "global_log_file": "/tmp/restarter_output.log",
      "keep_alive": true,
      "restartables":
        [
          {
            "command": "node /tmp/test.js",
            "pid_file": "/tmp/test.pid",
            "signal": "SIGINT",
            "log_file": "/tmp/test.log",
            "watch_file": "/tmp/test.restarter"
          },
          {
            "command": "node /tmp/test2.js",
            "pid_file": "/tmp/test2.pid",
            "signal": "SIGINT",
            "log_file": "/tmp/test2.log",
            "watch_file": "/tmp/test2.restarter"
          }
        ]
    }

Then run it like this:

    restarter restarter.conf
    
If keep_alive is set to "true", it will rerun the command if the process pid is missing.  You can "touch" the watch_file
and restarter will kill the current process and rerun the command to restart it.  If you omit the global_log_file parameter,
it will send stdout to the console.

The output in the global_log_file will look something like this:

    Thu Jan 27 2011 18:01:00 GMT-0800 (PST) : could not find pid to kill: 4918
    Thu Jan 27 2011 18:01:00 GMT-0800 (PST) : spawn pid: 4981 from command: node /tmp/test.js
    Thu Jan 27 2011 18:01:00 GMT-0800 (PST) : could not find pid to kill: 4919
    Thu Jan 27 2011 18:01:00 GMT-0800 (PST) : spawn pid: 4982 from command: node /tmp/test2.js
    Thu Jan 27 2011 18:07:44 GMT-0800 (PST) : keep alive command died, pid: 4982 for command: node /tmp/test2.js
    Thu Jan 27 2011 18:07:44 GMT-0800 (PST) : rerunning command: node /tmp/test2.js
    Thu Jan 27 2011 18:07:44 GMT-0800 (PST) : could not find pid to kill: 4982
    Thu Jan 27 2011 18:07:44 GMT-0800 (PST) : spawn pid: 5967 from command: node /tmp/test2.js
    Thu Jan 27 2011 18:08:01 GMT-0800 (PST) : watch file updated for command: node /tmp/test2.js
    Thu Jan 27 2011 18:08:01 GMT-0800 (PST) : killed: 5967
    Thu Jan 27 2011 18:08:01 GMT-0800 (PST) : spawn pid: 6013 from command: node /tmp/test2.js
