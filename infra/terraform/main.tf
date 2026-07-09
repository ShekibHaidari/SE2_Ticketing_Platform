locals {
  common_tags = {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
  }
}

# This academic skeleton uses null resources to document what would be provisioned
# without binding the repository to a single cloud provider or any real credentials.

resource "null_resource" "kubernetes_cluster" {
  triggers = {
    project            = var.project_name
    region             = var.region
    kubernetes_version = var.kubernetes_version
  }
}

resource "null_resource" "load_balancer" {
  triggers = {
    project = var.project_name
    region  = var.region
  }
}

resource "null_resource" "managed_postgresql" {
  triggers = {
    project = var.project_name
    tier    = var.managed_postgres_tier
  }
}

resource "null_resource" "managed_redis" {
  triggers = {
    project = var.project_name
    tier    = var.managed_redis_tier
  }
}

resource "null_resource" "managed_message_broker" {
  triggers = {
    project = var.project_name
    type    = var.message_broker_type
  }
}

resource "null_resource" "object_storage" {
  triggers = {
    project = var.project_name
    class   = var.object_storage_class
  }
}

resource "null_resource" "monitoring_namespace" {
  triggers = {
    project   = var.project_name
    namespace = "monitoring"
  }
}

# In a cloud-specific version of this file, these placeholder resources would become:
# - AWS EKS / Azure AKS / Google GKE cluster resources
# - cloud load balancer or ingress resources
# - managed PostgreSQL instance resources
# - managed Redis instance resources
# - Amazon MQ / CloudAMQP / Kafka service resources
# - object storage bucket resources
# - Kubernetes namespace and monitoring Helm releases
