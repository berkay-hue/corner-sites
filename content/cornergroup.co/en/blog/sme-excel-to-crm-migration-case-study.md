---
title: "Moving from Excel to CRM at an SME: A Case Study"
description: "How an SME that tracked sales in Excel moved to a CRM, step by step: data migration, team resistance and concrete results from the first 90 days."
date: "2026-10-31"
category: "Case Study"
image: "https://images.pexels.com/photos/7652176/pexels-photo-7652176.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Moving from Excel to CRM at an SME: A Case Study"
alt: "kobi-excelden-crm-gecis-vaka-calismasi"
---

When it is properly planned, moving from Excel to a CRM gives an SME's sales team a single view of customers, quotes and follow-ups within a few weeks. A successful migration starts with defining the sales process. Next comes cleaning the data, then configuring the CRM around that process, and finally bringing the team on board gradually. Choosing the software is the easiest part. The real work is migrating the data and the habits.

In this post, we walk step by step through how an SME with around 40 employees that sells industrial automation solutions moved its sales operation from Excel to Pipedrive. At the client's request, we are not naming the company. The figures in this post are internal data from this specific project and should not be read as industry statistics. Our aim is to give sales managers planning a similar migration a concrete framework for assessing their own situation.

## The starting point: a sales team run on Excel

The company's sales team had six people: a sales manager, four field sales representatives and one inside sales/quotation specialist. The team had worked in Excel for years, and up to a point, that setup had done the job. The problems surfaced as the company grew and its product range expanded.

When we started the project, the picture looked like this:

- **14 separate Excel files** were in active use: a "master customer list," a quote tracking file, each rep's personal tracking file, lead lists left over from trade shows and invoice summaries from accounting.
- There were roughly **4,800 contact/company records** in total, but nobody knew how many of them were up to date.
- The quote tracking file sat in a shared folder, and whenever two people opened it at the same time, version conflicts occurred.
- Every Monday, the sales manager prepared the weekly pipeline report by manually merging the files sent in by the reps. In his own words, this took up "the whole of Monday morning."
- When a rep left the company, most of the history of conversations with their customers was lost. This was the event that actually triggered the project.

Management's request was clear: "We want to see, in one place, which stage every quote is at and who last spoke to which customer, and when."

## How do you know you've hit Excel's limits?

Excel is not a bad tool. With a small team and a limited number of customers, it can work perfectly well. The problem is that Excel is a spreadsheet, not a process tool. These are the warning signs we saw in this case and in similar projects:

1. **The same customer appears in multiple files with different information.** One file has the current phone number, another has the current email address, and it's unclear which is correct.
2. **Follow-up reminders depend on personal memory or someone's calendar.** The knowledge that "I was going to call this customer in two weeks" isn't recorded in any system.
3. **Reporting is manual and delayed.** Management can only see the pipeline once a week, and only after someone spends several hours on it.
4. **Knowledge is lost when a rep changes.** The customer relationship belongs to the individual rather than the company.
5. **The conversion from quote to order can't be measured.** You know how many quotes were sent, but not how many were lost or why.

If three or more of these five points apply to you, Excel can no longer support your growth. Understanding why opportunities are lost is especially critical. We covered this topic in detail in our [case study on finding the reasons behind lost B2B sales](/blog/lost-b2b-sales-reasons-case-study).

## Which CRM was chosen, and why?

Together with the company, we evaluated three options: HubSpot, Pipedrive and Zoho CRM. We didn't make the choice by asking "which CRM is best?" but by looking at what this particular team needed.

### Evaluation criteria

- **Ease of use:** Most of the field reps spent their time on customer visits rather than at a desk. A simple mobile app was essential.
- **Pipeline focus:** The company's sales process consisted of clear stages: discovery visit, technical needs analysis, quote, revision, order. A visual pipeline view was what the team needed most.
- **Budget and licensing model:** A reasonable, predictable cost for six users.
- **Integration flexibility:** The ability to connect to the accounting software and the email infrastructure.
- **Marketing needs:** The company did not yet need active marketing automation. That reduced the advantage of solutions offering extensive marketing modules at this stage.

### The decision

