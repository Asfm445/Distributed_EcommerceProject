# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow inbound postgres traffic"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks      = [module.vpc.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS Instance (PostgreSQL)
resource "aws_db_instance" "postgres" {
  identifier        = "${var.project_name}-db"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"
  
  db_name  = "ecommerce"
  username = "dbadmin"
  password = "password123" # Should be in Secrets Manager

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = module.vpc.database_subnet_group
  skip_final_snapshot    = true
}

# Redis (ElastiCache)
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "${var.project_name}-redis"
  replication_group_description = "Redis for cart session storage"
  node_type                     = "cache.t3.micro"
  num_cache_clusters            = 1
  parameter_group_name          = "default.redis7"
  port                          = 6379
  subnet_group_name             = aws_elasticache_subnet_group.redis.name
  security_group_ids            = [aws_security_group.redis_sg.id]
}

resource "aws_security_group" "redis_sg" {
  name        = "${var.project_name}-redis-sg"
  description = "Allow inbound redis traffic"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    cidr_blocks      = [module.vpc.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Amazon MQ (RabbitMQ)
resource "aws_mq_broker" "rabbitmq" {
  broker_name = "${var.project_name}-mq"

  engine_type        = "RabbitMQ"
  engine_version     = "3.10.20"
  host_instance_type = "mq.t3.micro"
  
  user {
    username = "mqadmin"
    password = "password123" # Should be in Secrets Manager
  }

  publicly_accessible = false
  subnet_ids          = [module.vpc.private_subnets[0]]
  security_groups     = [aws_security_group.mq_sg.id]
}

resource "aws_security_group" "mq_sg" {
  name        = "${var.project_name}-mq-sg"
  description = "Allow inbound rabbitmq traffic"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5671
    to_port         = 5671
    protocol        = "tcp"
    cidr_blocks      = [module.vpc.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
