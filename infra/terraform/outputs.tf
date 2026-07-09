output "project_name" {
  description = "Project name carried through Terraform variables."
  value       = var.project_name
}

output "planned_components" {
  description = "High-level infrastructure components represented by the skeleton."
  value = [
    "kubernetes_cluster",
    "load_balancer",
    "managed_postgresql",
    "managed_redis",
    "managed_message_broker",
    "object_storage",
    "monitoring_namespace"
  ]
}