At the end of the evaluation, **Pipedrive** was selected. The deciding factors were the simplicity of the pipeline view and how easy it was to use on mobile. Just as important, the team understood the system in the first demo with almost no training. HubSpot's marketing and service modules were strong, but went beyond what the company needed at the time. Zoho was flexible in terms of customization, but came with a heavier setup and administration burden.

One important note: the CRM you choose today doesn't have to stay with you forever. If the company later shifts its focus to marketing automation, it can switch platforms. You can see how such a scenario is managed in [our case study on migrating from Pipedrive to HubSpot and the data migration steps involved](/blog/pipedrive-to-hubspot-migration). What matters is keeping the data clean and structured from day one. That way, any second migration will also be painless.

## The migration step by step: an 8-week plan

We split the project into an eight-week timeline. Each phase had an owner and a clear deliverable.

### Weeks 1–2: Mapping the sales process

Before entering a single record into the CRM, we ran two workshops with the sales manager and the reps. The goal was to document how the company actually sells.

The outputs of this work were:

- **Pipeline stages:** First Contact → Discovery Visit → Technical Analysis → Quote Sent → Revision/Negotiation → Won / Lost.
- **Entry criteria for each stage:** For example, an opportunity can only move to the "Quote Sent" stage once the quote document has been attached in the CRM.
- **A list of loss reasons:** Price, technical mismatch, competitor chosen, project postponed, decision-maker changed.
- **Mandatory fields:** Industry, company size, product group of interest, estimated project budget, expected decision date.

The most common mistake at this stage is moving the Excel columns into the CRM as they are. The Excel files had more than 40 columns, and half of them existed only because someone had added them over the years "in case we need it." In the new structure, we settled for 12 fields for company records and 9 for opportunity records.

### Weeks 3–4: Data cleansing and consolidation

This was the most labor-intensive part of the project. We describe it in detail in the next section.

### Week 5: CRM setup and pilot

- Pipeline stages, custom fields and user permissions were defined.
- Email integration was set up. Reps' correspondence with customers started being linked automatically to the relevant record.
- Two reps used the system as **pilot users** for one week. The others continued working in Excel in parallel.

The feedback that emerged during the pilot week was as follows: entering visit notes in the mobile app took too long (a template note field was added), and the "Technical Analysis" stage was unnecessary for some small projects (reps were allowed to skip this stage).

### Week 6: Moving the whole team over and shutting down Excel

A critical decision was made this week: **the Excel files were made read-only.** New data could be entered only in the CRM. This step may seem harsh, but we have seen time and again that in any project where two systems run in parallel, the team drifts back to old habits.

### Weeks 7–8: Automations, reports and fine-tuning

- A weekly pipeline report and a per-rep activity dashboard were set up.
- Basic automations were put in place (details below).
- We held a 30-minute one-on-one "where are you getting stuck?" session with each rep.

## Data cleansing: how the mess in Excel was sorted out

Importing the roughly 4,800 records from 14 files directly into the CRM would have done nothing more than move the problem from Excel to the CRM. We ran the cleansing process in four steps.

1. **Creating a single master table.** All the files were converted to a common column structure and merged into one table. A "source" tag showing which file each record came from was added to every record.
2. **Removing duplicate records.** Spelling variations in company names (e.g., "A.Ş.", "AŞ", "Anonim Şirketi", uppercase/lowercase differences, Turkish character issues) were standardized. Records were then matched on tax ID, email domain and phone number. By the end of this step, the number of records had dropped to about **3,100**.
3. **Checking for recency.** Records with no logged interactions and no invoice history in the past two years were moved to a separate "archive" list. They were not deleted, but they weren't included in the active pipeline either.
4. **Assigning ownership.** Every active company was assigned an owning rep. The customers of the rep who had left the company were distributed among the current team at the sales manager's discretion.

In the end, about **1,900 active company records** and **85 open opportunities** linked to them were imported into the CRM. For each open opportunity, we sat down with the reps one by one and asked, "Is this opportunity really still open?" It turned out that some of the opportunities shown as "in progress" in Excel had actually been silent for months.

