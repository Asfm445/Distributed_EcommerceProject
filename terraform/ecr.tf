resource "aws_ecr_repository" "services" {
  for_each = toset([
    "user-service",
    "product-management",
    "cart-service",
    "order-service",
    "payment-service",
    "delivery-service",
    "docs-service"
  ])

  name                 = "${var.project_name}/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}
