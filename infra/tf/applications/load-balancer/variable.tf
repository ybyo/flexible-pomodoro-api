locals {
  traffic_dist_map = {
    production = {
      production = 100
      staging    = 0
    }
    production-90 = {
      production = 90
      staging    = 10
    }
    split = {
      production = 50
      staging    = 50
    }
    staging-90 = {
      production = 10
      staging    = 90
    }
    staging = {
      production = 0
      staging    = 100
    }
  }
}

variable "traffic" {
  description = "Levels of traffic distribution"
  type        = string
}
