variable "region" {
  description = "The region terraform deploys instance"
}

variable "cidr_vpc" {
  description = "CIDR block for the VPC"
  default     = terraform.workspace == "production" ? "172.31.0.0/16" : "172.16.0.0/16"
}

variable "cidr_subnet_1" {
  description = "CIDR block for the subnet"
  default     = terraform.workspace == "production" ? "172.31.0.0/18" : "172.16.0.0/18"
}

variable "cidr_subnet_2" {
  description = "CIDR block for the subnet"
  default     = terraform.workspace == "production" ? "172.31.64.0/18" : "172.16.64.0/18"
}
