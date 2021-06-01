#!/bin/bash

#valgrind  --leak-check=full  -v ./Read.exe tmr:///dev/ttyACM0 192.168.33.99 5000 0  918000 915000 916000
 ./S3_core/Read.exe tmr:///dev/ttyACM0 127.0.0.1 5000 0  918000 915000 916000
