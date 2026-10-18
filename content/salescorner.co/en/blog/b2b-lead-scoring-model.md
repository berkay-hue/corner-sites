---
title: "How to Do B2B Lead Scoring: A Step-by-Step Model"
description: "How to build a B2B lead scoring model? A practical guide for sales teams in Türkiye, with scoring criteria, a sample table and CRM implementation steps."
date: "2026-10-14"
updated: "2026-10-16"
category: "Lead Generation"
image: "https://images.pexels.com/photos/7876672/pexels-photo-7876672.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "How to Do B2B Lead Scoring: A Step-by-Step Model"
alt: "b2b-lead-scoring-nasil-yapilir"
---
B2B lead scoring works by giving every lead two separate scores: a fit score that shows how well it matches your company (industry, company size, job title) and an engagement score that shows how close it is to buying (email replies, site visits, demo requests). Thresholds group the scores, your CRM automates them, and real results keep them calibrated.

Most B2B sales teams face the same problem: there are hundreds of leads in the pipeline, but sales reps only have so many hours in a day. Who gets a call back first? Which lead should be re-engaged a week from now? Which one should be dropped from the list entirely? When these decisions are made on gut instinct, the best opportunities go cold and the team spends its energy on people with no intention of buying. **Lead scoring** turns this chaos into systematic prioritization. It gives every lead a score that shows how well it fits your company and how close it is to buying.

In this article, we walk you step by step through building a B2B lead scoring model from scratch. Using concrete examples, we cover which criteria to use, how to assign points, how to set thresholds and how to calibrate the model over time. At the end, you'll also find an end-to-end example model that you can adapt to your own team.

## What Is Lead Scoring and Why Is It Different in B2B?

Lead scoring is a method that helps sales teams prioritize by assigning prospects a numerical score based on specific criteria. The higher the score, the more a lead is assumed to both match your ideal customer profile and be moving forward in the buying process.

In B2C, this process is relatively simple. A single person makes the decision and the buying cycle is short. B2B is a different story:

- **There are multiple decision-makers.** In a software purchase, the end user, the department head, IT and procurement are all involved at the same time.
- **The sales cycle is long.** Weeks or even months can pass between first contact and signature.
- **Company fit matters as much as individual fit.** If a highly interested person works at a company that isn't a good fit for you, that lead has little value.
- **Signals are scattered.** Website visits, email replies, LinkedIn engagement and demo requests come in through different channels.

That's why a good B2B lead scoring model measures two dimensions separately:

1. **Fit score:** How closely do this company and this person resemble our ideal customer?
2. **Engagement (interest/intent) score:** How much is this lead engaging with us, and is it sending buying signals?

As you'll see later in this article, keeping these two dimensions separate rather than collapsing them into a single number leads to far more accurate decisions.

## Before You Start: Three Essential Preparations

Before moving on to scoring criteria, you need to clarify three things. Skip them, and even the most sophisticated model will produce the wrong results.

### A shared language between sales and marketing

To the marketing team, a "qualified lead" might be someone who downloaded an e-book; to the sales team, it might be a decision-maker with a defined budget and timeline. Before building the model, the two teams should sit down together and agree in writing on the definitions of **MQL (Marketing Qualified Lead)** and **SQL (Sales Qualified Lead)**.

### Clearly defined pipeline stages

Lead scoring is the entry point to your pipeline. You need to define in advance which stage a lead moves to once it reaches a certain score, who takes ownership of it and how that handoff is recorded. If you don't have a clear structure for this yet, we recommend checking out [our guide to defining sales pipeline stages, with examples](/blog/how-to-define-sales-pipeline-stages).

### Clean, measurable data

If a significant share of your CRM records is missing industry, employee count or job title, your fit score becomes meaningless. Likewise, if email opens, clicks and website visits aren't being tracked, you can't calculate an engagement score. Before building the model, list which data you have and which is missing.

## Step 1: Put Your Ideal Customer Profile (ICP) in Writing

The foundation of lead scoring is knowing who your ideal customer is. An ICP is defined on two levels.

**Company-level (firmographic) criteria:**

- Industry (e.g., SaaS, manufacturing, logistics, professional services)
- Employee count range (e.g., 50–500)
- Geography (e.g., Türkiye and the DACH region)
- Estimated revenue or growth stage
- Technologies used (e.g., a specific CRM or email platform)

**Person-level (demographic) criteria:**

- Job title and seniority (e.g., Sales Director, VP Sales, Founder)
- Department (sales, marketing, operations)
- Decision-making authority (decision-maker, influencer, end user)

A common mistake here is defining the ICP based on "the customer we wish we had." The right approach is to start from **the customers who have actually delivered the best results for you**. Which brings us to the second step.

## Step 2: Analyze Won and Lost Opportunities

