---
title: "How to Run a Lost Deal Analysis: A Step-by-Step Guide"
description: "How do you analyze lost B2B deals? We walk through tagging loss reasons, setting up CRM fields and finding recurring patterns."
date: "2026-10-30"
category: "Pipeline"
image: "https://images.pexels.com/photos/8171198/pexels-photo-8171198.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "How to Run a Lost Deal Analysis: A Step-by-Step Guide"
alt: "kayip-firsat-analizi-nasil-yapilir"
---

Lost deal analysis is the process of systematically reviewing the opportunities closed as "lost" in your CRM to find out **why, at which stage and in which customer segment** you lost them, and then turning those findings into concrete actions. A well-run analysis rests on four steps: sorting loss reasons into standard categories, examining CRM data quantitatively by stage and segment, talking to the customers you lost and tying the resulting patterns to corrective actions with clear owners. The goal is not to judge the past. The goal is to spot, in advance, the opportunities you would otherwise lose for the same reason next quarter.

Most B2B sales teams talk at length about the deals they win and close out the ones they lose with a note saying "price was too high," then forget about them. Yet most of the opportunities in your pipeline will not be won. Those losses hold insights about your product, pricing, targeting and sales process that you won't find anywhere else. In this guide, we explain step by step how to build a lost deal analysis from scratch. We cover every step, from the category list and CRM fields to interview questions and AI-powered automation.

## Why is lost deal analysis so important?

Sales teams usually focus on two metrics: win rate and pipeline volume. Both show the outcome, but neither shows the cause. Seeing that your win rate has dropped doesn't tell you what you need to fix. Loss analysis fills that gap.

Its concrete benefits include:

- **It exposes targeting mistakes.** If opportunities from a particular industry or company size are consistently lost, the problem may not be the rep but the fact that you're targeting that segment at all.
- **It reveals process bottlenecks.** If most opportunities are lost after the demo rather than at the proposal stage, you need to rethink your demo flow.
- **It improves forecast accuracy.** Knowing which types of opportunities drop out at which stage makes your stage-based probabilities realistic.
- **It gives product and pricing teams data.** When "the competitor has feature X" comes from a single rep, it's an anecdote. When it shows up in forty loss records, it becomes roadmap input.
- **It identifies coaching opportunities.** If one rep keeps winning in a segment while another keeps losing, the difference usually lies in a teachable skill.

## Which opportunities should count as "lost"?

Before you start the analysis, you need to be clear about what you're analyzing. In many CRMs, the "Closed Lost" stage becomes a dumping ground for very different situations. Define at least three separate close types:

1. **Lost to a competitor:** The customer made a purchasing decision but chose another solution.
2. **No decision / status quo:** The customer bought nothing. They postponed the project, moved the budget elsewhere or decided to stick with their current setup. In B2B sales, this is often more common than losing to a competitor and points to an entirely different problem.
3. **Disqualified:** The opportunity was never actually a fit. There was no budget, the decision-maker was wrong or the need didn't match your product. These records measure the quality of qualification and targeting, not sales performance.

If you skip this distinction, your analysis will mislead you. For example, if half of your losses are actually opportunities that were never qualified, you'll wrongly conclude that "our reps can't close." For this distinction to work properly, your [sales pipeline stages need to be defined with clear entry and exit criteria](/blog/how-to-define-sales-pipeline-stages). To measure the stage at which you lose, the stages first have to mean the same thing to everyone.

## Step 1: Sort loss reasons into standard categories

This is the most critical and most neglected step of loss analysis. You can't get meaningful analysis out of a CRM where reps type loss reasons as free text. Four different phrases such as "price," "found it expensive," "no budget" and "couldn't agree on fees" belong in the same category but get counted separately.

The solution is to build a two-tier reason structure: a **main category** and a **sub-reason**. An example structure:

- **Price and commercial terms**
  - Total price above budget
  - Pricing model not a fit (e.g., a flat fee was requested instead of per-user pricing)
  - Payment or contract terms not accepted
- **Product fit**
  - A critical feature is missing
  - No integration with existing systems
  - Insufficient localization or language support
- **Competitor**
  - Competitor offered a lower price
  - There was an existing relationship with the competitor
  - A specific competitor feature was preferred
- **Timing and priority**
  - Project postponed
  - Budget shifted to another priority
  - Organizational change (leadership change, merger, etc.)
