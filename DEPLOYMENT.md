# Deploying Backend to Google Cloud Run

This guide details how to build, push, and deploy the uKnight backend container to Google Cloud Run.

## Prerequisites

1.  **Google Cloud CLI (`gcloud`)**: Installed and authenticated (`gcloud auth login`).
2.  **Docker**: Installed and running.
3.  **Project ID**: Your Google Cloud Project ID (e.g., `uknight-12345`).

## 1. Environment Setup

Set your project ID variable for convenience:

```bash
export PROJECT_ID="project-74c47352-7a04-4409-82c"
export REGION="us-central1" # Or your preferred region
export FRONTEND_URL="https://u-knight.vercel.app"
```

## 2. Create Artifact Registry Repository

If you haven't already, create a Docker repository in Artifact Registry:

```bash
gcloud artifacts repositories create uknight-repo \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for uKnight backend"
```

Configure Docker to authenticate with this region:

```bash
gcloud auth configure-docker $REGION-docker.pkg.dev
```

## 3. Build & Push Docker Image

Build the image specifically for the cloud registry:

```bash
docker build --platform linux/amd64 -t $REGION-docker.pkg.dev/$PROJECT_ID/uknight-repo/backend:latest backend/server
```

Push the image to Google Cloud:

```bash
docker push $REGION-docker.pkg.dev/$PROJECT_ID/uknight-repo/backend:latest
```

## 4. Deploy to Cloud Run

Deploy the service. **Crucially**, we set the `cors.allowed-origins` environment variable here to allow your frontend to connect.

```bash
gcloud run deploy uknight-backend \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/uknight-repo/backend:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "^@^cors.allowed-origins=https://u-knight.vercel.app,http://localhost:3000"
```

*Note: Replace `https://your-frontend-domain.com` with your actual frontend URL once deployed.*

## 5. Verifying Deployment

Once deployed, Cloud Run will provide a URL (e.g., `https://uknight-backend-xyz.a.run.app`).

You can test connectivity:

```bash
curl https://uknight-backend-xyz.a.run.app/ws/info
```
