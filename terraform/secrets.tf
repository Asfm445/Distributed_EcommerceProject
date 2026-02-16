resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.project_name}-secrets"
}

resource "aws_secretsmanager_secret_version" "app_secrets_v1" {
  secret_id     = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    MONGODB_URI = "REPLACE_WITH_YOUR_ATLAS_URL"
    JWT_SECRET  = "REPLACE_WITH_YOUR_JWT_SECRET"
    DB_PASSWORD = "password123"
  })
}
