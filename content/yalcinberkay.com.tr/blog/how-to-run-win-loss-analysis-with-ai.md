---
title: "How to Run Win/Loss Analysis with AI (Step by Step)"
description: "Learn how to use AI to analyze won and lost B2B deals, spot patterns in objections and timing, and turn them into clear changes for your sales team."
date: "2026-11-10"
category: "AI & Automation"
image: "https://images.pexels.com/photos/9034283/pexels-photo-9034283.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "How to Run Win/Loss Analysis with AI (Step by Step)"
---

A win/loss analysis with AI is a structured review of your closed deals, both won and lost. You collect call transcripts, emails, CRM notes and buyer interviews, then use a language model to tag each deal with the real reasons it closed or died. You then count those reasons across dozens of deals to see patterns no single rep would notice. The AI does the reading and the first round of tagging. You define the questions, check the output and decide what to change.

Most B2B teams already know they should do win/loss analysis, and most never do it properly. Reading 80 deal histories by hand takes days. Reps' "lost reason" dropdowns usually say "price" or "timing" no matter what happened. Interviews with lost buyers are awkward to schedule. AI removes most of the manual work. It does not remove the need for judgment. Below is the step-by-step process I recommend, with templates, example numbers and the mistakes I've seen teams make.

## What is win/loss analysis, and why use AI for it?

Win/loss analysis answers one question: **why do buyers choose us, and why do they choose someone else (or nothing)?** It is different from a pipeline review. A pipeline review looks forward at deals you can still influence. Win/loss looks backward at deals that are decided, so you can change how you sell the next ones.

The traditional method has three problems:

- **Volume.** A meaningful sample is 30–100 closed deals. Reading every call note, email thread and proposal for each one is a week of work for a sales manager.
- **Bias.** Reps fill in loss reasons themselves, and "price" is the safest answer because it blames nobody. Managers reviewing deals tend to see what they already believe.
- **Inconsistency.** Two people reading the same deal history will tag it differently unless they share a clear framework.

AI helps with all three. A model can read a 45-minute transcript and summarise the buyer's stated concerns in seconds. It applies the same tagging rules to every deal. Because it has no stake in the outcome, it doesn't protect anyone's ego. It still hallucinates, misreads sarcasm and over-weights whatever was said last, which is why the process below includes a validation step.

## What data do you need before you start?

Before you open any AI tool, check what raw material you actually have. For each closed deal, you ideally want:

1. **CRM record:** deal value, stage history, dates, owner, industry, company size, competitor (if known), lost reason field.
2. **Call recordings or transcripts:** at minimum the discovery call and any late-stage call (demo, negotiation, final review).
3. **Email threads:** especially the last 3–5 emails before the decision.
4. **Proposal or quote:** what you offered, at what price, with what terms.
5. **Buyer interview (optional but powerful):** a 15–20 minute conversation with the decision-maker after the decision.

If you're not recording calls yet, start now. Your first proper win/loss cycle will then have usable data in a quarter. I compared the main options in [this overview of AI call recording tools for sales teams](/blog/ai-call-recording-tools-sales-teams-compared). If your CRM data is patchy, fix the input side first. My guide on [automating CRM data entry with AI without errors](/blog/how-to-automate-crm-data-entry-with-ai) covers how to do that without creating a new mess.

A practical minimum: **CRM fields plus at least one transcript or detailed note per deal.** Deals with only a stage history and a dropdown reason will produce shallow analysis, AI or not.

## Step 1: Define the question and pick your sample

Don't start with "let's analyse everything." Start with a specific business question, such as:

- "Why did our win rate on mid-market deals drop last quarter?"
- "Why do we lose to Competitor X more often than to Competitor Y?"
- "Why do so many deals stall after the proposal stage and end in no decision?"

Then pick a sample that can answer it. Here is an illustrative setup for a small SaaS sales team:

- **Time window:** last two quarters
- **Deals:** 35 won, 45 lost (including "no decision")
- **Filter:** only deals that reached at least the proposal stage, so you're analysing real buying decisions rather than early disqualifications

Include wins. Many teams only study losses, which tells you what went wrong but not what "right" looks like. The comparison between won and lost deals is where the insight lives.

Aim for **at least 20–30 deals per group** you want to compare. With fewer than that, one unusual deal can swing your conclusions.

## Step 2: Collect and clean the deal data

Export the CRM records into a spreadsheet with one row per deal. Recommended columns:

- Deal ID
- Outcome (won / lost / no decision)
- Deal value
- Segment (company size, industry)
- Sales cycle length in days
- Competitor involved
- Rep-entered loss reason
- Links to transcripts, emails and the proposal

Then build a **deal dossier** for each row: a single text document that combines the key material in chronological order. A typical dossier is 2,000–8,000 words. Remove things that add noise, such as email signatures, legal disclaimers and calendar invites.

