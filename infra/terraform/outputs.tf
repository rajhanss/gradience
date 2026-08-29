output "api_url" {
  value       = google_cloud_run_v2_service.api.uri
  description = "Public GRADIENCE API URL."
}

output "web_url" {
  value       = google_cloud_run_v2_service.web.uri
  description = "Public GRADIENCE web URL."
}
