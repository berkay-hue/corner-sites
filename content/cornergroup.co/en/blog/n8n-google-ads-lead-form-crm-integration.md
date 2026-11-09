---
title: "Connect Google Ads Lead Forms to Your CRM with n8n"
description: "Step-by-step guide to syncing Google Ads lead form data to your CRM with n8n, plus common mistakes and a KVKK-compliant data flow."
date: "2026-11-09"
category: "Automation"
image: "https://images.pexels.com/photos/39205099/pexels-photo-39205099.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Connecting Google Ads lead forms to a CRM with n8n"
alt: "n8n-ile-google-ads-lead-formu-crm-baglama"
---

The most practical way to connect a Google Ads lead form to your CRM is to **add an n8n Webhook URL and a verification key to the form settings**. Every new form submission then reaches n8n within seconds. n8n validates the data, converts the fields into the format your CRM expects, and automatically creates the record in HubSpot, Pipedrive or Zoho CRM. You don't need an extra integration tool or a manual CSV download routine. A basic setup can be completed in a few hours.

In this post, we'll build the flow end to end: the Google Ads settings, the webhook and validation steps in n8n, data transformation, writing to the CRM, preventing duplicate records and sending instant notifications to the sales team. Our goal isn't just to "move leads into the CRM." It's to build a system where every record you paid for with ad spend is never lost, gets followed up quickly and can be measured.

## Why should Google Ads lead forms connect directly to your CRM?

Google Ads lead form assets let users leave their contact details without leaving the ad. Fields such as full name, work email, phone, company name and job title are often auto-filled from the user's Google account, so there's very little friction in completing the form. The problem is that, by default, these leads stay inside the Google Ads interface.

In many B2B teams, the process looks like this: a marketing specialist logs into Google Ads once or twice a week, downloads the leads as a CSV and uploads them to the CRM. This approach carries three serious costs:

- **Delay:** If a lead that came in on Monday doesn't reach the CRM until Thursday, the prospect may already have spoken to a competitor. We covered the impact of first response time on conversion in detail in our post on [the speed-to-lead approach and setting up automated responses with n8n](/blog/speed-to-lead-n8n-automated-lead-response).
- **Risk of data loss:** Google Ads only stores leads in the interface for a limited time. Data that isn't downloaded regularly can be lost.
- **Measurement blind spots:** With manual transfers, campaign, ad group and GCLID data usually doesn't make it into the CRM. That makes it impossible to see which campaigns actually drive sales.

An automated integration solves all three problems at once. The lead lands in the CRM the moment it arrives, is saved together with its source data, and a notification goes out to the sales team.

## Why n8n instead of Zapier?

There are several ways to connect Google Ads lead forms to a CRM. Some CRMs, such as HubSpot, offer native integrations. Tools like Zapier and Make can do the job too. Here's what makes n8n stand out:

