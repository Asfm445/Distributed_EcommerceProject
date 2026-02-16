#!/bin/bash

ACCOUNT_ID="580420849125"
REGION="eu-north-1"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# List of your services
SERVICES=(
#  "user_service"
#  "product_management"
  "cart_service"
#  "order_service"
  "payment_service"
  "delivery_service"
  "docs_service"
)

# Login to ECR (already authenticated, but good to have)
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Build and push each service
for SERVICE in "${SERVICES[@]}"; do
  echo "🚀 Processing $SERVICE..."
  cd $SERVICE
  docker build -t $SERVICE .
  docker tag $SERVICE:latest ${ECR_URI}/ecommerce/${SERVICE}:latest
  docker push ${ECR_URI}/ecommerce/${SERVICE}:latest
  cd ..
  echo "✅ $SERVICE pushed successfully!"
done

echo "🎉 All services pushed to ECR!"
