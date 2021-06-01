#!/bin/bash
### BEGIN INIT INFO
# Provides:          ESP_s3_rc
# Required-Start:    $remote_fs
# Required-Stop:
# Should-Start:      udev
# Default-Start:     S
# Default-Stop:
# Short-Description: Miscellaneous things to be done during bootup.
# Description:       ESP s3 HUB. main.F-meter.js
### END INIT INFO

# Node.js:
NODEPATH='/usr/bin/node'


#STARTPATH='/_PRO/ESP_S4_new/start.js'

# Servers:
APPPATH='/_PRO/ESP_S4/main.js'
WEBSPATH='/_PRO/ESP_S4/webserverStandalone.js'
APPDIR='/_PRO/ESP_S4'

# Name of this file:
DMNPATH='/_PRO/ESP_S4/ESP4_daemon_rc.sh'

# Name in RC:
STARTSCRIPT='ESP4_daemon_rc.sh'
 
# Network name of the device (Preffix):
HOSTHAME_PREFIX='Hub'
 
 

do_start () {

	/etc/init.d/openvpn start
	
	$APPDIR/start.sh
	
	#nohup /usr/bin/nice -n -19 /usr/bin/node /_PRO/ESP_S4_new/main.js > /dev/null 2>&1&
		
	#/_PRO/ESP_S4_new/start_main.sh
	#	/_PRO/ESP_S4_new/start_web.sh
	
	#PROCESS=$APPPATH
    #RESULT=`pgrep ${PROCESS}`
    #if [ "${RESULT:-null}" = null ]; then
    #        echo "${PROCESS} not running, starting "$PROCESS
	#		(
	#			while /bin/true; do				
	#			/usr/bin/nohup  /usr/bin/nice -n -19  ./$PROCESS > /dev/null 2>&1
	#			done &
	#		)
    #else
    #       echo "S4 main is already running. Doing nothing."
    #fi
	
	#	PROCESS=$WEBSPATH
	#    RESULT=`pgrep ${PROCESS}`
	#    if [ "${RESULT:-null}" = null ]; then
	#            echo "${PROCESS} not running, starting "
	#			(
	#				while /bin/true; do
	#				/usr/bin/nohup  /usr/bin/nice -n -19  ./$PROCESS > /dev/null 2>&1
	#				done &
	#			)
	#    else
	#            echo "S4 WEB server is already running. Doing nothing."
	#    fi
		
	#	ifconfig wlan0 down					
}




do_stop () {

		$APPDIR/stop.sh
}




do_install () {
		#Remove old file:
		#rm /etc/init.d/$STARTSCRIPT

		# Link:		
		ln -sf $DMNPATH /etc/init.d/$STARTSCRIPT

		# Chmod:
		chmod ugo+x /etc/init.d/$STARTSCRIPT

		# Configure the init system to run this script at startup.
		update-rc.d $STARTSCRIPT defaults

		# Associate hostname with HW Address dtl:
		mac=`ifconfig eth0 | grep -o -E '([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}'`
		# USING BASH!
		marr=(${mac//:/ })
		hostname=$HOSTHAME_PREFIX-${marr[4]}-${marr[5]}
		echo 'New hostname is' $hostname
		
		# Re-configure HOSTNAME:
		echo $hostname > /etc/hostname
		hostname $hostname
		echo '127.0.0.1       localhost' > /etc/hosts
		echo '127.0.0.1       '$hostname >> /etc/hosts

		# Re-configure and restart SAMBA:
		CONFIG_FILE=/etc/samba/smb.conf
		TARGET_KEY='netbios name'
		REPLACEMENT_VALUE=$hostname
		sed   -i "s/\($TARGET_KEY *= *\).*/\1$REPLACEMENT_VALUE/" $CONFIG_FILE

		TARGET_KEY2='server string'
		sed   -i "s/\($TARGET_KEY2 *= *\).*/\1$REPLACEMENT_VALUE/" $CONFIG_FILE
		#systemctl is-enabled $STARTSCRIPT
		#/etc/init.d/smbd restart
		/etc/init.d/nmbd restart
		
		$APPDIR/S3_core/Read.exe install v1_Xw11jwe44	
}




do_uninstall () {
		update-rc.d $STARTSCRIPT remove
		rm /etc/init.d/$STARTSCRIPT
}



case "$1" in
  "")
	echo " Usage: $DMNPATH [start|stop|restart|install|reinstall|uninstall]" >&2
	exit
	;;  
   start|"")
	do_start
	echo " Launched."
	exit
	;;
  restart|reload)
	do_stop
	do_start
	echo " Reloaded."
	exit
	;;
  stop)
	do_stop
	echo " Stopped."
	exit
	;;
  install)
	do_install
	echo " Installed. "
	exit
	;;  
  reinstall)
	#Remove old:
	rm /etc/init.d/$STARTSCRIPT
	do_install
	echo " Reinstalled. "
	exit
	;;
  uninstall)
	do_stop
	do_uninstall
	echo " Removed. "
	exit
	;;
  *)
	
	exit 3
	;;
esac

:








 