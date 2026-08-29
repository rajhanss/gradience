# Google Cloud Run deployment

This directory defines two public Cloud Run services: `gradience-api` and `gradience-web`. Terraform does not build images or create the FortyGuard secret; those actions stay explicit so credentials never enter source control or Terraform state.

## Prerequisites

1. Install and authenticate the Google Cloud CLI and Terraform.
2. Select your project: `gcloud config set project YOUR_PROJECT_ID`.
3. Create the runtime-only provider secret:

   ```powershell
   gcloud secrets create fortyguard-api-key --replication-policy=automatic
   'YOUR_FORTYGUARD_KEY' | gcloud secrets versions add fortyguard-api-key --data-file=-
   ```

4. Build and publish immutable API and web images to a registry you control. Build the web image with `VITE_API_BASE` set to the API URL; then provide those two image URIs to Terraform.

## Apply

Create a local `terraform.tfvars` file (it is intentionally not committed):

```hcl
project_id = "YOUR_PROJECT_ID"
api_image  = "REGISTRY/gradience-api:TAG"
web_image  = "REGISTRY/gradience-web:TAG"
web_origin = "https://YOUR_WEB_URL"
```

Then run:

```powershell
terraform init
terraform plan
terraform apply
```

For the first release, deploy the API first, note its URL, build the web image with `--build-arg VITE_API_BASE=API_URL`, and then apply the final two-service configuration with the resulting web origin. Confirm the displayed plan before applying it.
