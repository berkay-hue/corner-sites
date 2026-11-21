---
title: "How to Build a B2B Lead Scoring Model: Step by Step"
description: "How to build B2B lead scoring: set fit and engagement scores, define thresholds, automate in your CRM and test the model against sales data."
date: "2026-10-28"
category: "Lead Generation"
image: "https://images.pexels.com/photos/34069/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "How to Build a B2B Lead Scoring Model: Step by Step"
alt: "b2b-lead-scoring-nasil-kurulur"
---

**B2B lead scoring works by rating prospects on two axes: how closely the company matches your ideal customer profile (fit) and how much interest it shows in your product (engagement).** To build a sound model, you start by analyzing the opportunities you've won and lost. Next, you assign points to firmographic and behavioral criteria and define negative scoring and score decay. Finally, you set your MQL and SQL thresholds, integrate the model into your CRM and recalibrate it every quarter against actual sales results.

It may look simple on paper, but lead scoring is one of the systems B2B SaaS companies most often get wrong. In this article, we'll walk step by step, with sample numbers, through the logic of the scoring table, how to choose criteria, how to set thresholds and how to run the model in your CRM. Our goal is to help you build a system where your sales team stops asking, "Why did you send me this lead?"

## What is lead scoring, and why does it work differently in B2B?

Lead scoring is a method of assigning each prospect a numerical value that shows how close they are to buying. The goal is to direct your sales team's limited time toward the people and companies with the highest likelihood of closing.

In B2C, a single person's behavior is often a sufficient signal. In B2B, things are more complicated:

- **Purchasing decisions are made by a committee.** Anywhere from 3 to 8 people from one company may be involved in the process. The technical evaluator, the budget holder and the end user all behave differently.
- **Sales cycles are long.** A mid-market SaaS deal can take months. Interest levels rise and fall throughout that period.
- **The company matters more than the individual.** A student who loves your content might score 100 points but will never become a customer. Meanwhile, a procurement manager at a right-sized company in your target industry can be valuable even after visiting your website just once.

