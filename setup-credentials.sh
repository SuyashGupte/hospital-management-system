#!/bin/bash
# Sets database credentials in hibernate.cfg.xml.
# This file is gitignored — run it once after cloning.
#
# Usage:
#   ./setup-credentials.sh                        # uses defaults: hadeel / hadeel
#   ./setup-credentials.sh myuser mypassword      # custom credentials

DB_USER="${1:-hadeel}"
DB_PASS="${2:-hadeel}"
CFG="src/main/resources/hibernate.cfg.xml"

sed -i.bak \
  -e "s|<property name=\"hibernate.connection.username\">.*</property>|<property name=\"hibernate.connection.username\">${DB_USER}</property>|" \
  -e "s|<property name=\"hibernate.connection.password\">.*</property>|<property name=\"hibernate.connection.password\">${DB_PASS}</property>|" \
  "$CFG"

rm -f "${CFG}.bak"
echo "Done — credentials set in ${CFG}"
echo "  username: ${DB_USER}"