Data quality is not a one-off job. It requires regular checks after the setup as well. We described ongoing rules and audit routines for this in our [case study on CRM data quality at a multi-brand holding company](https://cornergroup.co/blog/cok-markali-holdingde-crm-veri-kalitesi-basarili-bir-vaka-calismasi). Although the scale is different, the principles apply to SMEs too.

## Why don't sales teams adopt CRM, and how can you fix it?

CRM projects rarely fail for technical reasons. Most of the time, they fail because the team doesn't use the system. This project also faced serious resistance at the start. In the first meeting, the most experienced rep asked, "I've kept my customers in my head for 15 years. Why should I type them into a program?"

These are the methods we used to overcome that resistance:

- **Answering the "What's in it for me?" question.** We positioned the CRM not as a monitoring tool but as a tool that makes the rep's job easier. Automatic follow-up reminders, instant mobile access to customer history and no more manual report preparation were the concrete proof of that message.
- **Keeping data entry to a minimum.** Entering notes after a visit shouldn't take more than a minute. That's why templates, drop-down lists and the voice note feature mattered.
- **Running sales meetings from the CRM screen.** The weekly sales meeting no longer opened an Excel file. Instead, the pipeline view was projected directly. Opportunities that weren't in the CRM weren't discussed in the meeting. This became the strongest motivation to use the system.
- **The manager leading by example.** The sales manager also entered the major accounts he personally handled into the CRM and shared all his notes through the system.
- **Not expecting "perfection" in the first month.** Missing fields and incorrect stages were accepted as normal in the first few weeks. Instead of criticizing mistakes, we held short weekly correction sessions.

By the end of the third week, the rep who had initially resisted the most described the reminder feature in the mobile app as "the thing that helps me most." Small wins like this were decisive in making the change stick.

For teams looking for outside support on pipeline discipline and sales methodology, [Sales Corner's data-driven B2B sales approach](https://salescorner.co) can be a good starting point for addressing CRM setup together with sales process design.

## Which automations were set up?

We deliberately took a cautious approach to automation. Setting up dozens of automated rules while the team is still getting used to the CRM creates confusion. In the first phase, we rolled out only the five workflows that would save the most time:

1. **Quote follow-up reminder:** When an opportunity moves to the "Quote Sent" stage, a follow-up task is automatically created for the owning rep 5 business days later.
2. **Stalled opportunity alert:** For opportunities with no activity logged for 21 days, a notification goes to both the rep and the sales manager.
3. **Web form integration:** When the quote request form on the company website is submitted, the record is automatically created in the CRM and assigned to the relevant rep by region. We built this workflow with n8n. The form data is cleaned first (phone format, company name standard), and if it matches an existing record, it is linked to the relevant company instead of creating a new record.
4. **Passing won opportunities to accounting:** When an opportunity is marked "Won," n8n sends a notification to the accounting team with the company details and an order summary. This means no separate email needs to be written to start the invoicing process.
5. **Weekly summary report:** Every Monday morning, the sales manager and the general manager receive a summary email showing the previous week's new opportunities, stage changes and lost opportunities.

For a sales manager who used to spend Monday mornings preparing reports, that last item alone proved the value of the project. If you're curious about a more extensive example of workflows built with n8n, take a look at [our case study on B2B SaaS customer onboarding automation with n8n](https://cornergroup.co/blog/n8n-ile-b2b-saas-musteri-onboarding-otomasyon-vaka-calismasi).

## How much does it cost?

The cost of moving from Excel to a CRM covers much more than the license fee. When planning your budget, we recommend accounting for the following items:

- **License fee:** Paid monthly per user and varies depending on the plan selected. Because prices are updated frequently, you should check the vendor's current pricing page at the decision stage. For a six-person team, this is usually the most predictable item in the budget.
- **Setup and consulting:** Process mapping, data cleansing and configuration. In this project, roughly half of the total effort went into data cleansing.
- **Integration and automation:** Tools like n8n are low-cost when self-hosted on your own server, but setup and maintenance require technical time.
- **The team's time:** Workshops, training and the learning curve in the first few weeks. This item is usually overlooked, but it is a real cost.
- **The hidden cost of doing nothing:** Quotes left without follow-up, customer history lost when a rep leaves and hours spent on manual reporting.

Let's do a simple calculation. Suppose the sales manager spends about 4 hours a week merging reports. That adds up to nearly 200 hours a year. Add the time reps spend searching for files, verifying information and making up for missed follow-ups, and for most SMEs the annual cost of a CRM license falls short of this lost time. To run your own numbers, simply multiply these hours by your team cost.

## What changed in the first 90 days?

Three months after the migration, we held a review meeting with the company. The changes we observed were:

- **Pipeline visibility:** Management could now see the total value of open opportunities and their distribution across stages in real time. The weekly report became fully automated.
- **Follow-up discipline:** "Quote sent, then forgotten" opportunities dropped significantly. Thanks to the stalled opportunity alerts, the sales manager started noticing quotes that had gone quiet within days rather than weeks.
- **Loss reasons measured for the first time:** Data from the first three months showed that a significant share of lost opportunities were lost not because of price but because the "project was postponed." This finding led to a 90-day re-engagement workflow for postponed projects.
- **Knowledge continuity:** During this period, one rep went on extended leave. Their customers were handed over smoothly to another rep, along with their full correspondence and call history.
- **Adoption rate:** The entire team was actively using the system, and the Excel files were consulted only for archival purposes.

The length of the sales cycle also became measurable. This metric can only be interpreted meaningfully with several quarters of data. You can explore the steps that can be taken to shorten the cycle in [our case study on shortening the B2B sales cycle](/blog/shortening-b2b-sales-cycle-case-study).

## Mistakes made and lessons learned

Like any project, this one didn't go perfectly. An honest case study should cover what didn't work as well as what did.

- **We underestimated the time needed for data cleansing.** Cleansing, initially planned for one week, took two. Matching problems caused by Turkish characters in particular (such as "Şişli" vs. "Sisli") took more time than expected. For a similar project, we recommend setting aside at least two weeks for this phase.
- **We initially made the product group field too detailed.** A drop-down list with more than 30 options slowed the reps down. In the second week, it was reduced to 8 main groups.
- **We brought the accounting team in too late.** Because the transfer format for won opportunities didn't fit accounting's needs, the workflow had to be rebuilt once. Inviting stakeholders outside sales to the first workshop would have prevented this problem.
- **What we got right:** Making Excel read-only, running sales meetings from the CRM screen and rolling out automations gradually. These three decisions were the most decisive factors in getting the system adopted.

If the company had sold through dealers or distributors, the process would have needed a different design. In that case, dealer-level visibility and performance tracking would have had to be added as a separate layer. We covered this scenario in [our case study on sales tracking across a manufacturing SME's dealer network](/blog/dealer-network-sales-tracking-case-study).

## Frequently asked questions

### How long does it take an SME to move from Excel to a CRM?

For a sales team of six to ten people, a realistic timeframe is usually 6–10 weeks. Most of that time goes not into software setup but into defining the sales process and cleansing the data. The messier the data, the longer the migration takes.

### Which CRM is better for SMEs: HubSpot, Pipedrive or Zoho?

There is no single right answer. Pipedrive stands out if pipeline visibility and ease of use are your priorities. HubSpot is the stronger choice if you want to combine marketing and sales on one platform, and Zoho if you're looking for extensive customization and a broad app ecosystem. Make your choice based on how your team works day to day and what you'll need over the next two years.

### Should we import all our Excel data into the CRM?

No. Importing all the data as it is means carrying the mess from Excel into the new system. Merge duplicate records, move records with no interaction for a long time into an archive, and include only active records with a clear owner in the pipeline.

### What should we do if the sales team doesn't use the CRM?

First, talk to the reps one-on-one to understand why data entry feels difficult. Remove unnecessary fields, make mobile use easier and run sales meetings solely on CRM data. The manager actively using the system is the single strongest factor in accelerating adoption.

## Conclusion

Moving from Excel to a CRM is less a software project than a transformation of processes and habits. In this case, what made the difference wasn't setting up the most advanced features. The decisive factors were clarifying the sales process on paper first and cleansing the data meticulously. Just as important were building a simple structure that makes the team's daily work easier and adding automations gradually. As a result, management can see the pipeline in real time, reps don't miss follow-ups, and customer relationships now belong to the company rather than to individuals.

If you're considering moving your sales operation from Excel to a CRM, restructuring your existing CRM or automating your sales processes with n8n, let's assess your needs together. [Get in touch with the Corner Group team](/en/contact) and we'll put together the right migration plan for you.
