---
title: "Import a Google Sheets Lead List into HubSpot with n8n"
description: "Automatically import your Google Sheets lead list into HubSpot with n8n: prevent duplicate records, map fields and track errors."
date: "2026-11-14"
category: "Automation"
image: "https://images.pexels.com/photos/7983587/pexels-photo-7983587.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Importing a Google Sheets lead list into HubSpot with n8n"
alt: "n8n-ile-sheets-lead-listesini-hubspota-aktarma"
---

The most practical way to move a lead list from Google Sheets into HubSpot is to build an n8n workflow with **a Google Sheets trigger, a data-cleaning step and a HubSpot "Create or Update" (upsert) operation**. The workflow reads every new row added to the sheet, creates or updates the contact in HubSpot based on the email address, and writes the result back to Sheets. Set up correctly, it largely eliminates the duplicate records, missing fields and delays that come with manual CSV imports.

In many B2B teams, leads first land in a spreadsheet. SDRs do their prospecting there, event lists get pasted in, and marketing shares a webinar attendee list. The problem is that this spreadsheet stays disconnected from the CRM where the sales team actually works. In this post, we walk through the approach we use most often on outbound and CRM projects at Corner Group: how to prepare the sheet, which nodes make up the n8n workflow, how to prevent duplicate records, and how to run bulk imports without hitting API limits.

## Why automated sync instead of manual import?

HubSpot's built-in CSV import works, but it's designed for one-off jobs. When your lead list is a live spreadsheet that keeps growing and that several people fill in at the same time, manual imports cause a few problems:

- **Delay:** If you import the list once a week, a lead added on Monday gets contacted on Friday. We covered how decisive speed is in sales in detail in [our post on the speed-to-lead concept and automated responses to inbound leads](/blog/speed-to-lead-n8n-automated-lead-response).
- **Duplicate records:** When different versions of the same list are imported again and again, the CRM can end up with two or three copies of the same person.
- **Inconsistent data:** Variations like "istanbul", "İstanbul" and "IST" break your reporting.
- **Lack of traceability:** The sheet doesn't show which rows were imported and which ones failed.

An automated n8n workflow solves all four problems at once. Each row is processed as soon as it's added (or on a schedule you define), the data is standardized, records are matched by email, and the row's status is written back to the sheet.

## What do you need before you start?

Before you begin the setup, have these four components ready:

