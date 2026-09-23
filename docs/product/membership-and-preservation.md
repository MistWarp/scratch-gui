# Memberships, preservation, and sustainable growth

Proposal for review, 23 September 2026. PR #37 changes the membership page and its wording. It does not change prices, upload allowances, storage lifecycle, or project access.

## Recommendation

Make Rotur memberships the recurring source of support for MistWarp's shared infrastructure and growing project archive. Give paying members useful creative tools and presentation options; keep creating, publishing, discovery, and community participation useful on Free. Preserve older projects, including those from inactive creators. Never make inactivity, age, membership cancellation, or a storage experiment a reason to delete a project.

The public promise should be specific: “Projects do not expire just because they are old or their creator is inactive.” This describes the intended policy without promising permanent availability regardless of owner deletion, moderation, or service operations. Recovery windows apply only after a project is deleted. They are not the lifespan of a published project.

Start with the existing Plus offering rather than adding another subscription. Plus has tangible tools—advanced analytics/CSV export and project branding—at the existing £1.75/month. Pro adds a custom project URL, longer analytics/recovery windows, and lower sales fees at £5.75/month. Lite at 15 RC/month is a useful participation option, but spending earned credits is not necessarily cash revenue. These are the current monthly prices in the frontend and Rotur's `src/lib/billing.ts`, not a recommendation to change pricing.

## What the backend actually does

Reviewed the local `mistwarp-api` source, including `main.osl`, `perks.osl`, `projects.osl`, `r2-upload-queue.osl`, `storage-addressing.osl`, and `monetize.osl`.

- Assets use shared content-addressed keys. Project JSON and workspace snapshots also have content-addressed keys, and workspace history can use layers/deltas. A remix or a save is not necessarily another independent copy of all assets.
- New blobs are written locally and queued for R2. Local-cache inactivity is based on the latest edit of every referencing project, including Trash. The configured inactivity window is seven days.
- The upload queue also backs up queued blobs after one hour, even while active. It can skip uploading immutable objects already present in its inventory. Active projects keep local copies; inactive local copies can be evicted after cloud persistence. This is cache eviction, not deletion of the project or its durable cloud data.
- Consequently, the owner's observation that older projects are the main cost is plausible, but “only old projects cost money” is not established by code: active objects can also be stored in R2, and the server has its own costs. Measure the bill and inventory before asserting a cost breakdown publicly.
- Free currently has 100 MiB of rolling seven-day upload allowance, a 10 MiB single-asset cap, 50 MiB aggregate assets per project, and a 100-project cap. Lite/Plus/Pro raise these limits. It would be inaccurate to describe current creation as unlimited.
- The main upload path exempts no-change saves, but changed project/workspace uploads and staged parts can consume the traffic allowance. The allowance measures uploaded bytes, not long-term unique storage growth. It can interrupt active iteration even when the durable storage increase is small.
- Owner-deleted projects move to Trash and get a recovery deadline. `purgeExpiredTrash` handles those explicitly deleted projects; it is not an inactivity sweep over published projects.
- MistWarp's commerce split is 10%, 7%, or 5% according to the project owner's tier. That is RC-denominated platform income, not proof of cash available to pay hosting bills.

## The page in this PR

The page shows screenshots captured from the running MistWarp interface with clearly labelled sample project data: analytics, branding, and Trash. Each feature has a link to its existing entry point. Analytics and branding links open the user's projects so they can choose one to manage; Trash has a direct destination.

Features come first, followed by the cost/preservation explanation, four memberships including Free, and a comparison with separate Creator tools, Uploads and storage, and Project sales tabs. Upload limits remain visible and accurately described, but no longer dominate each plan card. Billing stays on Rotur, with the same account and an explicit external link. Membership does not buy access to every creator's separately priced project.

Named checkpoints and advanced-history flags are not marketed here: the audit found the entitlements but did not establish a corresponding gated entry point in the current interface. Add them only when a user can find and use the feature.

## Proposed upload policy—not shipped

Treat preservation as a shared operating cost. Avoid replacing a weekly quota with a lifetime storage meter that forces creators to delete old work to keep creating.

| Area | Proposed policy | Reason |
| --- | --- | --- |
| Existing projects | Preserve playable project content and reachable assets/history; no expiry for age, inactivity, or membership downgrade. | The archive is part of the platform's value. |
| Ordinary editing | Progress toward allowing normal saves without exhausting a weekly traffic budget. First measure and account for unique persisted bytes, history deltas, and transient uploads separately. | A small edit should not repeatedly consume an entire project's upload size. |
| Upload abuse and very large files | Keep explicit per-request and per-asset safety limits, burst rate limits, and review of exceptional usage. Make error messages preserve local work and offer export/retry. | These protect processing and availability without taxing ordinary participation. |
| Free allowance experiment | Trial a larger allowance for a small cohort after the byte-accounting audit; 250 MiB/week is a test hypothesis, not a promised entitlement or a proven affordable limit. Retain a control group and monitor storage growth. | Tests whether the current 100 MiB limit is hurting publishing and return visits. |
| Existing 20 RC reset | Keep the current behaviour during the study, but do not promote a blocked save as the main upgrade funnel. Reconsider the reset once normal editing no longer depends on buying one. | Buying relief from friction is a weak long-term reason to support the platform. |
| Cache cleanup | Evict only safe local copies after confirmed cloud persistence. Preserve durable referenced blobs. | This recovers local capacity without removing old projects. |
| Temporary/unreferenced data | Inventory and dry-run first; prove no live project, remix, release, history, or recovery record depends on an object before considering deletion. | “Old” and “unreferenced” are different conditions. No cleanup is authorised by this proposal. |

