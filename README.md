Restarter - start-stop-daemon for multiple processes
====================================================


Quick Example:
--------------

Make a config called "restarter.conf" file that looks like this:

    {
      "keep_alive": true,
      "restartables":
        [
          {
            "command": "node /tmp/test.js",
            "pid_file": "/tmp/test.pid",
            "signal": "SIGINT",
            "log_file": "/tmp/test.log",
            "watch_file": "/tmp/test.restarter"
          }
        ]
    }

Then run it like this:

    restarter restarter.conf

