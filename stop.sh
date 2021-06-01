#!/bin/bash




killall start.sh
killall start_main.sh
killall start_web.sh


kill -9 `ps -aef | grep "start.sh" | grep -v grep | awk '{ print $2 }'`;
kill -9 `ps -aef | grep "main.js" | grep -v grep | awk '{ print $2 }'`;
kill -9 `ps -aef | grep "webserverStandalone.js" | grep -v grep | awk '{ print $2 }'`;

kill -9 `ps -aef | grep "start_main.sh" | grep -v grep | awk '{ print $2 }'`;
kill -9 `ps -aef | grep "start_web.sh" | grep -v grep | awk '{ print $2 }'`;



