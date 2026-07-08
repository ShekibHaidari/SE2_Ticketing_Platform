variable "project_name" {
  description = "Project identifier used for naming cloud resources."
  type        = string
  default     = "se2-ticketing-platform"
}

variable "environment" {
  description = "Deployment environment label."
  type        = string
  default     = "course-project"
}

variable "region" {
  description = "Cloud region placeholder for future provider-specific implementation."
  type        = string
  default     = "example-region-1"
}

variable "kubernetes_version" {
  description = "Desired Kubernetes version."
  type        = string
  default     = "1.30"
}

variable "managed_postgres_tier" {
  description = "Placeholder tier for managed PostgreSQL."
  type        = string
  default     = "standard"
}

variable "managed_redis_tier" {
  description = "Placeholder tier for managed Redis."
  type        = string
  default     = "standard"
}

variable "message_broker_type" {
  description = "Managed broker choice for the platform."
  type        = string
  default     = "rabbitmq"
}

variable "object_storage_class" {
  description = "Placeholder object storage class."
  type        = string
  default     = "standard"
}
