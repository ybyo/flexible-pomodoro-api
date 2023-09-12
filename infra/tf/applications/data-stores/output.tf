# RDS(MySQL)
output "mysql_host" {
  value = aws_db_instance.mysql.address
}

output "snapshot_identifier" {
  value = aws_db_instance.mysql.snapshot_identifier
}

# Elasticache(Redis)
output "redis_url" {
  value = aws_elasticache_cluster.redis.cache_nodes
}

output "snapshot_name" {
  value = aws_elasticache_cluster.redis.snapshot_name
}
