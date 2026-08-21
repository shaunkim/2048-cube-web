# Security Policy

## Reporting a vulnerability

Report security concerns through the project's [GitHub Issues](https://github.com/shaunkim/2048-cube-web/issues). Include a concise description, affected version, reproduction steps, and expected impact using only information that is safe to publish. Do not include personal data, credentials, tokens, or other secrets in an issue.

## Accepted build-tool advisory waiver

`npm audit --omit=dev` currently reports three advisories through Expo's build tooling. The affected packages process project or native-build inputs; they are not imported by the 2048³ browser runtime.

| Advisory | Transitive dependency path | Reachability assessment |
| --- | --- | --- |
| [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) | `expo@57.0.15 → @expo/metro@56.0.0 → metro@0.84.4 → image-size@1.2.1` | A crafted ICNS build input can hang Metro's image parser. The parser runs while processing build inputs and has no path from the deployed browser runtime. |
| [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq) | `expo@57.0.15 → @expo/metro@56.0.0 → metro@0.84.4 → image-size@1.2.1` | Crafted JXL or HEIF build inputs can hang Metro's image parser. The parser runs while processing build inputs and has no path from the deployed browser runtime. |
| [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | `expo@57.0.15 → @expo/config-plugins@57.0.8 → xcode@3.0.1 → uuid@7.0.3` | The advisory affects buffered UUID v3, v5, and v6 calls. The `xcode` package uses unaffected `uuid.v4()` and is native configuration tooling, with no path from the deployed browser runtime. |

The exposure is therefore limited to a denial of service against a local or CI build supplied with malicious build assets. Production builds use only reviewed repository assets. The Pages workflow runs from reviewed commits on `main` or a deliberate `workflow_dispatch` by a trusted maintainer; it does not build untrusted pull-request content.

We do not apply unsupported dependency overrides. Although overriding Metro or UUID can silence the audit, it breaks Expo's supported dependency validation. npm's proposed forced remediation also changes the Expo SDK incompatibly, so the supported Expo dependency graph is retained under this documented, build-tool-only waiver.

This waiver must be reviewed whenever `expo`, `@expo/metro`, or `@expo/config-plugins` changes, or if the build workflow begins accepting untrusted build inputs. Each review must rerun the production audit, confirm runtime reachability, and remove the waiver once Expo ships a supported fixed dependency chain.

## References

- [Metro changes from v0.84.4 to v0.84.5](https://github.com/facebook/metro/compare/v0.84.4...v0.84.5)
- [Apache cordova-node-xcode issue #162](https://github.com/apache/cordova-node-xcode/issues/162)