- **Sales process**
  - Couldn't reach the decision-maker
  - Communication broke down, the customer stopped responding
  - Value proposition wasn't communicated clearly
- **Fit (disqualified)**
  - Company outside the ICP
  - There was no real need

**Practical rules:**

- Keep the number of main categories between 5 and 7. More than that makes selection harder, and reps retreat to the "Other" option.
- If there is an "Other" option, tie it to a mandatory description field. If "Other" exceeds 10-15 percent, your categories are incomplete.
- Review the categories once a quarter. If a new competitor has entered the market or you've launched a new product package, update the list.

## Step 2: Set up mandatory fields in your CRM

Categories are useless if they stay on paper. When an opportunity is marked as "lost," make the following fields mandatory:

1. **Close type:** Competitor / No decision / Disqualified
2. **Primary loss reason** (drop-down list)
3. **Secondary loss reason** (drop-down list dependent on the primary reason)
4. **Competitor name** (mandatory if the close type is "Competitor")
5. **Stage at which it was lost:** Even if your CRM tracks this automatically, a separate field makes reporting easier
6. **Short description:** 1-3 sentences of free text. If you have the customer's own words, write those down.
7. **Re-engagement date:** A future date for opportunities lost due to timing

In addition, the analysis will use fields that should already exist on the opportunity record: industry, employee count, region, deal size, lead source (inbound, outbound, referral, event), the opportunity's open and close dates and the owning rep.

If lead source and company information are missing, you can't analyze by segment. At this point, setting up a regular enrichment workflow to fill in missing firmographic data directly determines the quality of your loss analysis.

## Step 3: Run the quantitative analysis

Once enough data has accumulated, you can start looking at the numbers. You usually need at least a few dozen closed opportunities to see a meaningful pattern. If your volume is low, run the analysis over six-month or annual periods instead of quarterly ones.

### At which stage are you losing?

The first place to look is the distribution of losses by stage. Let's think it through with an example scenario. Say 120 opportunities were lost in one quarter:

| Stage lost | Number of losses | Share |
|---|---|---|
| Discovery call | 30 | 25% |
| Demo / solution presentation | 48 | 40% |
| Proposal | 27 | 22.5% |
| Negotiation | 15 | 12.5% |

In this table, the demo stage clearly stands out. Still, this information alone isn't enough. You also need to know how many opportunities entered the demo stage. If 100 opportunities entered the demo stage and 48 were lost, the in-stage loss rate is about 48 percent. In that case, the problem lies either in the demo itself or in opportunities that weren't sufficiently filtered out during discovery being moved on to the demo.

### Why are you losing?

Second, cross-reference primary loss reasons with stages. In the same example, if 26 of the 48 losses at the demo stage are "Product fit: critical feature missing," this is either a gap that should be passed on to the product team or a sign that you didn't probe for this need early enough in discovery. If losses at the proposal stage are mostly "Price," you might conclude that the value proposition wasn't firmly established before price came up.

### In which segment are you losing?

Third, calculate win rate by segment:

- **Industry:** In which industries is your win rate noticeably below average?
- **Company size:** Are you losing more with small businesses or enterprise accounts?
- **Lead source:** How big is the gap between outbound opportunities and referral opportunities?
- **Deal size:** Does win rate drop sharply for opportunities above a certain value?

For example, if your overall win rate is 22 percent but drops to 9 percent for companies with more than 200 employees, there are two possibilities. Either your product isn't ready for that scale, or your sales process isn't suited to long, multi-stakeholder enterprise cycles. This finding is direct input for [redefining your ideal customer profile](/blog/how-to-define-ideal-customer-profile-b2b).

### How long do lost opportunities take to close?

Compare the average lifespan of lost opportunities with that of won ones. On many teams, lost opportunities sit in the pipeline much longer than won ones. These "zombie opportunities" both inflate the forecast and eat up reps' time. If your won deals have an average cycle of 45 days while lost ones average 110 days, you can set a rule that automatically flags opportunities for review once they pass a certain number of days. This metric becomes far more meaningful when read alongside the sales cycle length you use when [calculating pipeline velocity](/blog/how-to-calculate-pipeline-velocity).

## Step 4: Talk to the customers you lost

CRM data tells you what the rep thinks, not what the customer thinks. The gap between the two is often surprisingly large. The rep writes "price," while the customer explains that they actually trusted the competitor's implementation plan more and used price simply as the easiest reason to say no.

### Who should conduct the interview?