Put the deals you closed and the opportunities you lost over the last 12–24 months into a spreadsheet. For each one, look for answers to these questions:

- What industries and company sizes do your won customers have in common?
- Who made first contact, and what was the job title of the person who moved the deal forward?
- What behaviors did you observe before the purchase? For example, pricing page visits, case study downloads or webinar attendance.
- Is there a recurring pattern in lost opportunities? For instance, are very small companies dropping out because of budget?

You don't need a large dataset for this analysis. Even 30–50 won deals are enough to reveal strong patterns. The goal is to see which attributes genuinely increase the likelihood of a purchase. By the end of the analysis, you should have a list of criteria grouped as "high impact," "medium impact" and "low impact."

## Step 3: Define Your Fit Score Criteria and Weights

Now it's time to turn the criteria you've analyzed into points. A practical approach is to calculate the fit score **out of 100**. Below is a sample distribution for a B2B software company. The numbers are for illustration only and should be adapted to your own data.

**Industry (up to 25 points)**

- Target industry (SaaS, e-commerce infrastructure): 25
- Adjacent industry (digital agency, consulting): 15
- Non-target industry: 0

**Company size (up to 25 points)**

- 50–500 employees: 25
- 20–49 or 501–1,000 employees: 15
- Fewer than 20 employees: 5
- More than 1,000 employees: 10 (because the sales cycle is very long)

**Job title and seniority (up to 30 points)**

- C-level or founder: 30
- VP / Director: 25
- Manager: 15
- Specialist / Non-manager: 5

**Geography (up to 10 points)**

- Primary market: 10
- Secondary market: 5
- Unserved region: 0

**Technology fit (up to 10 points)**

- Uses a platform you integrate with: 10
- Unknown: 3
- Recently purchased a competitor's solution: 0

When setting weights, follow this rule: **the criterion that proves most decisive in won deals gets the highest weight.** If you see that conversations with founders or C-level executives close noticeably more often, it makes sense to give job title more weight than industry.

## Step 4: Define Your Engagement Score Criteria

The fit score answers the question "Is this the right person?" The engagement score answers "Are they interested right now?" Designing this one out of 100 as well makes it easy to compare the two scores.

You can split behaviors into three groups based on the strength of intent.

**High-intent signals:**

- Demo or meeting request: 40
- Positive reply to a cold email: 30
- Pricing page visit: 20
- Multiple product page visits in the last 7 days: 15

**Medium-intent signals:**

- Downloading a case study or comparison content: 10
- Attending a webinar (not just registering): 10
- Clicking a link in an email: 5
- Commenting on or messaging about a company post on LinkedIn: 5

**Low-intent signals:**

- Reading a blog post: 2
- Subscribing to the newsletter: 3
- Opening an email: 1 (should be kept low because open data is unreliable due to privacy features)

It's important to cap the engagement score. Otherwise, a student who reads your blog every day could end up with a higher score than a sales director who requested a demo. As a practical solution, set a ceiling for each category. For example, the maximum number of points that can be earned from low-intent signals could be 10.

