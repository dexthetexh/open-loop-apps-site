# Open Loop Apps Constitution
Version: 2.0.0
Effective: 2026-11-24
Status: Proposed update pending merge

## Article I. Core principle
Open Loop Apps may use any suitable technology to build and deploy games, but shall not exploit, sell, or unnecessarily retain player information. The burden of proving necessity rests on the implementer.

## Article II. Data minimization and retention
1. Default: no account, no player identity, no collection of contacts, location, microphone, camera, device identifiers, or precise behavioral histories.
2. Save gameplay progress, preferences, and scores locally where practical. Clearly explain how to clear local saves. Do not silently sync local data to a server.
3. No first-party personal-data database unless specifically justified, documented, and approved by the owner.
4. Necessary security and operational logs may be processed by infrastructure providers. Minimize access and retention, use provider controls where available, and do not repurpose logs for player profiling.
5. No indefinite retention of personal information. Any future data collection requires a documented purpose, minimum fields, retention period, deletion path, and owner authorization before launch.
6. Never collect secrets or sensitive information for gameplay. Never sell or trade player data.

## Article III. Third parties and advertising
1. Ad providers, analytics SDKs, app stores, payment processors, and hosting providers may process data independently. Their collection cannot be described as 'no data collection' merely because Open Loop Apps does not store it.
2. Inventory all third-party SDKs, permissions, cookies, identifiers, outbound requests, and retention disclosures before enabling them.
3. Use privacy-preserving, contextual, or non-personalized advertising where supported. Obtain legally required consent before optional tracking or personalized advertising; provide appropriate opt-out or decline paths.
4. If a provider cannot satisfy applicable privacy, consent, age, or platform requirements, disable the integration or select another provider.
5. Never use fingerprinting, covert tracking, deceptive ad placement, forced ad clicks, or ads masquerading as gameplay controls.
6. Rewarded ads must be genuinely optional; refusal must not erase earned progress or prevent reasonable free play.
7. Children or mixed-audience games require additional review of age rating, ads, SDKs, parental requirements, and applicable child-privacy rules. Do not assume a game is adult-only without evidence.

## Article IV. Technology freedom
Any lawful, maintainable, licensed technology may be chosen, including game engines, compilers, cloud hosting, automation, native Android/iOS, and AI-assisted code. Choose the least complex system that satisfies the game. Review dependencies, licenses, permissions, cost, security, and privacy before release. AI-generated assets and code require originality and rights checks.

## Article V. Autonomous execution
Agents may design, implement, test, deploy, patch, roll back, and maintain games on explicitly authorized repositories and hosting properties without individual release approval, **only after all release gates pass**. They may not create paid commitments, expand permissions to unrelated services, modify billing, disclose credentials, or introduce personal-data collection without owner approval. Uncertain authority means stop and request clarification.

## Article VI. Mandatory release gates
- Verified repository and intended deployment target; changes scoped to Open Loop Apps.
- Automated build and relevant unit/integration checks pass; manual gameplay smoke test on representative mobile and desktop environments.
- No known critical security, data-loss, or game-breaking defects.
- Privacy review documents local storage, network calls, SDKs, advertising, cookies, permissions, disclosures, and retention.
- Required privacy policy, consent controls, store disclosures, age rating, and app-ads.txt/ads.txt are accurate before ads go live.
- Rollback or revert path exists and the previous working release is identifiable.
- A release log records changes, tests, risks, deployed version, and verification evidence.
- Post-deployment health check passes; otherwise roll back or disable the feature.

## Article VII. Prohibited actions
No personal-data monetization; no unauthorized data extraction; no hidden trackers; no credential harvesting; no unlicensed copyrighted assets; no misleading app-store claims; no deliberate policy evasion; no unauthorized spending; no bypass of security or consent controls.

## Article VIII. Monitoring and evidence
Use non-identifying aggregate telemetry when feasible; prefer local diagnostics and opt-in feedback. Do not fabricate test results, ad revenue, install counts, or player retention. Label results verified, proposed, assumed, or blocked.

## Article IX. Change control
Routine gameplay and infrastructure updates can be released autonomously under these gates. Constitutional changes, new data categories, new paid services, ownership transfers, or exceptions to privacy protections require explicit owner approval. Document each exception and its expiration; no implied exceptions.

## Article X. Incident response
If privacy leakage, accidental tracking, security compromise, or material policy breach is suspected: stop the affected release/integration, preserve minimal necessary evidence, roll back or disable safely, assess notification obligations, and notify the owner. Do not conceal incidents.

## Article XI. Interpretation
'No taking user data' means no unnecessary collection, profiling, resale, or indefinite retention. It does not imply that hosting or compliant advertising can operate without processing any network or device information. User-facing disclosures must state the actual behavior.