Ideally, someone other than the rep who managed the opportunity: a sales manager, someone from the customer success team or the revenue operations lead. Customers are more polite and less candid with a rep they've built a relationship with.

### Which opportunities warrant an interview request?

Interviewing for every loss isn't realistic. Prioritize:

- Those with above-average deal size
- Those lost at a late stage such as negotiation or proposal
- Those that fit your ICP perfectly but were still lost
- Those lost to a new competitor

### Questions to ask in the interview

Limit the interview to 15-20 minutes and don't try to sell. A sample set of questions:

1. When you first started looking for this solution, what was the core problem you were trying to solve?
2. Who was involved in the evaluation process? Who made the final decision?
3. Which options did you evaluate?
4. What were the three factors that most influenced your decision?
5. What convinced you most about our solution, and what concerned you most?
6. Was there anything in the sales process that would have been more helpful to you?
7. If you were to revisit this decision in six months, what would you want to be different?

If you get permission to record the interviews, keep the transcripts. [Automatically summarizing and structuring sales call notes with AI](/blog/automate-sales-call-notes-with-ai) lets you extract common themes without manually reading dozens of interviews.

## Step 5: Find patterns and get to the root cause

Once the quantitative analysis and interviews come together, you can move from "what is happening" to "why it is happening." The most common mistake here is stopping at the first visible reason.

### Example using the "5 Whys" technique

Finding: Most losses at the proposal stage are due to "price."

1. **Why was the price considered too high?** Customers compared us with cheaper competitors.
2. **Why were we compared with cheaper competitors?** The customer evaluated the difference between the two solutions based solely on the feature list.
3. **Why did they look only at the feature list?** We didn't calculate the cost of the customer's problem together during the discovery call.
4. **Why didn't we calculate it?** That step isn't in our discovery call template, and reps rush to get to the demo.
5. **Why are they rushing?** Reps are measured on the number of demos.

As you can see, the "price" problem turned out to be a **measurement and process design** problem. Rather than lowering prices, adding a value calculation step to discovery and measuring the qualified demo rate instead of demo count would be a far more lasting solution.

### Consolidate findings on a single page

At the end of each analysis period, prepare a short three-part summary:

- **The top three loss reasons** and each one's share of total losses
- **What changed this period:** Categories that increased or decreased compared with the previous period
- **Hypothesis:** The likely root cause behind each main reason

## Step 6: Turn findings into actions with clear owners

Loss analysis is only worth as much as the action it produces. On teams where the report is presented and then forgotten, reps stop filling in the form after a few quarters because they can see it doesn't lead anywhere.

Use this format for each finding:

- **Finding:** At companies with 200+ employees, win rate is less than half the overall average.
- **Action:** Pause outbound targeting for this segment for a one-quarter trial period. Shift resources to the 20-200 employee range.
- **Owner:** Sales operations manager
- **Success metric:** An increase in overall win rate next quarter and a shorter average cycle for outbound-sourced opportunities
- **Review date:** End of quarter

Actions are usually spread across several teams:

- **Sales team:** Discovery questions, demo flow, objection-handling guides, coaching
- **Marketing / lead generation:** Target segment, messaging, lead source mix
- **Product:** Missing features, integrations
- **Leadership:** Pricing model, packaging, contract terms

