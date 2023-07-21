#!/bin/bash
set -e

###################################
# Dotenv
###################################
prod_env="/env/.production.env"
prod_formatted_env="/tmp/.formatted-production.env"
staging_env="/env/.staging.env"
staging_formatted_env="/tmp/.formatted-staging.env"

rm -rf $prod_formatted_env
rm -rf $staging_formatted_env

cp $prod_env $prod_formatted_env
cp $staging_env $staging_formatted_env

grep -vE '^#|^$' $prod_formatted_env >temp.txt && mv temp.txt $prod_formatted_env
grep -vE '^#|^$' $staging_formatted_env >temp.txt && mv temp.txt $staging_formatted_env

if ! vault secrets list -format=json | jq -e '.["pt/"]' > /dev/null; then
    vault secrets enable -path=pt kv
fi

vault kv put pt/env/staging $(cat $staging_formatted_env)
vault kv put pt/env/production $(cat $prod_formatted_env)

###################################
# EC2 SSH TERMINAL
###################################
ssh_public_file="/etc/.ssh/ssh.pub"
ssh_private_file="/etc/.ssh/ssh"

ssh_public_key_base64=$(base64 -w 0 $ssh_public_file)
ssh_private_key_base64=$(base64 -w 0 $ssh_private_file)

vault kv put pt/ssh SSH_PUBLIC_KEY="$ssh_public_key_base64" SSH_PRIVATE_KEY="$ssh_private_key_base64"

###################################
# SSL CERTIFICATES
###################################
ssl_public_file="/ssl/pipetimer.com.pem"
ssl_private_file="/ssl/pipetimer.com.key"

ssl_public_key_base64=$(base64 -w 0 $ssl_public_file)
ssl_private_key_base64=$(base64 -w 0 $ssl_private_file)

vault kv put pt/ssl SSL_PUBLIC_KEY="$ssl_public_key_base64" SSL_PRIVATE_KEY="$ssl_private_key_base64"
