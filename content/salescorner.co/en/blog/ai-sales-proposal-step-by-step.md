---
title: "How to Write Sales Proposals with AI: Step by Step"
description: "A step-by-step guide for B2B sales teams on preparing proposals with AI: the steps, data sources and KVKK-compliant limits of use, with examples."
date: "2026-11-08"
category: "Artificial Intelligence"
image: "https://images.pexels.com/photos/8730012/pexels-photo-8730012.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "How to Write a Sales Proposal with AI: Step by Step"
alt: "yapay-zekayla-satis-teklifi-nasil-hazirlanir"
---

The essence of preparing a sales proposal with AI is this: **you give a language model the customer information from your discovery call, a fixed proposal template and your approved content library as context. The model writes the draft section by section. A human must always review and approve the critical parts, such as pricing, scope and commitments.** AI won't sell the proposal for you. But it turns the hours a sales rep spends staring at a blank page into a consistent, customer-specific first draft.

In this article, we walk through an end-to-end process for B2B sales teams. We cover, step by step, what data to collect, how to set up your template and how to instruct the model. We also show where human review is essential and how to measure whether your proposal is working. The examples reflect the reality of B2B sales in Turkey: long approval chains, procurement departments, TL/foreign-currency pricing and frequent revision requests.

## What exactly does AI do in the proposal process?

First, you need to set the right expectations. AI does three things very well in the proposal process:

- **It pulls scattered information together:** It reads call notes, email threads and CRM records, and distills the customer's problem, goals and objections into a single summary.
- **It personalizes:** It describes the same service one way to the operations manager of a manufacturing company and another way to the CFO of a SaaS company.
- **It ensures consistency:** It eliminates the chaos of every rep copying and editing their own Word file. Every proposal comes out with the same structure, the same tone and the same quality bar.

The things it can't do, or shouldn't do, are just as clear:

- **Setting prices:** Discount rates, payment terms and currency risk are company policy. If the model guesses them, an incorrect and binding figure can end up in the proposal document.
- **Making commitments:** Statements like "We'll double your sales in 3 months" are exactly the kind of phrases models are prone to producing, yet they carry legal and commercial risk.
- **Filling in information it doesn't have:** If the customer's headcount or current software isn't in the context, the model may make it up. And a single sentence like that can destroy the proposal's credibility.

The right setup is this: **AI writes, humans decide.**

## What should you have in place before you start?

AI output is only as good as the context you give it. Before you start generating proposals, you need to prepare four assets.

1. **Proposal template:** A fixed structure with defined section headings, section order and approximate length for each section.
2. **Content library:** Service and product descriptions, methodology explanations, standard contract clauses and approved answers to frequently asked technical questions. These are written once, approved by legal or management, and given to the model with the instruction "use without changes."
3. **Price list and discount policy:** The list price of each package, what discount can be given under which circumstances, and who approves it.
4. **Brand voice guide:** Formal or informal "you" (Turkish "siz" or "sen"), how formal the tone should be, and which words are banned (e.g., "we guarantee," "definitely," "the best on the market").

Without these four, the AI will sound like a different company in every proposal. Dedicating your first week to this preparation will save you hours of corrections in the months that follow.

## Step by step: preparing a sales proposal with AI

### 1. Capture the discovery call data in full

A good proposal is a good discovery call put into writing. If you try to relay what was discussed from memory, the most critical details get lost: the customer's own words, their numbers, their objections.

That's why setting up a process that records, transcribes and summarizes calls is the first link in proposal automation. We covered this in detail in our article on [automating sales call notes with AI](/blog/automate-sales-call-notes-with-ai). For the proposal, the following fields need to come out of the call clearly:

- **Current situation:** What is the customer doing now, and which tools are they using?
- **The problem and its cost:** Write down what isn't working and what it's costing them, using the customer's own numbers wherever possible. Example: "About 40 hours a month go into manual reporting."
- **Goal:** What do they want to be different 6-12 months from now?
- **Decision process:** Who decides, who influences, and is procurement involved?
- **Budget and timing signals:** Whether stated explicitly or implied.
- **Objections and concerns:** For example, "We worked with an agency before, and it didn't work out."

