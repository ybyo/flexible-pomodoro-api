workspace "Pipe Timer" "One app for flexible piping of timers to enhance productivity." {

  model {
    pipeTimer = softwaresystem "Pipe Timer" {
      frontend = container "Frontend" "Vue3(Quasar)" {
        tags "Vuejs"
      }
      backend = container "Backend" "NestJS" {
        tags "NestJS"
      }
      backendNginx = container "Nginx" "Nginx" {
        tags "Nginx"
      }
      mysql = container "MySQL" "" {
        tags "MySQL"
      }
      redis = container "Redis" "" {
        tags "Redis"
      }
    }

    frontend -> backendNginx "API Request"
    backendNginx -> backend "API Request"
    backendNginx -> redis "Store session, token"
    backendNginx -> mysql "Store user, timer"

    production = deploymentEnvironment "Production" {

      deploymentNode "DNS" {
        cf = infrastructureNode "DNS" {
          tags "DNS"
          description "CloudFlare"
        }
      }

      cloud = deploymentNode "Amazon Web Services" {
        tags "Amazon Web Services - Cloud"

        region = deploymentNode "ap-northeast-2" {
          tags "Amazon Web Services - Region"

          deploymentNode "EC2 - Frontend" {
            tags "Amazon Web Services - EC2"

            deploymentNode "Nginx" {
              tags "Nginx"
              frontendInstance = containerInstance frontend
            }
          }

          deploymentNode "EC2 - Backend" {
            tags "Amazon Web Services - EC2"

            deploymentNode "Nginx" {
              nginxInstance = containerInstance backendNginx
            }

            deploymentNode "NestJS" {
              # tags "NestJS"
              backendInstance = containerInstance backend
            }
          }

          deploymentNode "Elasticache" {
            tags "Amazon Web Services - ElastiCache"

            deploymentNode "Redis" {
              # tags "Redis"
              redisInstance = containerInstance redis
            }
          }

          deploymentNode "RDS" {
            tags "Amazon Web Services - RDS"

            deploymentNode "MySQL" {
              # tags "MySQL"
              mysqlInstance = containerInstance mysql
            }
          }
        }
      }

      localhost = deploymentNode "Localhost" "Deploy EC2" {
        infrastructureNode "Registry" {
          tags "Docker"
          description "Docker Registry"
        }
        infrastructureNode "Monitoring" {
          tags "Prometheus"
          description "Prometheus"
        }
        terraform = infrastructureNode "IaC" {
          tags "Terraform"
          description "Terraform"
        }
      }

      cf -> frontendInstance "HTTPS(Proxied)" {
        tags "DNS to Cloud"
      }
      terraform -> cf "Update the domain name" {
        tags "Terraform to DNS"
      }
      terraform -> cloud "Deploy" {
        tags "Terraform to Cloud"
      }
    }
  }

  views {
    deployment * "Production" "AmazonWebServicesDeployment" {
      include *
      # autolayout lr 10 10
    }

    styles {
      element "Element" {
        shape roundedbox
        background #ffffff
        width 300
        height 200
      }
      relationship Relationship {
        routing Orthogonal
        style dotted
        position 50
      }
      relationship "Terraform to DNS" {
        routing Direct
        position 25
      }
      relationship "Terraform to Cloud" {
        routing Direct
      }

      element "Nginx" {
        icon "logos/nginx.png"
      }
      element "DNS" {
        icon "logos/cloudflare.png"
      }
      element "Redis" {
        icon "logos/redis.png"
      }
      element "MySQL" {
        icon "logos/mysql.png"
      }
      element "Vuejs" {
        icon "logos/vuejs.png"
      }
      element "NestJS" {
        icon "logos/nestjs.png"
      }
      element "Terraform" {
        icon "logos/terraform.png"
        width 300
        height 180
      }
      element "Docker" {
        icon "logos/docker.png"
        width 300
        height 180
      }
      element "Prometheus" {
        icon "logos/prometheus.png"
        width 300
        height 180
      }

      element "Container" {
        background #ffffff
      }
      element "Application" {
        background #ffffff
      }
      element "Database" {
        shape cylinder
      }
    }

    themes "https://static.structurizr.com/themes/amazon-web-services-2023.01.31/theme.json"
  }

}