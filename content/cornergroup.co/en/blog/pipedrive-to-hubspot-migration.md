---
title: "Pipedrive to HubSpot Migration: Case Study & Data Steps"
description: "How Turkish SMBs can switch CRMs without losing records, activities or pipeline data: a step-by-step Pipedrive to HubSpot migration case study."
date: "2026-10-22"
category: "Case Study"
image: "https://images.pexels.com/photos/7654401/pexels-photo-7654401.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Pipedrive to HubSpot migration: case study and data migration steps"
alt: "pipedriveden-hubspota-gecis-vaka-calismasi"
---

With proper planning, a Pipedrive to HubSpot migration is a project that can be completed **within 2 to 6 weeks** without bringing your sales team to a halt. The key to success is migrating data in the right order: companies first, then contacts, then deals, and finally activities and notes. This sequence must be preceded by data cleansing, field mapping and a test import, and followed by validation and rebuilding your automations.

In this post, we walk through an anonymized example scenario that brings together situations the CRM Corner team frequently encounters in migration projects. The scenario covers a growing B2B SaaS company's move from Pipedrive to HubSpot. The figures are illustrative values used to make the scale concrete. Our goal is to give you a step-by-step roadmap you can apply directly when planning your own migration.

## Case context: Why did the company want to move from Pipedrive to HubSpot?

The company in our scenario had been using Pipedrive since it was founded. When the team was small, Pipedrive was an excellent choice: a clean interface, a visual pipeline and fast setup. But as the company grew, certain limitations became apparent:

- **Marketing and sales lived in separate worlds.** When a form was submitted, the lead first landed in the email marketing tool and was then transferred to Pipedrive manually or through fragile integrations.
- **The customer journey wasn't visible in one place.** Website visits, email engagement and sales calls were scattered across different tools.
- **Reporting had become difficult.** Management couldn't get a clear answer to the question, "Which channel actually drives revenue?"
- **There was no structure for the customer success team.** Post-sale support requests and renewal processes were tracked in spreadsheets.

This doesn't mean Pipedrive is a bad tool; it simply shows that the company's needs had evolved from a "sales CRM" to "a platform that unifies marketing, sales and service." If you're still on the fence about this decision, our [decision guide for SMBs choosing between HubSpot and Pipedrive](/blog/hubspot-vs-pipedrive-smb-decision-guide), which compares the two tools, is a good place to start.

The data volume in the example scenario was roughly as follows:

- Approximately 4,000 organization (company) records
- Approximately 11,000 person records
- Approximately 2,500 deals across 3 different pipelines
- Tens of thousands of activities and notes
- More than 60 custom fields
- 8 users, 5 active automations and 4 third-party integrations

This scale is typical for many growth-stage B2B companies in Turkey and shows that a migration is not "a simple CSV import."

## What should you prepare before starting the migration?

Most problems in migration projects arise not in the technical phase but from a lack of preparation. The team in our scenario devoted the entire first week to planning.

**1. Identify stakeholders.** The sales manager, the marketing lead, an operations (RevOps) lead and an executive decision-maker should be involved in the project. For every area, the question "Who has the final say?" should be settled from the outset.

**2. Write down your success criteria.** Define what must be true before you can say "the migration is done." For example:
- All open deals will have been migrated with the correct stage and the correct owner.
- Contact–company–deal associations will be fully in place.
- Activity history for the last 24 months will be accessible.
- Critical automations will be up and running in HubSpot.

**3. Set the cutover date.** Put the day Pipedrive switches to read-only mode and the team starts working in HubSpot on the calendar. Avoid busy periods such as month-end or quarter close.

**4. Plan for license overlap.** Both tools need to be active for a few weeks during the migration. Keep your Pipedrive subscription open until at least 2–4 weeks after the cutover date. That way, if you notice missing data during validation, you can go back to the source.

## What are the steps for migrating data from Pipedrive to HubSpot?

The migration in our scenario was completed in nine steps. These steps can largely be adapted to companies of different sizes as well.

### Step 1: Data inventory and audit

The first task is to fully list everything in Pipedrive. The team compiled the following inventory:

- All objects: Organizations, Persons, Deals, Leads (Leads Inbox), Activities, Notes, Products, Files
- Standard and custom fields on each object, along with field types (text, single option, multiple options, date, monetary, user)
- Pipelines and stages
- Users and record ownership
- Active automations, web forms and integrations

An important finding emerged at this stage: roughly a third of the 60+ custom fields had not been filled in at all over the past year. These fields were not migrated. **Every field you migrate is a potential source of future clutter.** Moving unused data into a new system just relocates old disorder to a new address.