LinkedIn engagement is becoming an increasingly important signal in B2B. If your company page and your executives' profiles aren't producing content regularly, the signals coming from this channel will be weak as well. For teams looking to strengthen this side, [Social Media Corner, which offers B2B-focused LinkedIn management](https://socialmediacorner.co), can be a good starting point.

## Step 5: Add Negative Scoring and Score Decay

Many lead scoring models only add points, so they inflate over time. A healthy model also knows how to take points away.

### Negative scoring

- Employee of a competitor: −50 (or outright disqualification)
- Student or personal email address (gmail, hotmail): −20
- "Not interested" reply: −40
- Unsubscribing from emails: −30
- Visiting the careers page (job-seeker signal): −10

### Score decay

A lead who visited your pricing page three months ago and hasn't engaged since isn't worth the same as someone who visits that page today. That's why you should add a decay rule to engagement scores. For example:

- After 30 days without engagement, reduce the engagement score by 25%.
- After 60 days without engagement, reduce it by 50%.
- After 90 days, reset the engagement score to zero.

The fit score, on the other hand, generally doesn't decay. As long as the company's industry or the person's job title doesn't change, the fit stays the same. However, when a person changes companies, their fit score needs to be recalculated.

## Step 6: Define Thresholds and an Action Matrix

Scores mean nothing on their own. What matters is which action each score range triggers. When you keep fit and engagement scores separate, you get a simple but powerful **2x2 matrix**:

- **High fit + high engagement (A):** Handed off to a sales rep immediately, with personal outreach within 24 hours. These leads are SQL candidates.
- **High fit + low engagement (B):** The right company, but no interest yet. Added to a personalized outbound sequence.
- **Low fit + high engagement (C):** Interested, but not an ideal customer. Nurtured through marketing automation, with a short qualification call if needed.
- **Low fit + low engagement (D):** Kept on the general newsletter list; no sales time is spent on them.

Sample thresholds:

- Fit score of 70 or higher: high fit
- Engagement score of 50 or higher: high engagement

Group B leads are the biggest opportunity for outbound teams. They're the right companies, but they don't know you yet. The quality of the messages you send to this group directly determines conversion. In [our article on writing cold emails with AI](/blog/how-to-write-cold-emails-with-ai), we covered in detail how to craft scalable yet personal messages for these leads. To generate these sequences automatically from your product video, PDF or website, you can use our [Sequence Writer tool](/en/#otomasyonlar) (Turkish interface).

## Step 7: Feed the Model with Data Enrichment

The accuracy of your fit score depends on how complete your data is. When someone fills out a form, you usually only get their name, email and company name. Industry, employee count, job title and technology information are left out. If these missing fields score zero, a good lead gets unfairly underrated.

Data enrichment tools are used to solve this problem. As soon as a lead enters the CRM, company information is pulled automatically from the email domain, and job title and seniority are pulled from the person's name and company. For example, B2B data platforms such as [Apollo.io](https://get.apollo.io/679irkzm35ya) are widely used both to build new lead lists and to enrich existing records with firmographic data. If you want to scan target companies' websites for specific product or technology signals in bulk, our [Web Keyword Scanner tool](/en/#otomasyonlar) can also feed your fit score.

Keep two things in mind when enriching data:

- **Assign an intermediate score for missing data.** If employee count is unknown, assigning a low-to-medium score (e.g., 8 out of 25) instead of zero prevents the model from penalizing missing data.
- **Stay within the legal framework.** When you contact people using enriched personal data, KVKK (Türkiye's Personal Data Protection Law) and related regulations come into play. [Our article on the legal limits of KVKK-compliant B2B cold email](/blog/kvkk-compliant-b2b-cold-email) gives you a clear framework on this topic.

## Step 8: Roll Out Scoring with Automation

Scoring leads manually is feasible for the first few weeks, but it isn't sustainable. The model's real value emerges when scores are calculated automatically and actions are triggered automatically.

A typical automation workflow looks like this:

1. A new lead lands in the CRM (via a form, an outbound list or an integration).
2. The enrichment tool fills in missing firmographic fields.
3. The fit score is calculated according to the rules and written to a CRM field.
4. The engagement score is updated as website, email and LinkedIn interactions come in.
5. When a lead moves into Group A, the assigned sales rep receives a Slack or email notification and a task is created in the CRM.
6. Group B leads are automatically added to the appropriate outbound sequence.
7. A weekly job applies the decay rules and updates engagement scores.

You don't need expensive enterprise software to build this workflow. With flexible automation tools like n8n, you can connect your CRM, enrichment service, email platform and communication channels. If you're not sure where to start, [our introductory guide to B2B sales automation with n8n](/blog/b2b-sales-automation-with-n8n-guide) walks you through the basic setup step by step.

## Step 9: Test, Measure and Calibrate

Your first model will never be perfect. What matters is regularly comparing the model against real results.

**First 30 days:** Run the model in "shadow mode." Let the scores be calculated, but have the sales team keep working the way they're used to. At the end of the month, compare the leads the sales team chose to prioritize with the ones the model placed in Group A.

**Metrics to track monthly:**

- The meeting conversion rate of each score group (A, B, C, D)
- Each group's conversion rate to opportunities and to won deals
- Average time to first contact for Group A leads
- The share of MQLs the sales team sends back as "this lead wasn't qualified"

**Quarterly calibration:**

- If there's no clear difference in conversion between Group A and Group D, your criteria aren't discriminating enough. Revisit the weights.
- If a significant share of won deals comes from Group B or C, your thresholds are too high.
- If the sales team keeps saying a particular criterion is misleading (e.g., webinar attendees never buy), lower that criterion's score.

Getting systematic feedback from the sales team is the most critical part of this stage. Even adding a simple "Was the score accurate?" field to the CRM produces valuable data for calibration.

## End-to-End Example: Scoring a Lead

To make the model concrete, let's walk through a fictional scenario. Assume we're using the model of a company that sells software to B2B sales teams in Türkiye.

**Lead:** A Sales Director at a SaaS company with 180 employees. The company is headquartered in Istanbul and uses a CRM you integrate with.

**Fit score calculation:**

- Industry (SaaS, target industry): 25
- Company size (180 employees): 25
- Job title (Director): 25
- Geography (primary market): 10
- Technology (integrated CRM): 10
- **Total fit score: 95**

**Engagement history (last 14 days):**

- Clicked the link in the second email of the outbound sequence: 5
- Visited two product pages and the pricing page on the same day: 15 + 20
- Downloaded a case study: 10
- **Total engagement score: 50**

**Result:** Fit 95, engagement 50. The lead moves into Group A. The sales rep receives an automatic notification. Using the pricing page the lead viewed and the case study they downloaded as context, the rep sends a personal email and a LinkedIn message the same day.

Now, for comparison, consider a second lead: a specialist at a digital agency with 8 employees. Over the past week, they've read five blog posts, attended a webinar and downloaded an e-book.

- Fit score: 15 (adjacent industry) + 5 (small company) + 5 (specialist) + 10 (geography) + 3 (technology unknown) = **38**
- Engagement score: 10 (blog cap) + 10 (webinar) + 10 (content download) = **30**

This lead falls into Group D. Although they appear highly interested, they don't have the fit to justify the sales team's time. Without the model, this person could have jumped ahead of the first lead simply because they looked "active."

## What Does AI Add to Lead Scoring?

Rule-based models are a good starting point because they are easy to understand and manage. As data volume grows, AI can strengthen the model in several ways:

- **Pattern discovery:** Machine learning models can identify combinations of criteria in won deals that the human eye might miss. For example, they might reveal that in a certain industry, only companies within a specific size range convert.
- **Interpreting text signals:** By analyzing the content of email replies, AI can distinguish responses like "not now, but let's talk in three months" from "not interested" and adjust the score accordingly.
- **Combining intent data:** It can scan external signals such as job postings, funding news and executive changes, and raise the scores of the relevant companies. A company that has just hired a new sales director tends to be open to new tools.
- **Personalized next-step recommendations:** Alongside the score, it can suggest which message or content should be sent based on the lead's behavior.

However, AI doesn't work magic without clean data and clear definitions. The healthiest path is to build a rule-based model first, calibrate it over a few quarters, and then add the AI layer. That way, you have a reference point against which to evaluate the AI's recommendations.

## Common Mistakes

The reasons lead scoring projects fail are usually similar:

- **Using too many criteria.** A model with twenty different criteria turns into a black box no one understands. To start, 4–6 criteria for fit and 6–10 for engagement are enough.
- **Not involving the sales team.** Models built by the marketing team alone fail to win the trust of sales and are soon ignored.
- **Combining fit and engagement into a single number.** A single total score can show "right company but uninterested" and "wrong company but very interested" leads at the same score.
- **Skipping negative scoring and decay.** Without these two mechanisms, scores inflate meaninglessly over time.
- **Building the model once and forgetting about it.** As your market, product and ICP change, the model needs to be updated too.
- **Not linking the score to action.** A score that doesn't trigger any automation or change the sales process is just a number sitting in the CRM.

Especially for SaaS companies, lead scoring delivers the highest return when considered together with outbound strategy. For teams that want both to sharpen their ICP and to systematically reach accounts with high fit scores, [SAAS Corner, which provides outbound sales and lead generation services specifically for B2B SaaS](https://saascorner.co), offers an approach that tackles both sides together.

You can see what Sales Corner does in sales automation and outbound on our [services page](/hizmetler) (in Turkish).

## Conclusion

A good B2B lead scoring model doesn't have to be complicated. What matters is defining your ideal customer with real data, measuring fit and engagement separately, keeping the model balanced with negative scoring and decay rules, and tying each score group to a clear action. By following the nine steps described in this article, you can build a working first version within a few weeks and then continuously improve the model using monthly metrics and feedback from your sales team.

Ultimately, lead scoring is one of the most effective ways to direct your sales team's most valuable resource, time, toward the right leads. If you need support setting up data enrichment, automated score calculation and score-driven outbound workflows, the Sales Corner team would be happy to help. [Schedule a call with us](/en/iletisim) to review your current process together.

## FAQ

### What is B2B lead scoring?
Lead scoring is a method of assigning numerical scores to prospects based on defined criteria so the sales team can prioritize. A good B2B model measures two dimensions separately: a fit score for how closely the lead matches your ideal customer profile and an engagement score for how much they interact with you.

### Why should fit and engagement scores be kept separate?
They should be kept separate because a single combined score can show a "right company, no interest" lead and a "wrong company, very interested" lead with the same number. With two scores you get a 2x2 action matrix: high-fit, high-engagement leads go to a sales rep within 24 hours, while high-fit, low-engagement leads enter a personalized outbound sequence.

### How much data do you need to build a lead scoring model?
You don't need a large dataset; even 30–50 won deals are enough to reveal strong patterns. Analyze the won and lost opportunities from the last 12–24 months to find which criteria actually increase the likelihood of purchase.

### How does score decay work?
Engagement points are reduced based on how long a lead has gone without interacting: for example, 25% after 30 days of inactivity, 50% after 60 days, and the engagement score resets after 90 days. The fit score usually doesn't decay; it is only recalculated when the person changes companies.
