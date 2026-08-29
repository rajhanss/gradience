resource "google_project_service" "run" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "secretmanager" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

resource "google_service_account" "api" {
  account_id   = "gradience-api"
  display_name = "GRADIENCE API runtime"
}

resource "google_secret_manager_secret_iam_member" "api_key_access" {
  secret_id = var.fortyguard_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api.email}"

  depends_on = [google_project_service.secretmanager]
}

resource "google_cloud_run_v2_service" "api" {
  name     = "gradience-api"
  location = var.region

  template {
    service_account = google_service_account.api.email

    containers {
      image = var.api_image

      env {
        name  = "GRADIENCE_ENV"
        value = "production"
      }

      env {
        name  = "GRADIENCE_CORS_ORIGINS"
        value = var.web_origin
      }

      env {
        name = "FORTYGUARD_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.fortyguard_secret_id
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  depends_on = [google_project_service.run, google_secret_manager_secret_iam_member.api_key_access]
}

resource "google_cloud_run_v2_service" "web" {
  name     = "gradience-web"
  location = var.region

  template {
    containers {
      image = var.web_image

      ports {
        container_port = 80
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "256Mi"
        }
      }
    }
  }

  depends_on = [google_project_service.run]
}

resource "google_cloud_run_v2_service_iam_member" "api_public" {
  name     = google_cloud_run_v2_service.api.name
  location = google_cloud_run_v2_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "web_public" {
  name     = google_cloud_run_v2_service.web.name
  location = google_cloud_run_v2_service.web.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
