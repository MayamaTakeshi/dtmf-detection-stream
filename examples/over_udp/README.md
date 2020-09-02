### DTMD detection on data sent over UDP

To test it:

Start the UDP receiver like this:
```
node receiver.js LOCAL_IP LOCAL_PORT
```

Then start the UDP sender like this:
```
node sender LOCAL_IP REMOTE_IP REMOTE_PORT DTMF_STRING
```


Ex:
```
$ node receiver.js 127.0.0.1 8890
Listening 127.0.0.1:8890
got digit 0
got digit 1
got digit 2
got digit 3
got digit 4
got digit 5
got digit 6
got digit 7
got digit 8
got digit 9
```

```
$ node sender.js 127.0.0.1 127.0.0.1 8890 0123456789
tone stream finished
```
