# Forgejo Actions Configuration for Fluxer

This directory contains the Forgejo Actions workflows for building desktop releases, running automated code correctness checks on pull requests, and keeping your homelab Fluxer server container updated with the latest bug fixes.

---

## Workflows Overview

| Workflow | File | Triggers | Description |
|---|---|---|---|
| **PR & Code Correctness** | [`.forgejo/workflows/pr-checks.yaml`](./workflows/pr-checks.yaml) | Pull Requests, Push to `main` | Runs linting, typechecks, unit tests, Rust/Cargo checks, Gateway (Erlang/Rebar3) tests, Knip dead-code checks, i18n drift checks, and OpenAPI schema drift checks. (PR title validation and GitHub App triage labeler are omitted). |
| **Desktop Release Build** | [`.forgejo/workflows/build-desktop-release.yaml`](./workflows/build-desktop-release.yaml) | Release Published, Manual Trigger | Builds desktop binaries across platforms: Linux (**`.deb`** and **`.rpm`**, plus `.AppImage` and `.tar.gz`), Windows (**`.exe`** and portable `.zip`), and macOS (**`.dmg`** and `.zip`). Attaches all packages and `.sha256` checksums directly to the Forgejo release. |
| **Homelab Server Update** | [`.forgejo/workflows/update-fluxer-server.yaml`](./workflows/update-fluxer-server.yaml) | Push to `main`, Release Published, Manual Trigger | Communicates with your Fluxer Docker container on the Proxmox LXC container network to pull the latest changes, update containers with bug fixes, and verify service health. |

---

## 1. Desktop Releases (`deb`, `rpm`, Windows, Mac)

When you create and publish a release in Forgejo (e.g., `v1.0.0`):
1. **Linux Build**:
   - Compiles native workspace modules and the Electron main process.
   - Generates native packages:
     - **Debian / Ubuntu**: `.deb`
     - **Fedora / RHEL / openSUSE**: `.rpm`
     - **Universal Linux**: `.AppImage` and `.tar.gz`
2. **Windows Build**:
   - Generates Windows executable `.exe` installer and portable `.zip`.
3. **macOS Build**:
   - Generates `.dmg` disk image and `.zip`.
4. **Asset Attachment**:
   - Built binaries are uploaded directly to your Forgejo Release assets using the Forgejo REST API (`POST /api/v1/repos/{owner}/{repo}/releases/{id}/assets`).
   - No external third-party services or GitHub URLs are involved.

---

## 2. Homelab Server Update (Proxmox LXC Container Network)

In your Proxmox LXC container setup, containers communicate directly over the container bridge network (the same way Caddy routes traffic to `api:8080`, `gateway:8080`, etc.).

The update workflow supports:
- **Direct Docker Socket (Recommended)**: If your Forgejo runner container shares `/var/run/docker.sock` with the LXC host, the runner directly executes `docker compose pull && docker compose up -d` in your Fluxer directory.
- **SSH Key**: If configured, the runner connects via SSH to the container/host using repository secrets (`FLUXER_SSH_HOST` and `FLUXER_SSH_KEY`).
- **Health Verification**: After applying updates, it polls the internal container health endpoint (`http://edge/_health` or `http://api:8080/_health`) to verify services are healthy.

### Optional Repository Variables & Secrets
Configure these in Forgejo under **Repository Settings** -> **Actions** -> **Secrets / Variables**:

| Name | Type | Default | Description |
|---|---|---|---|
| `FLUXER_COMPOSE_DIR` | Variable | `/opt/fluxer` | Path to the directory on the host containing your `docker-compose.yml` and `.env`. |
| `FLUXER_HEALTH_URL` | Variable | `http://edge/_health` | Internal URL to verify after container reload (e.g. `http://edge/_health` or `http://api:8080/_health`). |
| `FLUXER_SSH_HOST` | Secret | _Optional_ | Host or container IP (e.g. `192.168.86.3`) if connecting over SSH. |
| `FLUXER_SSH_USER` | Secret | `root` | SSH user to run the update command. |
| `FLUXER_SSH_KEY` | Secret | _Optional_ | Private SSH key for automated SSH connection. |

---

## 3. Pull Request Checks (Code Correctness)

The PR workflow runs on PR open, update, and merge to `main`. It focuses strictly on **code correctness**:
- ✅ **Biome CI**: Code formatting and linting.
- ✅ **ESLint**: Translation safety checks on JSX/TSX.
- ✅ **TypeScript**: Full workspace typechecking.
- ✅ **Tests**: JS/TS unit and integration test suites.
- ✅ **Rust Toolchain**: `cargo clippy`, `cargo fmt`, `cargo deny` (dependencies/licenses), and `cargo test`.
- ✅ **Gateway**: Erlang OTP 28 and Rebar3 formatting, compilation, dialyzer, and eunit tests.
- ✅ **Knip**: Unused export and dependency analysis.
- ✅ **i18n**: Locale catalogs compilation and drift prevention.
- ✅ **Docs**: Documentation accuracy against live API endpoints.
- ✅ **OpenAPI**: Schema drift validation.

Excluded per specification:
- ❌ Conventional PR title validator (`Validate title (pr)`)
- ❌ Automated GitHub App labeling / triage (`labeller.yaml`)
