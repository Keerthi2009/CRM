#!/usr/bin/env bash
# One-time setup script for a fresh Ubuntu EC2 instance.
# Run as the ubuntu user after your first SSH login:
#   bash setup-ec2.sh
set -e

echo "--- Installing Docker ---"
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

echo "--- Installing AWS CLI ---"
sudo apt-get install -y unzip curl
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
sudo /tmp/aws/install
rm -rf /tmp/aws /tmp/awscliv2.zip

echo "--- Creating app directory ---"
mkdir -p /home/ubuntu/crm

echo ""
echo "Setup complete. Do these steps before your first deploy:"
echo ""
echo "  1. Log out and back in so Docker works without sudo"
echo "     (or run: newgrp docker)"
echo ""
echo "  2. Create /home/ubuntu/crm/.env with your secrets:"
echo "     nano /home/ubuntu/crm/.env"
echo ""
echo "     Required contents:"
echo "       POSTGRES_PASSWORD=<strong-password>"
echo "       JWT_SECRET=<long-random-string>"
echo "       EC2_PUBLIC_IP=<this-instance-public-ip>"
echo "       ECR_REGISTRY=<account-id>.dkr.ecr.ap-south-1.amazonaws.com"
echo ""
echo "  3. Attach IAM role 'EC2-ECR-ReadOnly' to this instance"
echo "     (see README for policy)"
