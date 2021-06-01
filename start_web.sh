#!/bin/bash



    cd /_PRO/ESP_S4

    PROCESS="/_PRO/ESP_S4/webserverStandalone.js"
    RESULT=`pgrep ${PROCESS}`

    if [ "${RESULT:-null}" = null ]; then
            echo "${PROCESS} not running, starting "$PROCANDARGS
			(
				while /bin/true; do
				nohup  nice -n -19  $PROCESS > /var/log/ESP_4_webserver.log.txt 2>&1
				#  nice -n -19  $PROCESS 

				done &
			)
    else
            echo "S4 WEBserver is already running. Doing nothing."
    fi

	
	
	
 
