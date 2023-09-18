###################################
# Vault
###################################
data "vault_generic_secret" "ssh" {
  path = "/pt/ssh"
}

data "vault_generic_secret" "ssl" {
  path = "/pt/ssl"
}

data "vault_generic_secret" "env" {
  path = "/pt/env/${local.envs["NODE_ENV"]}"
}
