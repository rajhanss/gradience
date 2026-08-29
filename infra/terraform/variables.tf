variable "project_id" {
  description = "Google Cloud project that will host GRADIENCE."
  type        = string
}

variable "region" {
  description = "Google Cloud region for the Cloud Run services."
  type        = string
  default     = "asia-south1"
}

variable "api_image" {
  description = "Immutable container image URI for the GRADIENCE API."
  type        = string
}

variable "web_image" {
  description = "Immutable container image URI for the GRADIENCE web app."
  type        = string
}

variable "web_origin" {
  description = "Public HTTPS origin of the deployed web application, used for API CORS."
  type        = string
}

variable "fortyguard_secret_id" {
  description = "Existing Secret Manager secret ID containing FORTYGUARD_API_KEY."
  type        = string
  default     = "fortyguard-api-key"
}