If you keep these fields in a fixed format (e.g., custom fields in your CRM or a structured note template), the following steps become almost automatic.

### 2. Lock in the proposal structure

Telling an AI "write us a proposal" means getting a different document every time. Instead, define the sections in advance. Here's a structure that works for B2B service and software proposals:

1. **Executive summary** (150-200 words): The customer's problem, your proposed solution and the expected outcome in a single paragraph.
2. **Current situation and needs analysis:** Findings from the discovery call, in the customer's own words.
3. **Proposed solution:** What will you do, and how will you do it?
4. **Scope and deliverables:** What's included and, just as importantly, what isn't.
5. **Timeline:** Weekly or monthly phases.
6. **Team and communication model:** Who is responsible, and how often will reporting happen?
7. **Investment:** Price table, payment terms and validity period.
8. **Next steps:** How the approval process will move forward.

You'll give the AI a separate instruction for each section. Section-by-section generation produces far more controlled, higher-quality results than generating a 10-page document in one go.

### 3. Prepare the context package

The context package is the text that brings together all the information the model will refer to while writing the proposal. It includes:

- The discovery call summary (the fields from step 1)
- Verified information about the customer's company: industry, approximate size, positioning on their website
- Relevant service or product descriptions (from the content library)
- Brand voice rules
- A list of banned phrases

There's one important rule here: **don't let the model use any information that isn't in the context package.** State it explicitly in the instruction: "Do not use any figures, customer information or references that aren't in the context. If information is missing, flag it as [MISSING: ...]." These flags let the person reviewing the draft see instantly what they need to fill in.

### 4. Generate the draft section by section

Now generate a draft for each section with its own instruction. Here's a sample instruction for the executive summary:

> Using the context below, write the executive summary section of a B2B sales proposal. The length should be 150-180 words. Address the reader formally, and keep the tone professional but plain. The first sentence should describe the customer's problem in their own words. The second part should summarize our proposed solution in one sentence. The final part should state the measurable goal using the figures in the context. Do not use any language that implies guarantees, certainty or exaggeration. Do not add information that isn't in the context; if anything is missing, flag it with [MISSING: ...].

Following the same logic, prepare separate instructions for the "Current situation," "Proposed solution" and "Scope" sections. Write these instructions once and keep them in a library your whole team uses. Don't let every rep invent their own.

**Practical tip:** Always have the AI generate the "Out of scope" section, then review it. Models are good at systematically filling in this section, which people tend to skip. And this is exactly where a large share of revision requests and post-project disputes are prevented.

### 5. Make pricing rule-based; don't leave it to the model

The pricing section is the most sensitive part of the proposal and the place that should be least open to the AI's "creativity." The right setup looks like this:

- The price table comes in as **fixed data** from your CRM, a spreadsheet or a price configurator.
- The model only places this table into the proposal format and writes the explanatory text. For example: "This package is sized to the target of 500 leads per month that you mentioned in our call."
- If there's a discount, the rate and the rationale are entered by a human.

Here's a concrete example: if a service has a list price of 60,000 TL per month and your policy is a 10% discount for 12 months paid upfront, that rule is defined in the system. The model can't decide, "Let's give 15%, the customer seems warm." Foreign-currency pricing and exchange-rate clauses, which are common in Turkey, should also be taken verbatim from the approved text in the content library.

### 6. Tie human review to a checklist

An "I'll take a look" approach means nobody takes a look during a busy week. Tie the review to a concrete list:

- [ ] Are the customer's company name, contact names and titles correct?
- [ ] Do all the figures come from the context, or are there made-up numbers?
- [ ] Have all the [MISSING] flags been filled in?
- [ ] Are the price, discount and payment terms identical to the approved table?
- [ ] Are there any phrases implying guarantees or certainty, or carrying legal risk?
- [ ] Are the out-of-scope items clear?
- [ ] Has any information belonging to another customer (leftovers from a previous proposal) remained in the text?