1. **An n8n environment:** An n8n Cloud account or a self-hosted n8n instance running on your own server. Either is sufficient for this workflow.
2. **A Google account and OAuth connection:** You need to create a Google Sheets credential in n8n. For self-hosted setups, you may need to create an OAuth client in the Google Cloud Console.
3. **A HubSpot Private App token:** In HubSpot, create a new app under *Settings > Integrations > Private Apps*. Grant at least these scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`, `crm.objects.companies.read`, `crm.objects.companies.write`. Save the token in n8n as a HubSpot credential.
4. **A standardized Google Sheets template:** For the workflow to run reliably, your sheet's column structure must stay fixed.

You can build this workflow on HubSpot's free plan as well, but you may hit limits early on things like the number of custom properties, automation and reporting. You can find out when it makes sense to move to a paid plan in [our post examining the HubSpot free plan limits](/blog/hubspot-free-plan-when-to-upgrade).

## How should the Google Sheets spreadsheet be set up?

The quality of your automation depends on the quality of its input. Here is the minimum column structure we recommend:

| Column | Example value | HubSpot property |
|---|---|---|
| email | ayse.kaya@ornekfirma.com | email |
| ad | Ayşe | firstname |
| soyad | Kaya | lastname |
| unvan | Sales Director | jobtitle |
| sirket | Örnek Firma A.Ş. | company |
| web_sitesi | ornekfirma.com | website / domain |
| telefon | 0532 123 45 67 | phone |
| sehir | İstanbul | city |
| kaynak | LinkedIn Outbound | lead_kaynagi (custom property) |
| durum | (left blank) | – |
| hubspot_id | (left blank) | – |
| hata | (left blank) | – |

The last three columns are critical. The **durum** (status), **hubspot_id** and **hata** (error) columns are filled in by n8n. That way, anyone who opens the sheet can see which rows have been imported, which are pending and why any have failed.

A few practical tips:

- **Make email mandatory.** HubSpot deduplicates contacts by email address. Don't let rows without an email into the workflow.
- **Use data validation.** Add dropdown lists to columns like "kaynak" (source) and "sehir" (city) using Sheets' *Data > Data validation* feature. Free-text entry is the number one cause of inconsistency.
- **Don't rename columns.** n8n maps fields based on column headers. If someone renames the "email" column to "E-mail", the workflow breaks silently.

When building the list, the accuracy of contact data matters just as much as the structure. For verified email and job title data on the prospecting side, you can paste lists exported from tools like [Apollo.io](https://get.apollo.io/679irkzm35ya) directly into this template.

## How do you build the n8n workflow step by step?

The overall logic of the workflow is: **Trigger → Filter → Data cleaning → Company check → Contact upsert → Association → Write back to Sheets.** Let's go through each step one by one.

### 1. Choose your trigger

You have two options:

- **Google Sheets Trigger (Row Added):** The workflow runs when a new row is added to the sheet. With this trigger, n8n polls the sheet at set intervals; it can be configured to check every minute. Ideal for live lists that are constantly being filled.
- **Schedule Trigger + Google Sheets (Get Rows):** Reads the entire sheet, for example every hour or every morning at 08:00, and processes only the rows where the "durum" column is empty. More reliable for lists pasted in bulk and for retroactive fixes.

For most teams, we recommend the second method. Thanks to the "durum" column, the workflow becomes idempotent: the same row is never processed twice, and when you fix a failed row and clear its "durum" field, it is automatically retried on the next run.

### 2. Filter the rows to process

Select the *Get Row(s)* operation in the Google Sheets node, then add a **Filter** node. Conditions:

- `email` is not empty
- `durum` is empty

These two conditions filter out both rows without an email and rows that have already been imported. If 50 new leads are added per day to a 2,000-row sheet, the workflow only deals with those 50 rows on each run.

### 3. Clean and standardize the data

This step is skipped in most setups, and it's the one that causes the most problems later. You can add a **Code** node and set up cleaning logic like this:

```javascript
return $input.all().map(item => {
  const d = item.json;

  const email = (d.email || '').trim().toLowerCase();
  const capitalize = s => (s || '').trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/(^|\s)\S/g, c => c.toLocaleUpperCase('tr-TR'));

  // Domain: strip protocol, www and path
  const domain = (d.web_sitesi || email.split('@')[1] || '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .toLowerCase();

  // Phone: keep digits only, convert to +90 format
  let phone = (d.telefon || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = phone.slice(1);
  if (phone.length === 10) phone = '+90' + phone;

  const genericDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];

  return {
    json: {
      row_number: d.row_number,
      email,
      firstname: capitalize(d.ad),
      lastname: capitalize(d.soyad),
      jobtitle: (d.unvan || '').trim(),
      company: (d.sirket || '').trim(),
      domain: genericDomains.includes(domain) ? '' : domain,
      phone,
      city: capitalize(d.sehir),
      lead_kaynagi: d.kaynak || 'Unknown'
    }
  };
});
```

This code does three important things: it converts email addresses to lowercase to prevent matching errors, correctly capitalizes Turkish characters (e.g. "istanbul" → "İstanbul"), and normalizes phone numbers into a single format. It also avoids using generic email domains like gmail.com as the company domain; otherwise, hundreds of contacts could end up linked to a single company called "gmail.com".

If you want to enrich leads with additional data (industry, employee count, LinkedIn URL) at this stage, you can insert an enrichment step in between. We covered this in detail in [our guide to B2B lead enrichment automation with n8n](https://cornergroup.co/blog/n8n-ile-b2b-lead-zenginlestirme-otomasyonu-rehberi-verimliligi-artirin).

### 4. Find or create the company

In B2B sales, leaving a contact without a company creates a big gap in reporting. So handle the company record first:

1. **IF node:** Is the `domain` field populated? If it's empty, skip the company step and go straight to the contact step.
2. **HubSpot node (Company → Search by Domain):** Search HubSpot for an existing company by domain.
3. **IF node:** Did the search return a result?
   - If yes, grab the company ID.
   - If not, create a new company with the **HubSpot node (Company → Create)**, filling in the `name` and `domain` fields.
4. **Merge node:** Combine the company ID coming from both branches into a single flow.

With this structure, when a list of 15 people from the same company comes in, HubSpot ends up with one company and 15 contacts linked to it, not 15 separate companies.

### 5. Create or update the contact (upsert)

This is the heart of the workflow. In the **HubSpot node**, select the *Contact → Create or Update* operation. This operation uses the email address as the key: if the contact exists in HubSpot, it updates it; if not, it creates a new record.

Fields to map:

- **Email:** `{{ $json.email }}`
- **First Name / Last Name:** the cleaned first and last name
- **Job Title, Company Name, Phone Number, City:** the corresponding fields
- **Lifecycle Stage:** `lead`
- **Lead Status:** `NEW`
- **Custom property (lead_kaynagi):** by selecting the custom property under Additional Fields

There is one nuance to watch out for here: **if you write the lifecycle stage as "lead" on every update**, you'll be trying to move contacts who have already progressed to "opportunity" or "customer" back down. By default, HubSpot doesn't allow lifecycle stages to be moved backward, and you may get an error in this case. The solution: check whether the contact exists before the upsert and send the lifecycle field only for new records, or leave this field entirely to workflows inside HubSpot.

### 6. Associate the contact with the company

Once you have both the contact and company IDs, create the association. The most flexible way to do this is to call HubSpot's associations API with an **HTTP Request** node. You can use your HubSpot credential in this node too, so you don't need to enter the token separately. The default association type between contact and company is sufficient for most scenarios.

If you prefer, you can simplify this step by keeping HubSpot's "Automatically associate contacts with companies by company domain" setting turned on; however, manual association is more reliable for contacts with no domain or with a different domain.

### 7. Write the result back to Google Sheets

Finally, update the relevant row with the **Google Sheets node (Update Row)**. Use the `row_number` field for matching and write the following:

- **durum:** `Imported`
- **hubspot_id:** the contact ID returned by HubSpot
- **hata:** empty

This way, an SDR who opens the sheet can instantly see which leads have landed in the CRM and jump straight to the record using the HubSpot ID.

## How should errors be handled?

In the real world, not every row goes through smoothly. An invalid email format, a custom property value that doesn't exist in HubSpot or a temporary API error can halt the workflow. To handle this:

- Enable the **"On Error: Continue (using error output)"** option in the settings of your HubSpot nodes. That way, a single faulty row won't stop the entire workflow.
- Connect the error output to a separate Google Sheets node and write `Error` to the row's **durum** field and the message returned by HubSpot to the **hata** field.
- Define an **Error Workflow** in n8n to get notified via Slack or email when unexpected crashes occur.

With this setup, when the team opens the sheet in the morning, they can use the "Error" filter to see the problematic rows, fix them and clear the status field; the row is then automatically retried on the next run.

## How do you prevent duplicate records?

The upsert operation prevents duplicates by email, but on its own it isn't enough. Additional safeguards:

- **Always convert emails to lowercase.** Even though HubSpot treats "Ayse.Kaya@" and "ayse.kaya@" as the same, the cleaning step is essential for consistency.
- **Match companies by domain, not by name.** "Örnek Firma", "Örnek Firma A.Ş." and "ORNEK FIRMA" create three different records; "ornekfirma.com" is unique.
- **Remove duplicates within the sheet up front.** Use the Code node or the **Remove Duplicates** node to prevent the same email from being processed twice within the same run.
- **Treat the "durum" column as sacred.** A row with this column filled in is never processed again.

## How do you avoid hitting API limits during bulk imports?

Imagine a 3,000-row list being pasted into the sheet all at once. If each row requires 3–4 API calls, including company search, company creation, contact upsert and association, that adds up to more than 10,000 requests. HubSpot allows a limited number of requests within short time windows for private apps, and this limit varies by subscription plan. When you exceed the limit, you get a 429 error.

The solution is simple:

1. Use the **Loop Over Items (Split in Batches)** node to split rows into batches of 10.
2. Add a **Wait** node of 1–2 seconds at the end of each batch.
3. Enable the **Retry On Fail** option on your HubSpot nodes and set 3 attempts with a wait time of a few seconds.

With these settings, a 3,000-row list is processed in a reasonable amount of time without straining the workflow. For a normal daily flow of 50–100 leads, these limits are practically never noticeable.

## How much does it cost?

The cost of this workflow has three components:

- **n8n:** With a self-hosted setup, you don't pay a license fee for the software itself, only server costs; a small cloud server is sufficient for this workflow. On n8n Cloud, pricing is based on the number of workflow executions per month. A workflow running hourly with a Schedule Trigger generates about 720 executions per month; the Loop node doesn't increase the execution count, because all rows are processed within the same execution.
- **HubSpot:** This workflow runs on the free CRM. However, you may need Sales Hub's paid tiers for features such as custom properties, advanced automation and sequences.
- **Setup time:** For someone familiar with n8n, the basic workflow can be built in a few hours. Making it production-ready, including error handling, company matching and testing, usually takes one to two business days.

For comparison, consider this: an SDR who manually cleans and imports 300 leads a week easily spends 2–3 hours a week on the task. Over a year, that's more than 100 hours, and that time is taken away from sales conversations.

## A realistic use case

Let's take a B2B SaaS company with a three-person outbound team. Every day, the SDRs identify target accounts from LinkedIn and data tools and enter them into a shared Google Sheets spreadsheet. On top of that, the marketing team adds a webinar attendee list to the same sheet once a month.

Before automation, the list was imported once a week, someone manually merged duplicate records after every import, and some leads sat waiting without being assigned to any sales rep.

After the n8n workflow is set up, the process works like this:

1. An SDR adds a row.
2. Within an hour at most, the contact is created in HubSpot with "NEW" status, linked to the correct company and tagged with its source.
3. Further along the same workflow, the lead is distributed among team members in rotation. You can find this distribution logic step by step in [our post on setting up round-robin lead assignment with n8n](/blog/n8n-round-robin-lead-assignment).
4. The assigned rep receives a notification via Slack.
5. The row in the sheet is marked as "Imported".

The result: the time between a lead entering the sheet and landing in front of a sales rep drops from days to hours, duplicate cleanup almost entirely disappears, and source-based reporting becomes reliable for the first time.

For teams looking to outsource the list-building and campaign-execution side of outbound end to end, [SAAS Corner, which provides outbound sales and lead generation services tailored to B2B SaaS](https://saascorner.co), can systematically produce the lists that feed this workflow.

## Common mistakes

- **Using Sheets as a "database":** Sheets is an entry point; HubSpot should be the single source of truth. Make updates in the CRM, not in the spreadsheet.
- **Overwriting every field every time:** A job title or phone number that a sales rep updated in HubSpot can be overwritten by stale data from the sheet. Consider filling in only empty fields during updates.
- **Going live without testing:** Do your first run with a 5–10 row test sheet and, if possible, a HubSpot sandbox or test account.
- **Forgetting about KVKK (Turkey's personal data protection law):** Document the legal basis and source of the personal data you transfer. The "kaynak" (source) column is useful here as well.

## Frequently asked questions

### Do I need to know how to code to sync Google Sheets to HubSpot with n8n?

The basic workflow can be built entirely with drag-and-drop nodes. However, for data-cleaning steps like phone formatting or fixing Turkish characters, a short JavaScript snippet (Code node) makes the job much easier. Simply adapt the sample code in this post to your own column names.

### If the same person is added to the sheet twice, will a duplicate record be created in HubSpot?

Not if you use the HubSpot node's "Create or Update" operation, because it finds and updates the existing contact by email address. Still, the safest approach is to convert emails to lowercase and remove duplicates within the same run using the Remove Duplicates node.

### Does this workflow work with HubSpot's free plan?

Yes, creating, updating and associating contacts and companies can be done via the API on the free plan as well. As your needs for custom properties, advanced automation and reporting grow, upgrading to a paid plan may come into consideration.

### How often should the workflow run?

For live lists that are constantly being filled, a Schedule Trigger running once an hour offers a good balance for most teams. If you need to respond to incoming leads within minutes, you can use the Google Sheets Trigger with a shorter polling interval, or opt to capture leads directly from your form via webhook.

## Conclusion

Connecting your Google Sheets lead list to HubSpot with n8n may look like a simple workflow made up of a few nodes from a technical standpoint, but its impact on sales operations is significant. With the right sheet structure, a solid data-cleaning step, email-based upserts, domain-based company matching and status information written back to the sheet, leads reach your sales team without delay, clean and traceable. As you add layers like lead assignment, enrichment and automated notifications on top, this workflow becomes the backbone of your entire outbound process.

If you want to automatically connect your own lead lists to HubSpot, review your existing n8n workflows or design your CRM and outbound processes end to end, [get in touch with the Corner Group team](/en/contact), and let's design the right setup for your needs together.
