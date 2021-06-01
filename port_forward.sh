#!/bin/bash
# Run as root if your listening port is < 1024!
# Usage:   $ ./port_forward.sh 80 8080



#FIFO=$(mktemp -u)
#trap "rm -f $FIFO; killall -9 nc; exit 255;" SIGINT SIGTERM SIGKILL
#mkfifo $FIFO

#while true; do
#    # echo "Listening..."
   # cat $FIFO | nc -k -l localhost $1 | nc 192.168.33.99 $2
  #  cat $FIFO | nc -k -l localhost 60 | nc 192.168.33.99 60
#    cat $FIFO | nc -k -l 192.168.34.61 60 | nc 192.168.33.99 60
##6543 > $2
#done






$ mkfifo /tmp/backpipe
$ nc -l 60 0</tmp/backpipe | nc 192.168.33.99 60 1>/tmp/backpipe