The last item is especially important. When you give the model previous proposals as examples, there's a real risk of another customer's name or figures leaking into the new proposal. It's also good practice to require a second approval (from the sales manager or finance) for proposals above a certain discount threshold or a certain amount.

### 7. Send, follow up and catch the signals

The AI's job doesn't end once the proposal is sent. It contributes in two ways at this stage, too:

- **Follow-up messages:** Personalized follow-up emails that reference the content of the proposal. Example: "If your IT team has any questions about the CRM integration we mentioned in the scope section, we can set up a technical call." This is far more effective than a generic "Have you had a chance to review our proposal?" message.
- **Preparing for objections:** Draft answers to likely questions from procurement or finance, based on the proposal and discovery notes.

If you use tools that show which sections of the proposal document were opened and how long they were read, you can tie this signal to your follow-up timing as well. A decision-maker who goes back to the pricing page three times is most likely in the middle of a budget discussion. A well-timed call is worth far more than waiting for weeks.

## A concrete example: how does the process work from start to finish?

Let's walk through a hypothetical scenario. A B2B services company is going to propose a sales automation setup to a logistics company with about 120 employees.

**What came out of the discovery call:**
- The sales team has 8 people, and they track leads in Excel.
- The sales manager spends about 6 hours a week preparing reports.
- Goal: See the entire pipeline in a single system within 6 months and automate the weekly report.
- Concern: "The team will resist learning a new tool."
- Decision: The general manager approves; finance reviews the payment terms.

**An excerpt from the AI-generated executive summary:**

> Your 8-person sales team currently tracks opportunities in Excel, and your sales manager spends about 6 hours every week preparing reports. The setup we're proposing brings your existing processes together in a single pipeline view and automates the weekly report. With your team's concerns about adoption in mind, we recommend starting with a simple structure that mirrors only your current habits for the first 4 weeks.

Notice: The text uses the customer's own numbers (8 people, 6 hours). It addresses the objection (the adoption concern) directly. It contains no exaggerated promises. The model also left a flag in the "Payment terms" section: [MISSING: finance department's preferred payment term]. The rep asked the customer in a single email and filled it in.

**In terms of time:** Writing a proposal of this size from scratch is typically a half-day job for a rep. Once the template, content library and instructions are in place, the first draft comes out within minutes. Review and editing are usually done in under an hour, too. The exact time depends on the complexity of the proposal, but the gain usually comes from shifting the work from "writing a proposal" to "editing a proposal."

## What tools can you use?

You can think of proposal automation in three levels:

1. **General-purpose chat assistant + template:** The fastest way to get started. You paste in the instructions and context manually. It's enough for small teams sending a handful of proposals a month, but consistency depends on each rep's discipline.
2. **AI features in proposal software:** Some proposal and document platforms offer AI-assisted draft generation alongside a content library, e-signatures and read tracking. A sensible middle ground for mid-sized teams.
3. **Integrated automation workflow:** When an opportunity reaches a certain stage in the CRM, the call summary and pricing data are pulled in automatically. A draft is generated section by section, routed for approval and sent to the customer once approved. This setup requires the most implementation effort, but delivers the biggest gains at scale.