Two cleaning rules matter a lot:

1. **Strip or pseudonymise personal data** before sending anything to an external AI tool, unless your contract with that provider covers it. Replace names with roles ("Buyer – Head of Operations"). In Turkey, KVKK applies to call recordings and personal data, so check that you have consent and a proper legal basis before processing recordings at all.
2. **Keep the rep-entered loss reason separate** from the material the AI reads at first. You want the model to form its own view, then compare it with what the rep said.

## Step 3: Add the buyer's own voice

Transcripts show what buyers said during the process. Post-decision interviews show what they actually thought. Even five to ten interviews per quarter improve the analysis noticeably.

Keep interviews short and neutral. Ideally someone other than the deal owner runs them, because buyers are more honest with a third party. A simple script:

1. "What problem were you trying to solve when you started looking?"
2. "Which options did you seriously consider?"
3. "What made the final decision?"
4. "Was there a moment where you leaned toward or away from us?"
5. "If you could change one thing about how we sold to you, what would it be?"

Record the interview with consent, transcribe it and add it to the deal dossier. AI transcription handles Turkish and English well. If your interviews are in Turkish but leadership reads English, have the model summarise in English and keep the original quotes in Turkish. Translated quotes lose nuance.

## Step 4: Build a reason taxonomy

This step decides whether your analysis is useful or just interesting. A **taxonomy** is a fixed list of reasons the AI can assign to each deal. Without one, the model will invent new labels for every deal ("concerns about implementation," "implementation worries," "onboarding hesitation") and you won't be able to count anything.

Start with 8–15 reasons grouped into categories. Example:

**Product fit**
- Missing feature / capability gap
- Integration requirement not met
- Product strength (for wins)

**Commercial**
- Price above budget
- Value not proven / ROI unclear
- Contract or payment terms

**Sales process**
- Wrong or incomplete stakeholders involved
- Pain not established in discovery
- Slow or weak follow-up
- Strong champion (for wins)

**External**
- Competitor relationship / incumbent
- Internal priority change / budget freeze
- No decision / status quo

Let the AI suggest additions. Run 10 dossiers through the model and ask it to list every reason it sees, then merge those into your taxonomy. After that, **freeze the list** for the rest of the analysis.

Notice that "Price above budget" and "Value not proven" are separate. That split matters. Many deals tagged "price" by reps turn out, on reading, to be deals where the buyer never understood the value. That is a discovery and proposal problem, not a pricing problem. If you see this pattern, my article on [handling price objections in B2B sales calls](/blog/how-to-handle-price-objections-in-b2b-sales-calls) covers the conversation side.

## Step 5: Use AI to tag every deal

Now run each dossier through the model with a structured prompt. Here is a template you can adapt:

> You are analysing a closed B2B sales deal. Read the deal dossier below.
>
> 1. Assign a **primary reason** for the outcome from this list only: [paste taxonomy].
> 2. Assign up to two **secondary reasons** from the same list.
> 3. For each reason, quote the exact sentence(s) from the dossier that support it. If there is no direct evidence, write "inferred" and explain briefly.
> 4. Identify the **stage** where the deal was most likely won or lost.
> 5. Rate your confidence: high / medium / low.
> 6. Do not use any reason outside the list. If none fits, write "Other" and describe it.
>
> Return the answer as a table.

Three details in this prompt do most of the work:

- **"From this list only"** forces consistency, so you can count the results.
- **Quoted evidence** lets you verify the tag in 30 seconds instead of rereading the whole deal.
- **Confidence rating** tells you which deals need human review first.

Paste the output back into your spreadsheet as new columns: AI primary reason, secondary reasons, key stage, confidence, evidence quote.

For 80 deals, this step takes a few hours including copy-pasting, or less if someone on the team can script it through an API. If you'd rather have the workflow built for you, this kind of sales automation is part of what we do at [Corner Group, our strategy and automation company](https://cornergroup.co).

## Step 6: Validate the AI's output

Skip this step and you'll present confident-looking conclusions that are partly wrong. Validation is simple:

1. **Review every low-confidence deal** manually.
2. **Randomly sample about 20% of the rest** (16 deals out of 80) and have a manager tag them blind, without seeing the AI's answer.
3. **Compare.** If the manager and the AI agree on the primary reason in roughly 8 out of 10 cases, the tagging is reliable enough. If agreement is much lower, the taxonomy is probably ambiguous. Tighten definitions and rerun.
4. **Compare the AI's tags with the rep-entered reasons.** The gap is often a finding in itself. For example, you may see that reps tagged 60% of losses as "price" while the evidence points to price as the main factor in far fewer.

Also watch for common AI errors: treating a polite brush-off ("we'll revisit next year") as a real timing issue, over-weighting the final call and ignoring early discovery, and inventing competitor names that never appear in the dossier.

## Step 7: Find the patterns

