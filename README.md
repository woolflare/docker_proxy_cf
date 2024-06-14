# Deploying Docker Registry Proxy on Cloudflare Worker

Follow these steps to set up your Docker Registry proxy using Cloudflare Workers. This guide assumes you already have a Docker and Cloudflare account.

## Step 1: Deploy the Worker
1. **Copy the Script**:
   - Open the `index.js` file from this repository.
   - Copy all the content.
2. **Paste into Cloudflare Worker**:
   - Log into your Cloudflare account.
   - Go to the Workers section and open or create a new worker.
   - Paste the copied content into the script editor in the Cloudflare Worker's dashboard.
   - Save your changes.

## Step 2: Bind a Custom Domain
1. **Add Route**:
   - Still in the Workers section, select your worker.
   - Go to the "Triggers" tab and add a route using your custom domain (e.g., `https://your-domain.com/*`).
   - Ensure that your DNS settings for the domain are correctly configured in Cloudflare.

## Step 3: Configure Docker to Use the Proxy
1. **Modify Docker Settings**:
   - Open or create the `/etc/docker/daemon.json` file on your Docker host.
   - Add or modify the `registry-mirrors` entry to include your custom domain:
     ```json
     {
       "registry-mirrors": ["https://your-domain.com"]
     }
     ```
   - Save the changes.
2. **Restart Docker Service**:
   - Restart the Docker service to apply the changes. Depending on your system, this can typically be done with a command like `sudo systemctl restart docker`.

Done! Your Docker installations will now use your Cloudflare Worker as a proxy for Docker Registry requests, which can improve pull performance and provide additional security benefits.
