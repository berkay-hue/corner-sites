---
title: "Logo & Mikro CRM Integration: An SME Case Study"
description: "How we matched sales and accounting data for SMEs running Logo or Mikro ERP: the step-by-step process and the problems we ran into along the way."
date: "2026-11-10"
category: "Case Study"
image: "https://images.pexels.com/photos/8292795/pexels-photo-8292795.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Logo and Mikro CRM Integration: An SME Case Study"
alt: "logo-mikro-crm-entegrasyonu-kobi-vaka"
---

An SME running Logo or Mikro can connect its CRM to its ERP so the sales team sees account balances, stock, pricing and invoice data without logging into the ERP. The most critical decision in these projects is which system will be the "single source of truth" for each type of data. In a well-designed integration, customer accounts and invoices flow from the ERP to the CRM, while approved quotes flow from the CRM to the ERP as orders. This eliminates double data entry and the endless "which number is right?" debate.

In this post, we walk through the experience of an SME managing two separate companies under one roof. The parent company used Logo, while a distributor it had later acquired used Mikro. The sales team wanted to move to a shared CRM. We are keeping the client's name confidential. The timelines and volumes we share are specific to this project and should not be read as industry averages. Our goal is to show, in concrete terms, which steps teams embarking on a similar journey should take, where they are likely to get stuck and what they should watch out for.

## What was the company's starting point?

The company sold industrial consumables and spare parts and had around 60 employees. The sales team consisted of 9 field representatives and 3 inside sales staff. In short, the picture looked like this:

- **Parent company:** Accounting, inventory and invoicing ran on Logo. The system had been in use for several years, and the customer account structure was well established.
- **Acquired distributor:** It had its own Mikro installation. Its account coding logic, product codes and price lists were completely different from those of the parent company.
- **Sales tracking:** Reps prepared quotes in Excel and recorded customer conversations in personal notes or WhatsApp chats. The only way for managers to see the pipeline was the weekly meeting.
- **Recurring problems:** A rep would send a quote to a customer who had already exceeded their credit limit, and the order would then get stuck in accounting. Because the same customer was registered under different names in the two companies, shared customers went unnoticed and cross-selling opportunities were missed.

