# Security

The Mermaid team takes the security of Mermaid and the applications that use Mermaid seriously. This page describes how to report any vulnerabilities you may find, and lists best practices to minimize the risk of introducing a vulnerability.

## Reporting vulnerabilities

To report a vulnerability, please e-mail security@mermaid.live with a description of the issue, the steps you took to create the issue, affected versions, and if known, mitigations for the issue.

We aim to reply within three working days, probably much sooner.

You should expect a close collaboration as we work to resolve the issue you have reported. Please reach out to security@mermaid.live again if you do not receive prompt attention and regular updates.

You may also reach out to the team via our public Slack chat channels; however, please make sure to e-mail security@mernaid.live when reporting an issue, and avoid revealing information about vulnerabilities in public as that could that could put users at risk.

## Best practices

Keep current with the latest Mermaid releases. We regularly update Mermaid, and these updates may fix security defects discovered in previous versions. Check the Mermaid release notes for security-related updates.

Keep your application’s dependencies up to date. Make sure you upgrade your package dependencies to keep the dependencies up to date. Avoid pinning to specific versions for your dependencies and, if you do, make sure you check periodically to see if your dependencies have had security updates, and update the pin accordingly.

## Configuring DomPurify

By default Mermaid uses a baseline [DOMPurify](https://github.com/cure53/DOMPurify) config. It is possible to override the options passed to DOMPurify by adding a `dompurifyConfig` key to the Mermaid options. This could potentially break the output of Mermaid so use this with caution.