When deciding which level is right for you, you need to weigh criteria such as integration, data security, cost and ease of use for your team together. We covered this evaluation in detail in our article on [the criteria to consider when choosing an AI tool for sales](/blog/how-to-choose-ai-sales-tool). If you want to build proposal automation as part of a broader sales and operations strategy, [the strategy and automation work of Corner Group](https://cornergroup.co), our group's parent company, can also be a good starting point.

## Is it safe to give customer data to AI?

When preparing a proposal, you give the model the customer company's name, the names and titles of decision-makers, internal process information and sometimes even financial figures. That means a data flow containing personal data and trade secrets. The main points to watch:

- **The data policy of the tool you use:** Check whether the data you enter is used to train the model, where the data is stored and how long it's retained. Enterprise plans generally offer clearer commitments on this.
- **Data minimization:** Don't put personal data into the context that isn't actually needed for the proposal. In most cases, the person's title ("Sales Manager") is enough instead of their name.
- **Cross-border transfer:** If the servers of the model you use are outside Turkey, this is a separate issue that needs to be assessed under KVKK (Turkey's Personal Data Protection Law).

We examined these topics in more detail in our article on [KVKK risks when using AI in sales](/blog/kvkk-risks-ai-in-sales). We recommend a brief review with your legal advisor before setting up proposal automation.

## How do you measure whether your proposal is working?

Adding AI to the proposal process isn't a success in itself. The real question is its impact on win rate and sales velocity. The metrics you should track:

- **Proposal turnaround time:** The time from the end of the discovery call to the proposal being sent. A fast proposal lands on the table while the customer's interest is still warm.
- **Proposal win rate:** The share of opportunities closed per proposal sent. Compare it between the periods before and after AI.
- **Number of revisions:** How many rounds of changes were requested per proposal? This number should drop as the scope section becomes clearer.
- **Time spent in the proposal stage:** How long an opportunity stays in the same stage after the proposal is sent.

For these metrics to be meaningful, the "Proposal sent" stage must be defined in your CRM with clear entry and exit criteria. We explained how to do this, with examples, in our [guide to defining sales pipeline stages](/blog/how-to-define-sales-pipeline-stages). Systematically collecting the reasons behind lost proposals is also the most powerful way to improve proposal content. Was it price, scope, timing or a competitor? For more on this, take a look at our article explaining [how to do lost opportunity analysis step by step](/blog/lost-deal-analysis-guide). Having AI summarize loss reasons and using them to update your content library turns the process into a self-improving loop.

## What are the most common mistakes?

- **Generating the entire proposal in one go:** In long documents, the model loses consistency and sections repeat each other. Generate section by section.
- **Blindly using old proposals as examples:** This creates a risk of other customers' information leaking. Anonymize your examples.
- **Skipping tone calibration:** By default, the model drifts into language that's either overly formal or overly salesy. A brand voice guide and 1-2 approved sample paragraphs largely solve this problem.
- **Leaving review optional:** In a process without a checklist, trust is lost the moment the first incorrect figure reaches the customer.
- **Leaving the discovery stage weak:** AI can't make up for a poor discovery. The answers to questions that weren't asked in the call won't be in the proposal either.
- **Not measuring:** You'll feel the time savings, but if you don't measure the impact on win rate, you can't know whether the process is actually working.

## Frequently asked questions

### Won't an AI-generated proposal feel "written by a robot" to the customer?

Not if it's set up correctly. What makes a proposal personal is that it reflects the customer's own words, numbers and concerns. As long as this information comes from the discovery call, the text will be far more tailored than generic templates. Having the rep rework a few sentences in their own style during the final read also makes it feel more natural.

### Can I leave pricing to AI?

No, you shouldn't. Prices, discounts and payment terms are binding information tied to company policy, and they should come from a fixed price table or set of rules. AI should only place this data into the proposal format and write the text explaining the rationale behind the price.

### Is this process necessary for a small sales team?

If you send only a few proposals a month, an integrated automation workflow may be unnecessary. But using a general-purpose AI assistant with a fixed template, an approved content library and ready-made instructions saves significant time even for small teams. As your proposal volume grows, moving to CRM integration makes more sense.

### Does AI increase proposal win rates?

It wouldn't be accurate to guarantee a direct increase. The impact is usually indirect: proposals go out faster, scopes are clearer and the customer's problem is addressed more directly. To see the real impact, you need to compare win rate, number of revisions and time spent in the proposal stage between the periods before and after AI.

## Conclusion

When set up correctly, preparing sales proposals with AI turns one of the biggest time sinks for sales teams into a fast, consistent and customer-specific process. The formula is simple: a strong discovery call, a fixed proposal structure, an approved content library, section-by-section draft generation, rule-based pricing and mandatory human review. Add regular measurement and loss analysis on top, and every proposal gets better than the last.

If you want to turn your proposal process into end-to-end automation connected to your CRM, we can assess your current setup together. [Schedule a call](/en/iletisim) with the Sales Corner team, and let's work out the right proposal automation setup for you together.