That's why B2B lead scoring also requires **account-level scoring** alongside individual scores. If you'd like a broader perspective on where lead scoring fits into the overall qualification process, our article on [the qualification journey that improves lead quality in SaaS](https://saascorner.co/blog/lead-kalitesi-den-lead-kalitesi-e-saas-qualification-yolculugu) is a good place to start.

## What data do you need before you start?

Before you start building the model, take inventory of the data you have. Even the best model will produce the wrong results if it's built on bad data. At a minimum, you'll need:

1. **Closed opportunities from the last 12-24 months (won and lost):** CRM records of the deals you've won and lost. To identify patterns, you should ideally have at least a few dozen won opportunities.
2. **Firmographic data:** Industry, employee count, revenue range, location and technologies used.
3. **Contact data:** Job title, department and seniority level.
4. **Behavioral data:** Website visits, email engagement, form submissions, webinar attendance, demo requests and trial usage.
5. **Feedback from the sales team:** The people who talk to leads know best which ones are a "waste of time."

If your firmographic data has gaps, you can fill them with data enrichment tools. For example, B2B data platforms like [Apollo.io](https://get.apollo.io/679irkzm35ya) make it easy to add company size, industry and job title information to your CRM records. That way, you can meaningfully score even someone who left only an email address when filling out a form.

## Step 1: Analyze the customers you've won and lost

A lead scoring model should be built on real past outcomes, not assumptions. The first task is to export your closed opportunities from the CRM and ask the following questions:

- Which industries do most of our won customers come from?
- In which employee count range is our close rate highest?
- Which job titles initiate deals, and which ones sign them?
- Which content did won opportunities engage with before moving to sales?
- What do lost opportunities have in common? For example, insufficient budget, the wrong company size or failing to reach the decision-maker.

Let's work through a simple example. Imagine a fictional SaaS company selling human resources software in Türkiye. Suppose the analysis produces the following picture:

- The majority of won customers are companies with **100-500 employees**.
- The best-performing industries are **retail, manufacturing and logistics**, all industries with high employee turnover.
- The process is usually initiated by the **HR manager** and approved by the **CFO or general manager**.
- Most won opportunities visited the **pricing page** and at least one **case study** before the sales call.
- Deals with companies under 50 employees were mostly lost due to budget.

These findings form the backbone of your scoring table. This analysis also sharpens your ideal customer profile (ICP). If you'd like to build a target company list based on your ICP, take a look at our guide on [how to build a target account list in B2B](/blog/how-to-build-b2b-target-account-list).

## Step 2: Define your fit score (firmographic and demographic criteria)

The fit score answers the question, "Is this company, and this person, a good match to become our customer?" It is independent of behavior and generally doesn't change over time.

For our example HR software company, fit scoring might look like this (maximum 50 points):

### Company criteria

- **Employee count:**
  - 100-500 employees: +20
  - 50-99 or 501-1,000 employees: +10
  - Fewer than 50 employees: 0
  - More than 1,000 employees: +5 (requires a different sales motion)
- **Industry:**
  - Retail, manufacturing, logistics: +10
  - Services, healthcare, education: +5
  - Other: 0
- **Location:**
  - Headquartered in Türkiye: +5
  - Country not served: -20

### Contact criteria

- **Job title and seniority:**
  - HR director, HR manager, CHRO: +15
  - CFO, general manager, founder: +10
  - HR specialist: +5
  - Student, intern, consultant: -10

There's an important point here: **Your scores should be based on your own data.** The figures above aren't a template; they're examples meant to illustrate the logic. At your company, businesses with 20-50 employees might be your best customers. In that case, the table would be completely reversed.

As a practical rule, give your strongest criterion the highest score. Then distribute the rest proportionally according to their weight in your won opportunities.

## Step 3: Define your engagement score (behavioral criteria)

The engagement score answers the question, "How interested is this person right now?" Unlike the fit score, it changes constantly.

It helps to split behaviors into two groups: **high-intent** and **low-intent** signals.

### High-intent signals

- Submitting a demo request form: +30
- Visiting the pricing page: +15
- Starting a free trial: +25
- Replying positively to a sales email: +20
- Visiting a competitor comparison page: +10
- Reading a case study: +10

### Low-intent signals

- Reading a blog post: +2 (per visit, up to +10)
- Opening an email newsletter: +1
- Clicking a link in an email: +3
- Downloading an e-book or guide: +8
- Registering for a webinar: +5, attending: +10

Here's what to watch out for: **Put a cap on low-intent signals.** Otherwise, someone who reads your blog regularly but has no intention of buying will land in front of your sales team purely through their reading habits.

To make better use of mid-level signals like webinar attendance, our [guide to generating qualified leads with B2B webinars](/blog/b2b-webinar-qualified-leads-guide) offers ideas on how to structure post-event scoring.

## Step 4: How do you set up negative scoring and score decay?

This is the step many companies skip, yet it does the most to improve the model's accuracy. If scores only ever go up, the system becomes inflated and meaningless over time.

### Negative scores

- Personal email address (Gmail, Hotmail, etc.): -10
- Visiting the careers or job listings page: -15 (likely a job seeker)
- Unsubscribing from the email list: -20
- Competitor domain: -50 or automatic disqualification
- Existing customer: Should be excluded from lead scoring and routed to a separate expansion model
- Marked as "not a fit" by the sales team: -30

### Score decay

Someone who looked at your pricing page six months ago isn't worth the same as someone who looked at it today. Add a decay rule to your engagement score:

- If there's no engagement for 30 days, **reduce** the engagement score **by 25%**.
- If there's no engagement for 90 days, **reset** the engagement score **to zero**.

The fit score, however, does not decay. The company is still the right company; it just isn't active at the moment. This distinction lets you catch accounts that warm up again later.

## Step 5: How should you set MQL and SQL thresholds?

Scores mean nothing on their own. You need to define what happens once a lead passes a certain score. A typical structure looks like this:

- **0-39 points, Cold lead:** Nurtured through marketing automation; not sent to sales.
- **40-69 points, MQL (Marketing Qualified Lead):** Considered qualified from a marketing standpoint. Researched by the SDR team and contacted with personalized outreach.
- **70+ points, SQL candidate:** The SDR reaches out directly with a call or meeting invitation. After the conversation, the lead is qualified using a framework like BANT or MEDDIC and converted to an SQL.

To set the threshold, go back to your historical data. Apply the model retroactively to your won opportunities and ask: *"What score did the vast majority of our won customers have when they moved to sales?"* Set your threshold slightly below that value.

If you set the threshold too low, your sales team gets buried in unqualified leads. If you set it too high, hot opportunities sit in marketing automation and go cold.

**An important exception:** Actions that signal direct purchase intent, such as a demo request, should be routed to the sales team immediately, regardless of score. Even if the fit score is low, someone should talk to this person. At worst, they'll be properly disqualified.

## Step 6: Use a two-dimensional matrix model

Adding fit and engagement scores into a single number hides important information. An 80-point lead could come from high fit and low interest, or from low fit and intense interest. These two situations call for completely different actions.

That's why mature B2B teams prefer the **matrix model**:

- **Fit:** A (excellent), B (good), C (moderate), D (not a fit)
- **Engagement:** 1 (very active), 2 (active), 3 (slightly active), 4 (passive)

These two axes clarify the next actions:

- **A1, A2, B1:** Immediate sales outreach. Priority list.
- **A3, A4:** Right company, but no interest. Ideal candidates for outbound prospecting. The SDR should reach out proactively.
- **B2, B3, C1, C2:** Add to a nurturing flow and re-evaluate once interest increases.
- **C3, C4, D group:** Low priority. Can stay in an automated content flow; no sales time spent.

The biggest benefit of the matrix model is that **it makes "right but quiet" accounts like A3 and A4 visible.** These accounts never trigger anything on the inbound side, but they're worth their weight in gold for outbound sales.

## Step 7: How do you set up the model in your CRM?

No matter how well the model is designed, if it doesn't run automatically in your CRM, it'll be forgotten within a few weeks. Here's a general roadmap for setup:

1. **Create custom fields:** Set up "Fit Score," "Engagement Score," "Total Score" and "Lead Grade (A1-D4)" fields in your CRM.
2. **Define fit rules:** Most CRMs (such as HubSpot, Salesforce and Pipedrive) offer rule-based scoring. Enter rules that assign points based on employee count, industry and job title fields.
3. **Connect behavioral tracking:** Integrate your website tracking code, email marketing tool and form system with your CRM. Tag critical pages like the pricing page separately.
4. **Automate decay rules:** Use scheduled workflows to reduce the engagement score of records that have gone without engagement for a set period.
5. **Write routing rules:** Automatically assign leads that cross the threshold to the right SDR, create a task and send a notification.
6. **Aggregate at the account level:** If multiple people from the same company are engaging, roll up their individual scores on the account record. Three different people from one company viewing the pricing page in the same week is a very strong buying signal.

Automating scoring, routing and follow-up tasks are interconnected. We covered how to build this structure end to end in detail in our article on [automating your lead generation operation](https://saascorner.co/blog/b2bde-uykusuz-gecelerin-ciktisi-lead-generation-operasyonunu-otomatige-baglamak).

### Don't forget to define an SLA

Without a service level agreement (SLA) between marketing and sales, lead scoring is only half done. A sample SLA:

- First contact with A1/A2 leads within **4 business hours**
- First contact with MQLs within **2 business days**
- The sales team must select a **rejection reason** in the CRM for every lead it rejects

Rejection reasons will be your most valuable data source for calibrating your model.

## Step 8: How do you test and calibrate the model?

Lead scoring isn't a set-it-and-forget-it system. The first version is always flawed, and that's normal. What matters is spotting the errors quickly and fixing them.

### The first 30 days: Shadow mode

Before going live, run the model in "shadow mode" for a month. Let the scores be calculated, but don't route anything. During this period, compare the leads the sales team naturally chooses with the leads the model scores highly. If there are big gaps, review your criteria.

### Every quarter: Performance analysis

Review the following metrics each quarter:

- **Conversion rate by score group:** Is the rate at which A1 leads turn into opportunities noticeably higher than for B2s? If not, the model isn't differentiating.
- **MQL-to-SQL conversion rate:** If it's very low, the threshold is too low or the criteria are wrong.
- **Share of MQLs rejected by sales, and rejection reasons:** If the same reason keeps recurring, turn that criterion into a negative score.
- **Starting score of won opportunities:** If deals that started with low scores are being won, the model is missing a signal.

For a holistic look at the funnel metrics that lead scoring improves, the approaches in our article on [conversion rate optimization](https://saascorner.co/blog/donusum-orani-optimizasyonu) can be used alongside your model.

### When should you move to machine learning?

A rule-based model is sufficient for most B2B SaaS companies for a long time. AI-powered predictive scoring only produces meaningful results once you've accumulated a sufficient volume of closed opportunity data. An algorithm trained on too little data learns the wrong patterns. Get your rule-based model working first, clean up your data, and then move to automation.

## How do you adapt lead scoring for outbound sales?

Classic lead scoring is inbound-focused: someone comes to your site, engages and their score goes up. But at B2B SaaS companies that rely heavily on outbound, most leads haven't engaged with you yet. In this case, the model is adapted as follows:

- **The fit score takes center stage.** When building an outbound list, each account is first given a fit score. Only A and B accounts are added to sequences.
- **Trigger events are added to the score.** Signals such as raising new funding, rapid hiring, appointing a new HR director or opening a new location earn extra points. For example, "new HR leader appointed in the last 90 days: +15."
- **Outbound engagement turns into engagement score.** Actions such as opening a cold email, clicking a link, accepting a LinkedIn connection request and returning a call are scored.
- **Negative replies are differentiated.** A "we're not interested right now" reply and a "don't contact us again" reply shouldn't receive the same negative score. The first can be re-evaluated in 6 months; the second should be permanently removed from the list.

For companies that want to build data-driven outbound processes and account prioritization with a professional team, our sister company [Sales Corner's data-driven B2B sales and lead generation services](https://salescorner.co) put this approach into practice in the field.

## What are the most common mistakes when building lead scoring?

- **Leaving the sales team out of the process:** Models designed by marketing alone don't get adopted by sales. At least one sales manager and one SDR should always attend the criteria-setting meeting.
- **Using too many criteria:** A model with 40 different rules is impossible for anyone to understand and becomes impossible to maintain. 8-12 criteria are enough to start.
- **Scoring every interaction:** Newsletter open rates have become unreliable due to privacy features and automated email scanners. Give opens little or no weight, and focus on clicks and replies.
- **Skipping score decay:** Leads that were active a year ago still look "hot" today, which erodes the sales team's trust.
- **Confusing contact and account scores:** Tracking a single person instead of the entire buying committee causes you to miss big opportunities.
- **Never updating the model:** As your product, pricing and target market change, your criteria should change too.
- **Treating scoring as separate from nurturing:** Low-scoring leads aren't thrown away; they're matured with the right content. In this regard, [an integrated approach to B2B lead nurturing](https://saascorner.co/blog/b2b-satis-lead-nurturing-entegre-yaklasim) is the natural complement to lead scoring.

## Frequently asked questions

### How long does it take to build a lead scoring model?

For a company with well-organized CRM data, the first version can usually be ready within 2-4 weeks. That timeframe includes historical opportunity analysis, defining criteria and CRM setup. Making the model reliable, including shadow mode and the first calibration cycle, takes 2-3 months.

### Does a small SaaS company need lead scoring?

If your sales team can handle every incoming lead without wasting time, you don't need a complex model yet. However, simple fit scoring is useful at any scale, because it clarifies outbound lists and priorities. Once lead volume starts to exceed sales capacity, it's time to add behavioral scoring as well.

### Which is more important, the fit score or the engagement score?

In B2B, the fit score is usually more decisive, because a highly interested person at the wrong company rarely becomes a customer. The engagement score, on the other hand, indicates timing. The healthiest approach is to track the two separately with a matrix model rather than combining them into a single number.

### Do you need dedicated software for lead scoring?

In most cases, no. Popular CRMs like HubSpot, Salesforce and Pipedrive offer rule-based scoring and automation features. Separate software is needed mainly when you want to use predictive scoring or advanced intent data.

## Conclusion

A well-built B2B lead scoring model protects your sales team's time, reduces friction between marketing and sales and helps you reach the right accounts at the right time. The formula is actually straightforward: learn from your historical data, measure fit and engagement separately, don't forget negative scores and decay, set thresholds based on real outcomes and calibrate the model every quarter. Most importantly, think of lead scoring not as a marketing project but as a revenue system that sales and marketing own together.

If you want to build your lead scoring model from scratch, review your current CRM setup or connect your outbound and inbound lead flows into a single prioritization system, the SAAS Corner team would be happy to help. Reach out to us via our [contact page](/en/contact), and let's map out a roadmap tailored to your company together.