### Step 2: Data cleansing

Cleansing is the most tedious yet most valuable phase of the migration. The team did the following:

- **Merged duplicate records.** Cases such as the same company having three separate records — "ABC Teknoloji", "ABC Teknoloji A.Ş." and "ABC Tech" — were identified.
- **Validated email addresses.** HubSpot uses email addresses to deduplicate contact records. Blank or invalid emails cause duplicate records or matching issues during import.
- **Standardized company domain names.** In HubSpot, companies are generally matched by domain name. "www." prefixes, "http://" strings and subdirectories were cleaned up.
- **Archived old and dead records.** Contacts with no engagement in years and no deal history were kept in a separate archive file and were not migrated to HubSpot.

The importance of this phase grows even further in multi-brand structures. We described in detail how to protect data quality when multiple brands touch the same customer in [our case study on CRM data quality in a multi-brand holding company](https://cornergroup.co/blog/cok-markali-holdingde-crm-veri-kalitesi-basarili-bir-vaka-calismasi).

### Step 3: Data model and field mapping

Although Pipedrive's and HubSpot's data models look similar, they are not identical. The team prepared a mapping table for every field. The core object mapping was as follows:

| Pipedrive | HubSpot | Note |
|---|---|---|
| Organization | Company | Domain name used as the deduplication key |
| Person | Contact | Email used as the deduplication key |
| Deal | Deal | Pipeline and stage mapping done separately |
| Lead (Leads Inbox) | Contact + Lifecycle Stage | Represented by lifecycle stage instead of a separate object |
| Activity (Call, Meeting, Task) | Call, Meeting, Task | Split by activity type |
| Note | Note | Associated with the relevant records |
| Product | Product + Line Item | Products on deals migrated as line items |

Points to watch out for with field types:

- **Single option** fields in Pipedrive were created in HubSpot as **dropdown select**, and **multiple option** fields as **multiple checkboxes**. The internal values of the options must be written exactly the same; otherwise, the values will be left blank on import.
- **User-type** fields (for example, "Account manager") were mapped to a user field in HubSpot. This requires all users to be created in HubSpot before the import.
- If you use multiple currencies in **monetary** fields, the currency settings in HubSpot must be configured in advance.

**Critical tip:** Add a custom field called "Pipedrive ID" to every object and carry the original ID over into this field. This small step will save you hours when building associations, debugging errors and validating after the migration.

### Step 4: Pipeline and stage mapping

The company in our scenario had three pipelines in Pipedrive: new business, upsell to existing customers, and partnerships. The migration was also an opportunity to review processes.

The team reduced the seven stages in the new business pipeline to five. The "Preparing proposal" and "Proposal sent" stages were merged into a single "Proposal" stage. In addition, each stage was assigned a **win probability** in HubSpot, so forecast reports were meaningful from day one.

If you're merging stages, clearly state in your mapping table which new stage each old stage will map to. **Lost reasons** for lost deals should also be migrated into a separate field; this data will later become one of the most valuable sources for sales analysis. If you're curious about how to structure lost-reason analysis, take a look at [our case study on finding the reasons behind lost B2B deals](/blog/lost-b2b-sales-reasons-case-study).

### Step 5: Test import

Before the main import, the team ran a test in HubSpot with a small dataset. The sample dataset consisted of about 50 randomly selected companies along with their associated contacts, deals and activities.

Points checked during the test:

- Are custom fields populating correctly?
- Are Turkish characters (ç, ğ, ı, ö, ş, ü) transferred without corruption? (Saving CSV files with **UTF-8** encoding largely prevents this issue.)
- Are date formats being read correctly? (Confusion between DD.MM.YYYY and MM/DD/YYYY is one of the most common errors.)
- Are contact–company–deal associations being created?
- Are record owners being assigned to the correct user?

Two issues came up in the test: one of the date fields was reading the month and day in reverse, and the option values of a dropdown field didn't match those in Pipedrive. Both were fixed before the main import. **Skipping the test import is the most expensive shortcut in migration projects.**

### Step 6: Main import and the right sequence

Sequencing is critical in the main import, because associations can only be created if both sides already exist in the system. The team followed this order:

1. **Users and teams:** All users were created in HubSpot and the necessary permissions were defined.
2. **Companies:** The domain name was used as the deduplication key, and Pipedrive IDs were written to the custom field.
3. **Contacts:** Email was used as the deduplication key. The company association was created via the company domain name or the Pipedrive organization ID.
4. **Deals:** Imported along with pipeline, stage, amount, close date and owner information. Associations with the related companies and contacts were created.
5. **Products and line items:** The product library was created, and then the product lines on deals were added.
6. **Activities:** Calls, meetings and tasks were split by type and imported. Incomplete tasks were assigned to the relevant user as open tasks.
7. **Notes and files:** Migrated and associated with the relevant records.

Depending on data volume and association complexity, there are three possible routes at this stage: CSV files via HubSpot's import tool, third-party migration tools, or a custom API-based import. The team in our scenario chose a hybrid approach: they migrated companies, contacts and deals using HubSpot's multi-file import feature, and transferred thousands of activities and notes with an **n8n** workflow that pulled data from the Pipedrive API and wrote it to the HubSpot API. n8n offered two advantages here: it split the import into small batches to avoid hitting API limits, and it wrote failed records to a separate list, making retries easy.

### Step 7: Validation

The work isn't over when the import finishes. The team carried out three layers of validation:

- **Count validation:** For each object, the record count in Pipedrive was compared with the record count in HubSpot. Archived and merged records were taken into account.
- **Amount validation:** The total deal amount for each pipeline and stage was compared across the two systems. This is the fastest way to catch deals that are missing or have landed in the wrong stage.
- **Sample check:** Each sales rep was asked to open and check 10 records from their own portfolio. Having users check their own data both catches errors and builds trust in the new system.

### Step 8: Rebuilding automations and integrations

Automations in Pipedrive cannot be moved directly to HubSpot; they need to be rebuilt. This is actually an advantage, because it's a good opportunity to weed out outdated rules.

The main structures rebuilt in the scenario were:

- **Lead assignment:** Leads coming from web forms were automatically assigned to the right rep based on country and company size.
- **Stage-based tasks:** When a deal moved to the "Demo" stage, a post-demo follow-up task was automatically created for the rep.
- **Lifecycle updates:** When a deal was won, the lifecycle stage of the associated contact and company was updated to "Customer."
- **Customer success handoff:** For won deals, an automated onboarding process was triggered for the customer success team. We detailed how you can design this kind of handoff flow in [our case study on B2B SaaS customer onboarding automation with n8n](https://cornergroup.co/blog/n8n-ile-b2b-saas-musteri-onboarding-otomasyon-vaka-calismasi).

On the integration side, email and calendar sync, the meeting scheduling tool, the billing system and web forms were connected to HubSpot. The email sequences used for outbound were also migrated to HubSpot, and lead sources became trackable using HubSpot's "Original Source" logic. If you want to build your outbound processes end to end with your CRM, [SAAS Corner, which provides outbound sales and lead generation services for B2B SaaS companies](https://saascorner.co), can support you on this front.

### Step 9: Training and cutover

A technically flawless migration is still considered a failure if the team doesn't use the new system. The team held three sessions in the week before the cutover date:

- **For the sales team:** Daily workflow, deal management, tasks, email tracking and the mobile app.
- **For managers:** Dashboards, forecasting and reporting.
- **For marketing:** Forms, lists, lead scoring and sales handoff rules.

On cutover day, Pipedrive was set to read-only; the final records created in Pipedrive between the migration and the cutover (the delta) were imported once more, and the team started working in HubSpot. For the first two weeks, a 15-minute Q&A session was held every day.

## How long does the migration take?

The timeline depends less on data volume and more on **data complexity** and **decision-making speed**. A general framework looks like this:

- **Small scale** (a few thousand records, a single pipeline, few custom fields): 1–2 weeks
- **Mid scale** (tens of thousands of records as in our scenario, multiple pipelines, automations and integrations): 3–6 weeks
- **Large scale** (multi-brand structures, complex associations, numerous integrations): 2–4 months

The migration in our scenario was completed in about five weeks: one week of planning and inventory, a week and a half of cleansing and mapping, one week of testing and the main import, and a week and a half of automation, training and cutover. If you'd like to see how a larger, multi-stakeholder migration is managed, check out [our case analysis of a large-scale B2B CRM migration process](https://cornergroup.co/blog/buyuk-olcekli-b2b-crm-gecis-sureci-basarili-bir-kurulumun-vaka-analizi).

## What does the cost depend on?

Giving an exact figure would be misleading, because costs vary greatly from company to company. The main items that determine the budget are:

- **HubSpot licenses:** Which Hubs (Sales, Marketing, Service) and which tier (Starter, Professional, Enterprise) you choose is the largest component of the total cost. The number of users and marketing contacts also affects pricing.
- **License overlap period:** You'll need to pay for both tools at the same time during the migration.
- **Migration services:** Consulting, data cleansing and custom import development. The more custom fields, activity history and integrations you have, the more effort is required.
- **Third-party tools:** The cost of automated migration tools or automation platforms such as n8n, if used.
- **Internal team time:** This is the most overlooked item. The time your sales and marketing teams spend on mapping decisions, testing and training is a real cost.

**Practical recommendation:** The most effective way to reduce costs is to reduce the amount of data you migrate. Eliminating unused fields and dead records lowers both the import time and the number of marketing contacts in HubSpot — and therefore your license costs.

## What are the most common mistakes?

These are the mistakes we encounter again and again in migration projects:

1. **The "let's migrate everything" approach.** Copying all the clutter of the old system into the new one wipes out the benefits of the migration from the start.
2. **Neglecting deduplication keys.** Contacts without emails and companies without domain names are the fastest way to generate duplicate records in HubSpot.
3. **Skipping the association order.** Importing deals before companies and contacts results in thousands of "orphaned" deals.
4. **Forgetting activity history.** If the team can't see a customer's past conversations in the new system, they'll want to go back to Pipedrive, and adoption will drop.
5. **Leaving automations until after cutover.** If the lead assignment rule doesn't work on day one, hot leads are left without an owner.
6. **Treating training as a one-off.** A one-hour presentation isn't enough; support in the first few weeks is decisive in forming habits.

## What should you do in the first 90 days after the migration?

The real value of the migration emerges after cutover day. The team in our scenario approached the first 90 days in three phases:

- **First 30 days – Stabilization:** User feedback was collected, and missing fields and minor bugs were fixed. The Pipedrive subscription was cancelled at the end of this period, and a full backup file was archived.
- **Days 31–60 – Visibility:** Management dashboards were built. Lead source by channel, stage-to-stage conversion rates and average sales cycle length could be monitored on a single screen for the first time.
- **Days 61–90 – Optimization:** Lead scoring was rolled out, and handoff rules between marketing and sales were clarified. Bottlenecks in the pipeline began to be identified with data.

After the migration, turning CRM data into pipeline efficiency is the natural next step. On this topic, [our case study on sales pipeline optimization with AI-powered CRM](https://cornergroup.co/blog/yapay-zeka-destekli-crm-ile-satis-pipeline-optimizasyonu-basarili-bir-vaka-calismasi) offers a concrete roadmap. If you want to embed your sales methodology into your new CRM structure, the [Sales Corner](https://salescorner.co) team, which works in data-driven B2B sales, can also support you in this process.

## Frequently asked questions

### Can email history be migrated from Pipedrive to HubSpot?

Partially. Activities and notes in Pipedrive can be transferred to HubSpot via the API or import. However, it isn't always possible to migrate all email correspondence, including attachments, while preserving its original structure. The practical solution is to import critical email summaries as notes and connect email accounts to HubSpot so that some past correspondence becomes visible through syncing.

### Can the sales team keep working during the migration?

Yes — with proper planning, the team experiences virtually no downtime. During the preparation, cleansing and testing phases, the team continues working in Pipedrive. On cutover day, Pipedrive is set to read-only, the final changes are imported, and the team switches to HubSpot the same day.

### Should we do the migration ourselves or get support?

If you have a few thousand records, a single pipeline and few custom fields, the migration can be done in-house using HubSpot's import tool. If you're dealing with many custom fields, extensive activity history, multiple pipelines and integrations, getting support from an experienced team both shortens the timeline and reduces the risk of data loss. When deciding, also factor in the time your internal team will spend on the project as a cost.

### When should we cancel our Pipedrive subscription?

We recommend cancelling it at least 2–4 weeks after the cutover date. This window lets you fill in any gaps spotted during validation directly from the source. Before cancelling your subscription, don't forget to take a full export of all your data and archive it in a secure location.

## Conclusion

A Pipedrive to HubSpot migration is much more than a technical data transfer: it's an opportunity to review your sales processes, improve your data quality and unify marketing, sales and customer success on a single platform. The formula for a successful migration is clear: a thorough inventory, meticulous cleansing, clear field mapping, a test import without exception, a main import in the right sequence, three-layer validation and a strong training process that drives team adoption.

At CRM Corner, we provide end-to-end support for HubSpot, Pipedrive and Zoho migrations — from data migration to n8n automations, and from reporting to team training. If you're planning your own migration or wondering why your current setup isn't delivering the efficiency you expected, reach out to us via [our contact page](/en/contact), and let's build a roadmap tailored to your needs together.