- **Flexibility:** With the Code node, you can write JavaScript to transform data however you like. Flattening the nested data structure Google sends takes just a few lines.
- **Cost control:** When you run n8n on your own server (self-hosted), you don't pay per task. The difference becomes significant as lead volume grows.
- **Multiple destinations in a single flow:** You can write the same lead to your CRM, send a Slack notification, back it up to Google Sheets and pass it to an enrichment service.
- **Data sovereignty:** In a self-hosted setup, lead data passes through your own infrastructure. This makes it easier to document your processes for KVKK (Turkey's data protection law) compliance.

Native integrations may be enough for simple scenarios. But when you want to qualify leads, assign them to the right sales rep or run different actions per campaign, n8n gives you far more control.

## What do you need before you start?

Before you begin, make sure the following components are in place:

1. **A Google Ads account and a lead form asset:** A lead form set up in a Search, Video, Discovery/Demand Gen or Performance Max campaign.
2. **A running n8n instance:** n8n Cloud or n8n installed on your own server (Docker, VPS, etc.) and **accessible over HTTPS**. Google webhooks only send data to secure connections.
3. **CRM access:** A Private App token for HubSpot, an API token for Pipedrive or an OAuth connection for Zoho CRM.
4. **A notification channel (optional but recommended):** Slack, Microsoft Teams or email.
5. **A field mapping plan:** A simple table showing which CRM field each form question should be written to.

The last item is often skipped, yet it's the step that saves the most time. For example, if your form includes a custom question like "How many employees does your company have?", a matching field needs to exist in your CRM beforehand.

## What does Google Ads webhook data look like?

When a form is submitted, Google Ads sends a POST request in JSON format to your webhook URL. The structure looks roughly like this:

- `lead_id`: The lead's unique identifier
- `form_id`, `campaign_id`, `adgroup_id`, `creative_id`: Which form, campaign, ad group and ad the lead came from
- `gcl_id`: The Google Click ID, a critical value for offline conversion tracking
- `google_key`: The verification key you defined in the form settings
- `is_test`: Whether this is test data (true/false)
- `user_column_data`: The list of fields in the form. Each element contains `column_id` (e.g. FULL_NAME, EMAIL, PHONE_NUMBER, COMPANY_NAME, JOB_TITLE), `column_name` and `string_value`.

The tricky part is the `user_column_data` field. The data doesn't arrive as a flat object but inside an array. Before writing to the CRM, you need to convert this array into a flat structure like `{ email: "...", phone: "..." }`. We'll handle this transformation easily in n8n with a Code node.

## Step-by-step setup: connecting a Google Ads lead form to your CRM with n8n

### 1. Create a Webhook node in n8n

Open a new workflow and add a **Webhook** as the first node. The settings should be:

- **HTTP Method:** POST
- **Path:** A hard-to-guess path, for example `google-ads-lead-7f3k9`
- **Respond:** "Immediately" (Google wants to see that the request was received successfully; don't delay the response)
- **Authentication:** None (we'll validate with google_key)

n8n gives you two URLs: a **Test URL** and a **Production URL**. You'll use the Test URL for initial trials and the Production URL when you go live. If you forget to activate the workflow, the Production URL won't accept data. This is one of the most common mistakes.

### 2. Set up the webhook integration in Google Ads

In Google Ads, open the lead form asset for the relevant campaign and go to the **"Lead delivery" / "Webhook integration"** section:

1. Paste the n8n Test URL into the **Webhook URL** field.
2. Enter a strong, random key in the **Key** field (e.g. a 32-character string). This key will arrive as `google_key` with every request.
3. In n8n, click the "Listen for test event" button on the Webhook node.
4. In Google Ads, click the **"Send test data"** button.

Sample data should appear in n8n within a few seconds. This sample carries the value `is_test: true` and serves as a template while you build the subsequent nodes.

### 3. Validate the request with google_key

If your webhook URL somehow leaks, a malicious actor could flood your CRM with fake records. To prevent this, add an **IF node** right after the Webhook:

- **Condition:** `{{ $json.body.google_key }}` equals the key you defined
- **True output:** The flow continues
- **False output:** The flow stops and, if you wish, sends a security alert to Slack

Rather than hardcoding the key into the node, it's safer to store it in n8n's **environment variables** or **credentials**. If you have multiple forms, using a separate key for each one also makes it clear which form belongs to which flow.

### 4. Filter out test data

Use a second IF node to check the `is_test` value. Test data should not be written to the CRM, only logged. Otherwise, every test you run in production will pile up "Test User" records in your CRM and pollute your reports.

### 5. Flatten the data with a Code node

Now we'll convert the `user_column_data` array into a flat object. Add a **Code node** and apply the following logic:

```javascript
const body = $input.first().json.body;
const fields = {};

for (const col of body.user_column_data || []) {
  const key = (col.column_id || col.column_name || '').toLowerCase();
  fields[key] = (col.string_value || '').trim();
}

// Split full name
let firstName = fields.first_name || '';
let lastName = fields.last_name || '';
if (!firstName && fields.full_name) {
  const parts = fields.full_name.split(' ');
  lastName = parts.length > 1 ? parts.pop() : '';
  firstName = parts.join(' ');
}

// Normalize phone number (Turkey example)
let phone = (fields.phone_number || '').replace(/[^\d+]/g, '');
if (phone.startsWith('0')) phone = '+90' + phone.slice(1);

return [{
  json: {
    lead_id: body.lead_id,
    email: (fields.work_email || fields.email || '').toLowerCase(),
    first_name: firstName,
    last_name: lastName,
    phone,
    company: fields.company_name || '',
    job_title: fields.job_title || '',
    campaign_id: body.campaign_id,
    adgroup_id: body.adgroup_id,
    form_id: body.form_id,
    gclid: body.gcl_id,
    raw: fields
  }
}];
```

This step does three critical things:

- **Converts the email to lowercase.** Otherwise, "Ahmet@firma.com" and "ahmet@firma.com" could show up as two separate people in the CRM.
- **Splits the full name.** Google usually sends FULL_NAME, while CRMs expect first and last names separately.
- **Standardizes the phone number.** "0532 123 45 67" and "+905321234567" are the same number; they should be stored in a single format in the CRM.

Your custom questions (e.g. "Number of employees", "Budget range") appear in the `raw` object under their own column_name values. You can map these to custom fields in your CRM.

### 6. Back up the raw data

Before writing to the CRM, save the raw data to Google Sheets, Airtable or a Postgres table. This simple step serves two purposes: if the CRM API temporarily fails, the data isn't lost, and you can audit the integration's health by comparing the monthly lead count with the number shown in Google Ads.

### 7. Create or update the record in the CRM

The approach varies slightly depending on your CRM.

**HubSpot:**
- In the HubSpot node, select **Contact → Create or Update**. HubSpot matches automatically by email address: it updates the contact if it exists and creates it if it doesn't.
- Set the `lifecyclestage` field to "lead" and the `hs_lead_status` field to "NEW".
- Create custom contact properties for campaign ID, ad group and GCLID, and write these values to them.

**Pipedrive:**
- First, search by email with **Person → Search**.
- If the person doesn't exist, use **Person → Create**; if they do, use the existing ID.
- Then open a lead in the Leads Inbox with **Lead → Create** and link it to the person. If a company name was provided, also create an **Organization** record and associate it.

**Zoho CRM:**
- Use the **Lead → Create or Update (Upsert)** operation. Select email as the matching criterion.
- Set the `Lead_Source` field to "Google Ads – Lead Form" and write the campaign details to custom fields.

Whichever CRM you use, **tagging the lead source with a consistent value** is the foundation of reporting. Variations like "Google Ads", "google ads" and "GAds" will break your source-based reports down the line.

### 8. Send instant notifications to the sales team

Once the CRM record is created, add a **Slack** (or Teams) node. The message should include:

- Full name, company, job title
- Phone and email
- Which campaign the lead came from
- A direct link to the CRM record

Rather than posting the notification to a general channel, assigning the lead directly to a sales rep is far more effective. To do this, you can append the setup from our [round-robin lead assignment with n8n](/blog/n8n-round-robin-lead-assignment) guide to the end of this flow. Each lead is then assigned to a sales rep in turn and marked as the record owner in the CRM.

### 9. Go live and test

1. Switch the workflow to **Active**.
2. Replace the webhook URL in Google Ads with the **Production URL**.
3. Try again with "Send test data". If the test filter is working correctly, the record should not reach the CRM, only be logged.
4. If possible, find the ad on your own phone, fill out a real form and observe the flow end to end.

## A concrete scenario: a B2B software company

To illustrate how the flow works in practice, let's consider a hypothetical example. A B2B SaaS company runs a Search campaign targeting the keyword "pre-accounting software," and its lead form asks for full name, work email, phone, company name and the question "How many employees do you have?" Let's assume around 200 leads come in per month.

**Before automation:** The marketing specialist downloads leads every Friday, and the sales team starts calling on Monday. The average time to first contact is 3–4 days. The weekly download and cleanup work takes about 1.5 hours, or 6 hours a month. Because campaign data isn't carried into the CRM, nobody knows which keyword group drives sales.

**After automation:**
- The lead is created in the CRM a few seconds after the form is submitted.
- Leads with "50+ employees" are separated with an IF node and routed to a senior sales rep, while the rest are distributed to the team via round-robin.
- Sales reps can call as soon as they receive the Slack notification; time to first contact drops to minutes.
- The 6 hours of monthly manual work disappears.
- Thanks to the campaign field in the CRM, three months later the team can report which ad groups turned into closed deals and shift budget accordingly.

The most valuable gain in this example is usually not the time saved but **establishing the link between campaigns and sales**. Google Ads tells you "200 leads"; your CRM tells you how many of them turned into real opportunities and revenue.

## Taking the flow a step further: enrichment and scoring

Once the core flow is running, two additional layers make a significant difference.

**Enrichment:** Google encourages keeping forms short, so you often only have a name, an email and a company name. Starting from the domain of the work email, you can automatically add details such as the company's industry, employee count and website. We explained how to set this up step by step in our [B2B lead enrichment automation with n8n guide](https://cornergroup.co/blog/n8n-ile-b2b-lead-zenginlestirme-otomasyonu-rehberi-verimliligi-artirin).

**Scoring:** With enriched data, you can assign each lead a score. For example, a lead whose title is "General Manager" or "CFO," whose company exceeds a certain employee threshold and who operates in a target industry gets a high score and is called first. A lead that comes in with a personal Gmail address and a blank company name, on the other hand, is first warmed up with an automated email. For an AI-powered approach, take a look at our [AI-powered B2B lead scoring guide](https://cornergroup.co/blog/ai-ile-b2b-lead-skorlama-potansiyel-musteri-degerini-artirma-rehberi).

With these two layers in place, your Google Ads lead form evolves from a raw contact list into a prioritized stream of sales opportunities.

## What are the most common mistakes?

Here are the typical issues teams run into when setting up this integration:

- **Not activating the workflow:** Everything works with the Test URL, but no data arrives once you go live. The reason: the workflow isn't active, or the Test URL is still set in Google Ads.
- **A server without HTTPS:** Running self-hosted n8n without an SSL certificate means the webhook never fires.
- **Skipping validation:** A webhook without a google_key check is an open door.
- **Duplicate records:** If the same person fills out forms from two different campaigns and you use "create" instead of "upsert," you'll end up with duplicate records in the CRM.
- **Forgetting to configure each form:** The webhook setting lives at the lead form asset level. Forgetting to set up the webhook when a new campaign and form are launched means that campaign's leads silently pile up in the Google Ads interface.
- **No error monitoring:** If the CRM API fails one day and nobody notices, that day's leads are lost. Setting up an **Error Workflow** in n8n to send an alert to Slack or email when something fails is essential.
- **Overlooking KVKK:** A privacy policy link is mandatory on the lead form. In addition, the purpose for which data transferred to the CRM is processed must be clearly stated in your privacy notice.

## How much does it cost?

The cost breaks down into three items:

1. **n8n:** The self-hosted Community edition is free; you only pay for the server. A small VPS is generally sufficient for this flow. If you choose n8n Cloud, you'll pick one of the plans priced by monthly executions. Since only one workflow runs per lead, a volume of a few hundred leads per month fits comfortably within entry-level plans.
2. **CRM:** HubSpot's free CRM and the entry-level plans of Pipedrive and Zoho offer API access. It's worth checking the API usage limits on your plan.
3. **Setup effort:** For someone familiar with n8n, the core flow (webhook, validation, transformation, CRM, notification) takes between half a day and a full day. With enrichment, scoring and lead assignment layers, this can stretch to a few days.

For comparison, consider this: when you add up the monthly hours spent on manual transfers, the opportunities lost to delays and the campaign performance you can't measure, the integration usually pays for itself within the first few months.

## Measurement: a closed loop from campaign to revenue

The real value of the integration emerges when you feed sales outcomes from your CRM back into Google Ads. That's why you write the GCLID to the CRM.

Here's how the flow works: when a lead moves to the "Opportunity" stage in the CRM or a deal is marked "Won," n8n captures that change (via a CRM webhook or periodic polling). It then sends it to Google Ads as an **offline conversion**, together with the relevant GCLID and conversion value. As a result, Google's smart bidding strategies start targeting people who resemble those who **actually buy**, not just those who "fill out a form."

In B2B, this difference can be critical. A campaign that brings in lots of low-quality leads may look successful in the dashboard while wasting your sales team's time. Offline conversion data ensures budget shifts toward campaigns that deliver qualified leads.

For B2B SaaS companies looking to scale ad-driven inbound leads alongside an outbound sales engine, [SAAS Corner's outbound sales and lead generation service](https://saascorner.co) helps unify both channels in a single pipeline.

## Frequently asked questions

### Do I need coding skills to connect a Google Ads lead form to n8n?

Most of the core flow is built with n8n's visual nodes. The only place that requires code is a short JavaScript snippet that flattens the `user_column_data` array, and the example in this post can be adapted directly. Teams with limited technical knowledge usually get through this step smoothly by using it as a template.

### Will leads be lost if the webhook connection drops?

Google Ads stores leads in the interface for a certain period. So if the connection drops temporarily, you can recover the data by downloading it manually. Still, to reduce the risk, we recommend setting up an Error Workflow in n8n and backing up raw data to a separate table before it reaches the CRM. Comparing lead counts in Google Ads and your CRM weekly also helps catch silent failures early.

### Do I need a separate workflow for each campaign and form?

No. All forms can send data to the same webhook URL. Inside n8n, you can route them into different branches with a Switch node based on the `form_id` or `campaign_id` value. However, you do need to configure the webhook setting on each lead form asset separately; adding this step to your checklist for newly created forms is good practice.

### Why would I need n8n when HubSpot has a native Google Ads integration?

The native integration may be enough to move leads into the CRM. But when you want to combine steps like phone normalization, routing based on custom questions, enrichment, scoring, round-robin assignment and Slack notifications in a single flow, n8n is far more flexible. It also lets you control your entire lead flow from one place if you manage multiple CRMs or brands.

## Conclusion

Connecting Google Ads lead forms to your CRM with n8n is an automation that isn't technically complex but has a direct impact on sales results. Once you set up real-time data flow via webhook, leads are no longer lost and the sales team can act within minutes. And because every record is written to the CRM along with its campaign data, it becomes clear which part of your ad budget is turning into revenue. If you pay attention to details such as validation, duplicate checks and error monitoring, the system runs with virtually no maintenance once it's set up.

The next step is to turn this flow into a full revenue engine with enrichment, scoring and offline conversion tracking. If you want to connect your Google Ads leads to your CRM, align your n8n automations with your sales processes, or bring your inbound and outbound channels together in a single pipeline, [get in touch with the Corner Group team](/en/contact). Let's design the setup that fits you best, together.
