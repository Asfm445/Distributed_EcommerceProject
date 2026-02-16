resource "aws_security_group" "alb_sg" {
  name        = "${var.project_name}-alb-sg"
  description = "Allow inbound HTTP traffic"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
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

resource "aws_alb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = module.vpc.public_subnets
}

resource "aws_alb_listener" "http" {
  load_balancer_arn = aws_alb.main.id
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found"
      status_code  = "404"
    }
  }
}

resource "aws_lb_target_group" "services" {
  for_each = { for k, v in local.services : k => v if v.public }

  name        = "${var.project_name}-${each.key}-tg"
  port        = each.value.port
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path                = each.key == "docs-service" ? "/docs" : "/api/v1/health" # Adjust paths as needed
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

# Listener Rules for path-based routing
resource "aws_lb_listener_rule" "user_service" {
  listener_arn = aws_alb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["user-service"].arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/auth/*", "/api/v1/users/*"]
    }
  }
}

resource "aws_lb_listener_rule" "product_management" {
  listener_arn = aws_alb_listener.http.arn
  priority     = 20

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["product-management"].arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/products/*", "/api/v1/categories/*"]
    }
  }
}

resource "aws_lb_listener_rule" "cart_service" {
  listener_arn = aws_alb_listener.http.arn
  priority     = 30

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["cart-service"].arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/cart/*"]
    }
  }
}

resource "aws_lb_listener_rule" "docs_service" {
  listener_arn = aws_alb_listener.http.arn
  priority     = 40

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["docs-service"].arn
  }

  condition {
    path_pattern {
      values = ["/docs*", "/swagger-json*"]
    }
  }
}
