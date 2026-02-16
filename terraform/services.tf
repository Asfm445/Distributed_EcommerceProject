locals {
  services = {
    user-service = {
      port = 8002
      cpu  = 256
      memory = 512
      public = true
    }
    product-management = {
      port = 8000
      cpu  = 256
      memory = 512
      public = true
    }
    cart-service = {
      port = 8001
      cpu  = 256
      memory = 512
      public = true
    }
    order-service = {
      port = 50051
      cpu  = 256
      memory = 512
      public = false
    }
    payment-service = {
      port = 0 # No port, consumer only
      cpu  = 256
      memory = 512
      public = false
    }
    delivery-service = {
      port = 0
      cpu  = 256
      memory = 512
      public = false
    }
    docs-service = {
      port = 8081
      cpu  = 256
      memory = 512
      public = true
    }
  }
}

resource "aws_ecs_task_definition" "services" {
  for_each = local.services

  family                   = each.key
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = each.key
      image = "${aws_ecr_repository.services[each.key].repository_url}:latest"
      
      portMappings = each.value.port > 0 ? [
        {
          containerPort = each.value.port
          hostPort      = each.value.port
          protocol      = "tcp"
        }
      ] : []

      environment = [
        { name = "PORT", value = tostring(each.value.port) },
        { name = "POSTGRES_HOST", value = aws_db_instance.postgres.address },
        { name = "REDIS_HOST", value = aws_elasticache_replication_group.redis.primary_endpoint_address },
        { name = "RABBITMQ_URL", value = "amqps://${aws_mq_broker.rabbitmq.instances[0].endpoint}" }
      ]

      secrets = [
        { name = "MONGODB_URI", value_from = "${aws_secretsmanager_secret.app_secrets.arn}:MONGODB_URI::" },
        { name = "JWT_SECRET", value_from = "${aws_secretsmanager_secret.app_secrets.arn}:JWT_SECRET::" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${each.key}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_cloudwatch_log_group" "services" {
  for_each = local.services
  name     = "/ecs/${each.key}"
  retention_in_days = 7
}

resource "aws_ecs_service" "services" {
  for_each = local.services

  name            = each.key
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.service_sg.id]
  }

  dynamic "load_balancer" {
    for_each = each.value.public ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.services[each.key].arn
      container_name   = each.key
      container_port   = each.value.port
    }
  }
}

resource "aws_security_group" "service_sg" {
  name        = "${var.project_name}-service-sg"
  description = "Allow inbound service traffic"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.alb_sg.id]
  }
  
  # Allow internal communication
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
