output "vpc_id" {
  value = module.vpc.vpc_id
}

output "alb_dns_name" {
  value = aws_alb.main.dns_name
}

output "ecr_repository_urls" {
  value = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "mq_endpoint" {
  value = aws_mq_broker.rabbitmq.instances[0].endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}
