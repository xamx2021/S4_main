#!/bin/sh
#name  quick install
 
		mount -o remount,rw /

		./S3_core/Read.exe install v1_Xw11jwe44
	  
	  
		# Network name of the device (Preffix):
		HOSTHAME_PREFIX='Reader'
	 
 
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
		#/etc/init.d/smbd restart
		/etc/init.d/nmbd restart
