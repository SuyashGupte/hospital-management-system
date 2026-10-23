#!/bin/bash
# Tears down all containers/pods and clears Oracle data so you can start fresh.

echo "==> Stopping and removing containers..."
podman pod stop hospital 2>/dev/null
podman pod rm -f hospital 2>/dev/null
podman rm -f oracle tomcat 2>/dev/null

echo "==> Resetting credentials in hibernate.cfg.xml..."
sed -i.bak \
  -e "s|<property name=\"hibernate.connection.username\">.*</property>|<property name=\"hibernate.connection.username\">YOUR_APP_USER</property>|" \
  -e "s|<property name=\"hibernate.connection.password\">.*</property>|<property name=\"hibernate.connection.password\">YOUR_APP_PASSWORD</property>|" \
  src/main/resources/hibernate.cfg.xml
rm -f src/main/resources/hibernate.cfg.xml.bak
echo "    Done — hibernate.cfg.xml reset to placeholders."