Management had already decided to move to a CRM. However, a previous CRM initiative had been abandoned halfway. Because reps saw entering data into the CRM as "extra work," the system was dropped within a few months. This is a pattern we frequently see among SMEs in Turkey. We described a similar cycle in our earlier [case study on why sales teams don't use their CRM](/blog/sales-team-not-using-crm-sme-case-study). This time, the differentiator would be the ERP integration. When a rep opened the CRM, they had to see information that was useful to them and that they couldn't find anywhere else.

## Why should Logo and Mikro talk to the CRM?

ERP and CRM answer different questions. The ERP answers "What did we sell, how much are we owed and what's in the warehouse?" The CRM is concerned with "Who will we sell to, when and with what probability?" When the two systems are disconnected, the following problems arise:

1. **Double data entry:** A new customer is entered first in the CRM, then by accounting in the ERP. The company name, tax number and address start to diverge between the two.
2. **Blind quoting:** Reps issue quotes without knowing the stock status or the customer's outstanding balance.
3. **Disconnected reporting:** "Won" deals in the CRM don't match invoices in the ERP. Management sees two different revenue figures.
4. **Loss of motivation:** The CRM comes to be seen as just a reporting tool for managers, and reps stop using it.

The real goal of the integration was not to build a technical connection, but to make the CRM indispensable for the sales team.

## Which CRM was chosen, and why?

HubSpot, Pipedrive and Zoho were put on the table during the evaluation. The decision was based on the following criteria:

- **API maturity:** Custom properties, company and contact objects, and the quote and product library had to be easy to manage via the API.
- **Quote module:** Reps needed to be able to prepare quotes within the CRM using the product and price lists coming from the ERP.
- **Ease of use:** Given the previous failed attempt, a clean, simple interface was a priority.
- **Budget:** The per-user cost had to be sustainable for a 12-person team.

In the end, HubSpot Sales Hub was selected. This choice is not a universal recommendation. Pipedrive, for teams looking for simpler pipeline management, and Zoho, for cost-conscious teams that need a wide range of modules, can also be integrated using the same architecture. If you are considering switching CRMs, you may also want to read [our post on the data migration steps in moving from Pipedrive to HubSpot](/blog/pipedrive-to-hubspot-migration).

## Which data should flow in which direction?

The longest meeting of the project was about this question. Together with representatives from accounting, sales and management, we prepared a "single source of truth" table:

| Data | Primary source | Flow direction | Frequency |
|---|---|---|---|
| Customer account (company name, tax no., address) | ERP | ERP → CRM | Every 15 minutes |
| Prospect (no customer account yet) | CRM | CRM only | — |
| Product master and product information | ERP | ERP → CRM | Twice a day |
| Price lists | ERP | ERP → CRM | Once a day + on change |
| Account balance and credit limit | ERP | ERP → CRM | Hourly |
| Quote | CRM | CRM only | — |
| Approved quote → order | CRM | CRM → ERP | Real-time (via trigger) |
| Invoice summary | ERP | ERP → CRM | Daily |
| Calls, notes, activities | CRM | CRM only | — |

This table had three important consequences:

- **Customer accounts were made non-editable in the CRM.** Fields coming from the ERP were set to read-only in the CRM. If a rep spotted an error in a company name, they opened a "correction request" task in the CRM, and accounting made the change in the ERP.
- **The distinction between prospects and customer accounts became clear.** Companies that hadn't yet made a purchase lived only in the CRM. When the first order was approved, a customer account was created in the ERP and its code was written back to the CRM.
- **Invoice summaries were synced, not invoice details.** Transferring every invoice line to the CRM would have created unnecessary load. Instead, the last 12 months of revenue, the last invoice date and the top 5 product groups were synced for each customer.

## How was the technical architecture built?

### Connection layer

Both Logo and Mikro offer different integration options depending on the installation and version. These can include the ERP's own service/object interface, REST services or controlled database access. Two core principles were adopted in this project:

1. **For read operations**, read-only views created specifically for the integration in the ERP's SQL Server database were used. Rather than accessing the tables directly, the integration accessed views designed together with the ERP partner. That way, even if the table structure changed during an ERP update, only the views needed to be updated.
2. **For write operations** (creating orders and customer accounts), nothing was ever written directly to the database. The ERP's official integration interface was used. Writing directly to tables carries serious risk, as it bypasses the ERP's business rules, document numbering sequences and accounting links.

At this point, reaching out early to the company's Logo and Mikro partners made a big difference. Which integration modules were included in the license, and whether additional licenses were needed, was clarified in the first week.

### Orchestration: n8n

Rather than buying an off-the-shelf connector for the flows between two ERPs and one CRM, the team opted for an **n8n** installation running on the company's own server. The reasons were:

- The ERP servers were on-premises, and there was no appetite for exposing them to the outside. Running n8n on the same network removed the security team's objections.
- Flows written separately for Logo and Mikro reached the same HubSpot destination through a shared "transformation" layer.
- Error handling, retries and logging could be monitored visually. This made it easier for the company's IT lead to take over the system.

A total of 11 workflows were built: 6 for ERP-to-CRM synchronization, 2 for transferring orders from the CRM to the ERP, and 3 for error notifications and a daily reconciliation report. If you are curious about other use cases for automations built with n8n, take a look at [our case study on customer onboarding automation with n8n](https://cornergroup.co/blog/n8n-ile-b2b-saas-musteri-onboarding-otomasyon-vaka-calismasi).

### Merging two different ERPs into a single CRM

The most challenging part was bringing the customers of both companies together under a single company record in the CRM. The solution was designed as follows:

- **The matching key was the tax number.** Comparing company names wasn't reliable: "ABC Mak. San. Tic. Ltd. Şti." and "ABC Makina Sanayi" could be the same company.
- **Two separate ERP code fields were created in the CRM:** "Logo Account Code" and "Mikro Account Code." For a shared customer, both fields were populated.
- **Balance and revenue fields were kept separate for each company**, and a "Group Total" field was also calculated.
- **For sole proprietorships, the Turkish national ID number** was used. Under KVKK (Turkey's Personal Data Protection Law), this field was restricted so that only certain roles could view it.

At the initial matching, there were approximately 3,800 active customer accounts on the Logo side and about 1,900 on the Mikro side. Matching by tax number identified several hundred shared customers. For management, this was the first tangible value the project delivered, even before go-live. Cross-selling potential that had never been visible before could be listed for the first time.

## How long did data cleansing take?

This is the most underestimated phase of integration projects. In this project, it took longer than the technical development. The main issues encountered were:

- **Missing or invalid tax numbers:** Especially in older customer accounts, the tax number field was empty or had the wrong number of digits. A simple validation rule (10 digits for a tax ID, 11 digits for a national ID) was used to list suspicious records, which were handed to accounting as a worklist.
- **Duplicate customer accounts:** The same company had multiple accounts because of different branches or spelling errors. These were not merged in the ERP. Instead, a "parent company and branch" relationship was set up in the CRM to group them under one umbrella for reporting.
- **Inactive accounts:** Customer accounts with no activity in the last 3 years were not migrated to the CRM at all. This significantly reduced the number of records in the CRM and simplified the interface.
- **Contacts:** In the ERP, contact information usually consisted of a single name in the "authorized person" field. Reps were asked to enter the decision-maker and purchasing contact details into the CRM for the top 30 customers in their portfolio.

We covered the data cleansing side of moving from Excel to a CRM in detail in our [case study on an SME's transition from Excel to CRM](/blog/sme-excel-to-crm-migration-case-study). The difference here was that some of the data was already well organized in the ERP. Even so, hidden inconsistencies surfaced in data that looked clean.

## How did the project progress step by step?

The project went live in 10 weeks in total. The phases were:

1. **Weeks 1–2: Discovery and data ownership.** The process map was drawn up. The "single source of truth" table above was signed off. The integration method was agreed with the ERP partners.
2. **Weeks 3–4: Data cleansing and field mapping.** A mapping document was prepared for a total of 47 fields. The source, destination, format and transformation rule for each field were documented.
3. **Weeks 5–6: Read flows.** Account, stock, price and balance syncs were set up in the test environment. Read-only fields and company record views were configured in HubSpot.
4. **Week 7: Write flows.** The quote-approval-to-order flow was built. More than 40 scenarios were tested in the test environment, such as credit limit breaches, out-of-stock products, quotes requiring discount approval and new customer account creation.
5. **Week 8: Pilot.** A live pilot was run with 3 reps. The other reps continued with the old method.
6. **Week 9: Training and fixes.** The interface was simplified based on feedback from the pilot. The whole team received a half-day hands-on training session.
7. **Week 10: Full rollout.** The Excel quote templates were retired. Quotes could now only be generated from the CRM.

### How does the quote-to-order flow work?

This was the flow that delivered the most value in day-to-day use:

- The rep creates a quote from a deal in HubSpot. Products and list prices come from the product library synced from the ERP.
- For quotes above a defined discount threshold, approval from the sales manager is requested automatically.
- While the quote is being created, the customer's current balance and credit limit are visible on the company record. If the credit limit has been exceeded, the rep sees a warning.
- When the customer approves, the rep moves the deal to the "Won" stage. n8n captures this change and creates the sales order in the relevant ERP (Logo or Mikro, depending on which company the customer buys from).
- The order number is written back to the deal in the CRM. When the order is invoiced, the invoice summary is added to the same record.

Thanks to this flow, accounting no longer received orders from reps by email; instead, they reviewed and approved the ready-made sales order in the ERP.

## What changed in the end?

Rather than citing made-up percentages, we are sharing the changes the teams described in their own words at the post-project review meeting:

- **Quote preparation time dropped noticeably.** Looking up price lists in Excel, calling the warehouse about stock and messaging accounting about balances were all eliminated.
- **The number of orders held up in accounting because of credit limits fell to almost zero.** Reps could see the issue at the quote stage.
- **CRM adoption became permanent.** Unlike the previous attempt, reps opened the CRM first thing in the morning, because they wanted to see a customer's last invoice and outstanding balance before calling them.
- **Cross-selling became visible.** An automatic list was created for customers buying from only one of the companies, and these were assigned to reps as tasks.
- **Management reporting was consolidated into a single screen.** Pipeline, won deals and actual invoiced revenue could be compared on the same dashboard.

Once the pipeline became visible, the company's next step was to clarify its sales methodology. For questions such as which criteria must be met at each stage and which deals should be included in the forecast, [Sales Corner's data-driven B2B sales approach](https://salescorner.co) can be a natural next step for teams like this.

## How much does it cost, and how long does it take?

Giving an exact figure would be misleading, because the cost depends on several variables:

- **CRM license:** A recurring monthly cost based on the number of users and the package chosen. The need for a quote module and custom fields often requires moving above the entry-level package.
- **ERP integration license:** Depending on the version of Logo or Mikro in use, an additional module or license may be required for the integration interface. The budget should not be finalized until you have confirmed this with your partner.
- **Orchestration tool:** When n8n is run on your own server, the licensing cost is low, but maintenance is your responsibility. Off-the-shelf connectors are quicker to set up but strike a different balance in terms of flexibility and recurring cost.
- **Consulting and development:** Effort increases with the number of fields, the number of ERPs and the need for bidirectional flows.

In terms of timeline, a single-ERP, one-way integration (reading from the ERP into the CRM only) can usually be completed in 4–6 weeks. For projects like this one, involving two ERPs and a bidirectional order flow, 8–12 weeks is a realistic range. The most uncertain part of the timeline is not technical development, but data cleansing and internal decision-making.

## Which mistakes should you avoid?

Here are the lessons we have drawn from this and similar projects:

1. **Don't write directly to the ERP database.** It may look faster in the short term, but the risk of breaking document numbering, accounting entries and e-document processes is high.
2. **Avoid bidirectional customer account updates.** Setups where the same field can be edited in both systems quickly turn into a "which value is correct?" conflict.
3. **Don't match on company names.** Use a unique key such as the tax number or national ID number. If this field is empty, complete it in the ERP first.
4. **Don't try to migrate everything.** Invoice lines, inactive accounts and old product records clutter the CRM and degrade performance.
5. **Set up error notifications from day one.** When a sync stops silently, nobody notices. A daily reconciliation email (the number of active accounts in the ERP versus the number of records in the CRM) is simple but a lifesaver.
6. **Don't leave accounting out of the project.** Although sales may appear to be the biggest winner of the integration, accounting owns the order and customer account processes. Flows built without their buy-in will meet resistance once live.
7. **Don't treat data quality as a one-off job.** Validation rules are needed for new records after the integration goes live, too. For multi-company structures, we covered this topic in detail in our [case study on CRM data quality at a multi-brand holding company](https://cornergroup.co/blog/cok-markali-holdingde-crm-veri-kalitesi-basarili-bir-vaka-calismasi).

## What changes if there is a dealer or branch network?

There was no dealer network in this case. However, a scenario we frequently encounter in similar projects is one where a manufacturing SME sells goods to its dealers through the ERP and the dealers then sell to end users. In such cases, dealers and end users need to be modeled as separate objects in the CRM, only dealer accounts should be pulled from the ERP, and end-user deals should be associated with the relevant dealer. You can find the details of this model in our [case study on sales tracking across a dealer network for a manufacturing SME](/blog/dealer-network-sales-tracking-case-study).

## Frequently asked questions

### Which CRMs can be integrated with Logo or Mikro?

Almost any CRM with an open API can be integrated with Logo and Mikro. HubSpot, Pipedrive and Zoho are the most commonly chosen options. What matters most is not the CRM, but which integration method will be used on the ERP side and whether it is covered by your license.

### Should you use an off-the-shelf connector or a tool like n8n for the integration?

For companies using a single ERP that are fine with standard fields, off-the-shelf connectors offer a quick start. If you have multiple ERPs, custom fields, on-premises server security requirements or complex business rules, a flexible orchestration tool like n8n is usually more sustainable. In either case, error handling and logging must be planned for.

### Does the integration affect ERP performance?

When designed correctly, the impact is minimal. Performing read operations through read-only views, limiting synchronization to changed records only and scheduling heavy operations outside business hours keep the load on the ERP to a minimum. Setups that re-read every table from scratch every 5 minutes should be avoided.

### What should you watch out for in terms of KVKK?

Personal data transferred from the ERP to the CRM, especially the national ID numbers of sole proprietorships, should be restricted so that only the roles that need it can view it. The country in which the CRM hosts its data should be reviewed with your legal counsel with respect to the provisions on cross-border data transfers. Not transferring unnecessary personal data at all is the safest approach.

## Conclusion

While a Logo and Mikro CRM integration may look like a technical connectivity project, its success depends on data ownership decisions, data cleansing and whether it genuinely adds value to the sales team's daily work. In this case, bringing two different ERPs together in a single CRM both eliminated double data entry and surfaced cross-selling opportunities that had never been visible before. Most importantly, this time the CRM became a tool the sales team chose to open of its own accord.

If you also want to get your ERP and CRM talking, make your existing CRM investment genuinely useful for your sales team or automate your processes with n8n, [get in touch with the Corner Group team](/en/contact). Let's review your current setup together and build a roadmap that fits your needs.