Do not claim that a bigger weekly allowance fixes storage cost accounting. It is a reversible product experiment while the better accounting is designed. Do not reduce existing members' entitlements or interrupt already-uploaded projects when rolling back an experiment.

## Fund the growing archive

Track two separate ledgers: cash and credits. Cash means net membership receipts allocated from Rotur, plus any attributable net cash from credit purchases. RC transfers, earned-credit spending, quota resets, and platform fees need their own ledger. Do not count a credit-pack purchase and its later marketplace spend as two cash inflows, or treat credits owed to creators as unrestricted operating revenue.

For each month, record:

- Actual R2 storage and request costs, local server/backups/services, and payment costs; record maintenance labour separately, including unpaid work.
- R2 inventory by assets, project JSON, workspace/history, and other objects; local cached bytes separately. Attribute shared blobs once, and use the most recent activity of all references when classifying active/archive data.
- Net new unique bytes and retained GB-months, with active versus inactive cohorts; avoid summing whole-project sizes as a bill estimate.
- Net cash retained per Plus/Pro member after processing, refunds, tax treatment, and the share needed by other Rotur services. These amounts are unknown here and must come from billing records.

Use one currency and one accounting period:

`coverage = cash allocated to MistWarp / actual MistWarp operating costs`

`additional members needed = ceil(max(0, costs + reserve contribution - other available cash) / weighted net cash contribution per member)`

Model archive growth over at least 12 months; the storage obligation continues after a member cancels. Choose a reserve target based on actual expenses and revenue volatility before publishing a funding goal. A public monthly cost/support summary could build trust later, but should use reconciled amounts and explain Rotur's allocation. Do not ship a made-up progress bar.

Cloudflare's [R2 pricing](https://developers.cloudflare.com/r2/pricing/) currently lists Standard storage at $0.015/GB-month, plus request charges, with free egress and a free tier. These are vendor rates, not MistWarp's bill. Infrequent Access has retrieval fees and minimum-duration rules: do not move all old projects there solely because they are old. Compare total cost under measured reads, especially if rediscovery makes older projects popular again. These details were checked on 23 September 2026.

## Keep people creating and returning

Prioritise successful saves, first publication, finding something worth playing, and receiving useful feedback. Membership should be a natural next step after someone has experienced that value.

1. Improve the member handoff now: concrete tools, clear monthly prices, same Rotur account, and accurate return-state benefits. Measure page view, tier click, checkout completion, and cancellation separately; an outbound click is not a conversion. Verify that the analytics collector accepts any new event before adding it, and honour existing opt-out preferences.
2. Test support opportunities after a positive moment—finishing a project, receiving feedback, or returning to a favourite—without interrupting saving or playback. Existing tips/comments and voluntary project sales give creators a path to support. A future optional pay-what-you-want flow could let free projects earn support; it is not implemented in this PR. [itch.io's pricing documentation](https://itch.io/docs/creators/pricing) is a relevant example of allowing optional payments alongside free access, not evidence of MistWarp's likely conversion rate.
3. Help the archive earn its place: test rediscovery of relevant older work, updates from followed creators, and easy return to saved projects. Put any Home additions inside existing Home tabs; keep the project stats bar unchanged. These are future experiments, not membership benefits advertised now.
4. Measure meaningful return activity rather than raw watch time: a returning visitor plays a project, saves something, leaves a substantive comment, follows a creator, remixes, or publishes. Avoid forced viewing, streak pressure, repeated upgrade prompts, or paid ranking as a shortcut to engagement.

## Four-week evaluation

First establish a baseline: weekly active creators/viewers, first-save and first-publish success, quota-hit rate per creator, subsequent save/publish success after a hit, and 7/28-day return rates. Capture net membership receipts and unique storage growth at the same time. No production metrics were available for this proposal.

Run the page experiment for four weeks, with a contemporaneous control if practical; a simple before/after comparison is directional because launches, seasonality, and traffic mix can change. Let 28-day cohorts mature before claiming a retention effect. With low traffic, use interviews and quota-related support reports alongside the counts rather than declaring statistical significance.

Success means better qualified membership uptake and contribution toward costs while free creators still save/publish and viewers return to meaningful activity. Investigate any drop in those measures, increased checkout confusion, or concern that older projects will disappear. Set numeric guardrails from observed baseline variability and the actual spending budget before a quota experiment. Run quota changes separately so their effect can be distinguished from the page redesign.

## Second opinion

Requested advice using `claude -p --model claude-fable-5-1`, with a factual brief and no tools or editing access. Fable 5.1 supported preservation-led funding, the shared Rotur membership, concrete creator tools, separate cash/RC accounting, and retention guardrails.

This proposal does not adopt its suggestions to promise every published project will stay playable forever, call current creation uncapped, or assume existing weekly quotas are harmless. The backend has upload and project-count caps, owners can delete projects, and the user explicitly wants us to investigate friction. It also does not put the quota table first: the requested page focuses on feature screenshots, while keeping detailed limits accessible.
