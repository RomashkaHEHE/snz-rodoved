# Task: Autodeploy

Status: DONE
Priority: High

## Goal

Deploy automatically to the VPS when `main` receives a push, without touching other projects on the server.

## Current Understanding

- Server public IP: `46.16.36.87`.
- SSH user: `user1`.
- Deployment must stay isolated in `/home/user1/apps/snz-rodoved` by default.
- GitHub Actions should use SSH key auth, not the server password.
- Domain setup depends on the final domain name and DNS provider.
- Production domain: `snz-rodoved.ru` with `www.snz-rodoved.ru`.
- As of 2026-04-27, the server is bootstrapped:
  - deploy key auth works for `user1`;
  - Node.js 20 is installed under `/home/user1/.local/bin`;
  - user-level systemd service `snz-rodoved` is enabled and active;
  - local health check `http://127.0.0.1:4000/api/health` returns `{"ok":true}`;
  - `loginctl enable-linger user1` is enabled so the service survives reboots.
  - nginx has a separate `snz-rodoved.conf` reverse proxy for `snz-rodoved.ru` and `www.snz-rodoved.ru`.
  - `curl -H 'Host: snz-rodoved.ru' http://46.16.36.87/api/health` returns `{"ok":true}`.
  - Let's Encrypt certificate is issued for `snz-rodoved.ru` and `www.snz-rodoved.ru`.
  - HTTP redirects to HTTPS, and HTTPS health checks return `{"ok":true}`.

## Relevant Files

- `.github/workflows/deploy.yml`
- `scripts/deploy/activate-release.sh`
- `scripts/deploy/bootstrap-user-service.sh`
- `docs/autodeploy.md`

## Next Steps

1. Add GitHub Actions secrets.
2. Push to `main` or manually run the `Deploy` workflow.
3. Add GitHub Actions secrets if they are not in the repository settings yet.
4. Push to `main` or manually run the `Deploy` workflow.

## Exit Criteria

- GitHub Actions deploy job passes on `main`.
- `systemctl --user status snz-rodoved` is healthy on the server.
- Domain points to `46.16.36.87`, HTTPS works, and reverse proxy reaches `127.0.0.1:4000`.

## Handoff Notes

Do not store the server password in GitHub Secrets. Use SSH key auth for deploy. Do not edit existing nginx configs for other projects; create a separate `snz-rodoved.conf`.

Verified locally after adding workflow/docs:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm audit --audit-level=moderate`

The bootstrap and activation scripts have been run successfully on the Linux server. Keep using the existing server layout; do not move the SQLite DB out of `shared/data`.