Now you can count. Build simple pivot tables:

- Primary reason by outcome (won vs lost)
- Primary reason by segment
- Primary reason by competitor
- Key stage where deals were lost
- Reasons by rep (handle this one carefully, more on that below)

Here's an illustrative example of what this might reveal for the 80-deal sample:

- Of 45 losses, 14 have "Pain not established in discovery" as primary or secondary reason. Only 3 of the 35 wins show the same issue.
- 11 losses cluster at the proposal stage with "Value not proven," and most of those proposals had no quantified business case.
- Wins disproportionately feature "Strong champion" and multi-threading with at least three stakeholders.
- Losses to one specific competitor are almost all tied to an integration gap, not price.

Then ask the AI a second-level question. Give it all the tagged rows plus evidence quotes and prompt: *"Compare won and lost deals. What behaviours, phrases or process steps appear consistently in wins but rarely in losses? Cite deal IDs."* This often surfaces specifics, such as wins where the rep sent a written recap after discovery, or losses where pricing came up before the second meeting.

Treat these as hypotheses to test, not proven facts. With 80 deals, a difference of two or three deals is noise. A difference of 14 versus 3 is worth acting on.

## Step 8: Turn findings into changes

An analysis that ends in a slide deck is wasted. Each finding should become one concrete action with an owner and a date:

- **Discovery gaps** → Update the discovery framework and run call reviews against it. My guide on [running a B2B discovery call that finds real pain](/blog/how-to-run-a-b2b-discovery-call) is a good starting point.
- **Weak proposals** → Add a mandatory quantified business case section.
- **Competitor-specific losses** → Build a battlecard with honest positioning, and share the integration gap with product.
- **Stage-specific stalls** → Revisit your exit criteria for that stage.
- **Winning behaviours** → Write them into the playbook so new hires learn them from day one.

Then **repeat the analysis every quarter** with the same taxonomy, so you can see whether the changes moved the numbers.

## How long does it take, and what does it cost?

For a first cycle on 50–100 deals, expect roughly:

- **Data collection and cleaning:** 1–2 days (much less once the process is set up)
- **Taxonomy design:** half a day
- **AI tagging:** a few hours
- **Validation:** half a day to a day
- **Pattern analysis and action plan:** 1 day

That's about one working week for the first cycle. Later cycles typically take 2–3 days. Tool costs are modest. A business subscription to a mainstream AI assistant or pay-as-you-go API usage is usually enough at this volume, plus whatever call recording tool you already pay for. The real cost is a manager's time, and it's far less than doing the same review manually.

## What mistakes should you avoid?

- **Using AI tags to judge individual reps.** If reps learn that win/loss analysis is a performance weapon, they'll stop writing honest notes. Use it to improve the system, and handle individual coaching separately.
- **Letting the taxonomy drift.** Changing categories mid-analysis makes the numbers meaningless.
- **Ignoring "no decision" deals.** In many B2B markets, the status quo is your biggest competitor. Analyse those deals as their own group.
- **Trusting summaries without evidence.** Always require quotes. A tag without evidence is just an opinion.
- **Analysing once and stopping.** The value comes from trends over several quarters.

## FAQ

### How many deals do I need for a useful win/loss analysis?
Aim for at least 20–30 deals per group you want to compare, for example 30 wins and 30 losses. Fewer than that and a single unusual deal can distort the conclusions. If your volume is low, extend the time window to two or three quarters.

### Can AI do win/loss analysis without call recordings?
Yes, but the results will be shallower. CRM notes, email threads and proposals still give the model enough to tag many deals. Post-decision buyer interviews can partly replace missing recordings. Low-confidence tags will be more common, so plan more time for human validation.

### Which AI tool should I use for win/loss analysis?
Any capable large language model can do the tagging if you give it a clear taxonomy and a structured prompt. Some call recording platforms also offer built-in deal analysis, which saves data preparation time. More important than the tool: check that it handles your data in line with your privacy obligations, including KVKK if you operate in Turkey.

### How often should I run win/loss analysis?
Quarterly works well for most small and mid-sized B2B teams. It gives you enough closed deals per cycle and lets you measure whether last quarter's changes worked. Teams with very high deal volume can run a lighter monthly version on a sample.

## Conclusion

Win/loss analysis used to be the kind of project everyone agreed was important and nobody had time for. AI changes that. It reads the transcripts, applies a consistent framework and surfaces patterns in hours instead of weeks. The process still depends on you: asking a sharp question, building a disciplined taxonomy, validating the output and turning findings into concrete changes in discovery, proposals and positioning. Run it once and you'll learn something about your sales process. Run it every quarter and it becomes one of the most reliable ways to improve your win rate.

If you want to set up an AI-assisted win/loss process for your team, or talk through what your closed deals might be telling you, [get in touch with me here](/). I'm always happy to compare notes.