If loss analysis shows that the targeting itself is the problem, meaning you're starting conversations with the wrong companies, the issue needs to be solved at the top of the pipeline. For B2B SaaS companies, [SAAS Corner's outbound sales and lead generation service](https://saascorner.co), which runs this side end to end, can be an option for teams that want to build an ICP-aligned opportunity flow from the ground up.

## Step 7: Automate the process

When loss analysis is done manually, two problems arise: data is entered incompletely, and the analysis only happens when someone remembers. A significant part of the process can be automated:

- **Mandatory field checks:** When an opportunity is moved to the "lost" stage, the record can't be saved if the loss reason, close type and competitor fields are empty.
- **Automatic interview requests:** When opportunities above a certain value are lost, a few days later the customer receives a short email requesting a feedback call, and a task is assigned to the sales manager.
- **AI-based reason classification:** Interview transcripts and email threads are fed to a language model to generate a suggested loss reason, which is compared with the reason the rep selected. The discrepancies between the two are where the most valuable insights emerge.
- **Reactivation workflow:** Opportunities lost due to "timing" are automatically enrolled in a follow-up sequence on the set re-engagement date. These are accounts that already know you and have a validated need, making them much warmer than a lead found from scratch.
- **Periodic report:** On the first business day of each month, the loss distribution by stage and reason is automatically sent to the relevant people.

You can build these workflows with your CRM's native automation features or with workflow tools such as n8n and Make. What matters is that the analysis depends on the system, not on one person's goodwill.

## How often should loss analysis be done?

The cadence depends on your opportunity volume and the length of your sales cycle. A general framework:

- **Weekly:** Last week's losses are discussed in a brief review during the sales meeting. The goal isn't analysis but checking record quality and sharing fresh information.
- **Monthly:** The loss distribution report by stage and reason is reviewed, and notable changes are recorded.
- **Quarterly:** Segment analysis, synthesis of loss interviews, root cause work and the action plan are completed. Marketing and product teams should join this meeting alongside sales.
- **Annually:** Loss categories, the ICP definition and the pricing model are re-evaluated in light of this data.

Reflecting quarterly findings in your stage-based probabilities is also the foundation of [building a realistic sales forecast from your pipeline](/blog/sales-forecasting-from-pipeline). For example, if historically only a small share of demo-stage opportunities have been won, assigning a high probability to that stage in your forecast model will consistently mislead you.

## What are the most common mistakes?

**1. Relying only on the rep's account.** Reps, as is human nature, tend to attribute losses to external factors. "Price" and "timing" are the most frequently selected reasons because they don't blame anyone. That's why a second source, such as customer interviews and AI-assisted classification, is essential.

**2. Excluding won opportunities from the analysis.** What makes losses meaningful is comparing them with wins. Knowing that "40 percent of losses are in the enterprise segment" means nothing if 40 percent of wins are also in the enterprise segment. Always talk in terms of win rate.

**3. Not counting no-decisions as losses.** Situations where the customer bought nothing are often left in the pipeline as "postponed" or quietly deleted. Yet losing to the status quo is the clearest sign that your value proposition isn't creating urgency.

**4. Turning the analysis into a blame tool.** If loss meetings become sessions where individual reps are held to account, data quality drops quickly. People choose reasons that protect themselves instead of entering honest records. The focus should be on the system and the process.

**5. Drawing big conclusions from small samples.** Losing three opportunities to a particular competitor in one quarter is not a trend. If you're working with small numbers, label findings as "hypotheses" and validate them in the next period.

**6. Not following up on actions.** The first item of every quarterly analysis should be the results of the actions taken the previous quarter. Otherwise, you'll rediscover the same finding every period.

## Frequently asked questions

### What is the minimum number of opportunities needed for lost deal analysis?

There's no fixed threshold, but below a few dozen closed opportunities, segment-level results usually aren't reliable. If your volume is low, spread the analysis over a longer period and make up for the lack of quantitative data with more customer interviews. With limited data, treat findings as hypotheses to test rather than firm conclusions.

### Is lost deal analysis the same as win/loss analysis?

They're closely related, but their scope differs. Win/loss analysis examines both won and lost opportunities to identify what separates them. Lost deal analysis focuses on losses. In practice, the soundest approach is to always use won opportunities as a comparison group when analyzing losses.

### Will lost customers agree to a feedback interview?

Not everyone will, but when the request is kept short and it's made clear that it has no sales intent, a reasonable share respond positively. Having a manager rather than the rep who managed the opportunity send the request, and limiting the call to 15-20 minutes, increases the acceptance rate. You can also gather valuable information from those who decline the interview through a short written survey.

### Can lost opportunities be won back later?

Yes. Opportunities lost due to timing, budget or organizational change in particular are the group best suited to reactivation. A good practice is to enter a re-engagement date in the CRM for these opportunities and trigger an automated follow-up workflow on that date. Accounts lost to a competitor can also be revisited close to their contract renewal period.

## Conclusion

Lost deal analysis is the most direct way to hear what your pipeline is trying to tell you. When standard categories, mandatory CRM fields, quantitative analysis by stage and segment, customer interviews and actions with clear owners come together, the question "why did we lose?" stops being a guess and becomes a measurable process. Once you build this process and support it with automation, every loss becomes input for your next win.

If you want to build a system that automatically collects loss reasons in your CRM, classifies call notes with AI and moves timing-related losses into a reactivation workflow, we can assess your current process together. [Schedule a call with the Sales Corner team](/en/iletisim), and let's design a structure that turns the losses in your pipeline into growth.
