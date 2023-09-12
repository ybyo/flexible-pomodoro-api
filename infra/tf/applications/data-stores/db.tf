###################################
# MySQL
###################################
resource "aws_db_subnet_group" "mysql" {
  name = "pt-${local.envs["NODE_ENV"]}"

  subnet_ids = [
    data.terraform_remote_state.vpc.outputs.subnet1_id,
    data.terraform_remote_state.vpc.outputs.subnet2_id,
  ]
}

resource "aws_security_group" "mysql" {
  name_prefix = "pt-${local.envs["NODE_ENV"]}"
  vpc_id      = data.terraform_remote_state.vpc.outputs.vpc_id

  ingress {
    from_port   = local.envs["DB_PORT"]
    to_port     = local.envs["DB_PORT"]
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

#data "terraform_remote_state" "data_store" {
#  backend = "s3"
#
#  config = {
#    bucket         = "terraform-pt-state"
#    key            = "env:/${terraform.workspace}/pt/applications/data-stores/terraform.tfstate"
#    region         = "ap-northeast-2"
#    dynamodb_table = "terraform-pt-state-lock"
#    encrypt        = true
#  }
#}

resource "aws_db_instance" "mysql" {
  db_name                = local.envs["DB_NAME"]
  engine                 = "mysql"
  engine_version         = "8.0.32"
  instance_class         = local.flavor_mysql
  username               = local.envs["DB_USERNAME"]
  password               = local.envs["DB_PASSWORD"]
  allocated_storage      = 20
  parameter_group_name   = "default.mysql8.0"
  vpc_security_group_ids = [aws_security_group.mysql.id]
  availability_zone      = data.aws_availability_zones.available.names[0]
  db_subnet_group_name   = aws_db_subnet_group.mysql.name
  skip_final_snapshot    = true
  #  final_snapshot_identifier = "mysql-${timestamp()}"
  #  snapshot_identifier       = data.terraform_remote_state.data_store.outputs.snapshot_identifier

  tags = {
    Name = "pipe-timer-db"
  }

  lifecycle {
    ignore_changes = [snapshot_identifier]
  }
}

###################################
# Redis
###################################
resource "aws_security_group" "redis" {
  name_prefix = "pt-redis"
  vpc_id      = data.terraform_remote_state.vpc.outputs.vpc_id

  ingress {
    from_port   = local.envs["REDIS_PORT"]
    to_port     = local.envs["REDIS_PORT"]
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_subnet_group" "pipe_timer" {
  name = "pt-redis"

  subnet_ids = [
    data.terraform_remote_state.vpc.outputs.subnet1_id,
    data.terraform_remote_state.vpc.outputs.subnet2_id,
  ]
}

resource "aws_elasticache_parameter_group" "notify" {
  name   = "notify-${local.envs["NODE_ENV"]}"
  family = "redis7"

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }
}


resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "pt-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = local.flavor_redis
  num_cache_nodes      = 1
  port                 = local.envs["REDIS_PORT"]
  security_group_ids   = [aws_security_group.redis.id]
  availability_zone    = data.aws_availability_zones.available.names[0]
  subnet_group_name    = aws_elasticache_subnet_group.pipe_timer.name
  parameter_group_name = aws_elasticache_parameter_group.notify.name
  apply_immediately    = true
  #  final_snapshot_identifier = "mysql-${timestamp()}"
  #  snapshot_name             = data.terraform_remote_state.data_store.outputs.snapshot_name

  tags = {
    Name = "pipe-redis"
  }
}

###################################
# Update Local Dotenv
###################################
resource "null_resource" "update_env" {
  provisioner "local-exec" {
    command = templatefile("./shell-scripts/update-env.sh",
      {
        "DB_BASE_URL"    = aws_db_instance.mysql.address
        "REDIS_BASE_URL" = aws_elasticache_cluster.redis.cache_nodes[0].address
        "ENV_PATH"       = "../../../../env"
        "NODE_ENV"       = local.envs["NODE_ENV"]
    })
    working_dir = path.module
    interpreter = ["/bin/bash", "-c"]
  }
}
