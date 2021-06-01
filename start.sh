#!/bin/bash

# Save old core logfile befre starting:
tar -zcvf "/var/log/ESP_core_log_$(date '+%F').tar.gz" /var/log/ESP_4_ESPserver.log.txt

# Save old webserver logfile befre starting:
tar -zcvf "/var/log/ESP_webs_log_$(date '+%F').tar.gz" /var/log/ESP_4_webserver.log.txt

echo "" > /tmp/tmp_token.json
echo "" > /tmp/tmp_plugin.json

/_PRO/ESP_S4/start_main.sh
/_PRO/ESP_S4/start_web.sh

