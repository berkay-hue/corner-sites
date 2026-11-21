---
title: "Contract Renewal Reminders with n8n: Step-by-Step Setup"
description: "Learn how to build an n8n workflow that automates contract renewal reminders, assigns owners and tracks follow-ups so B2B teams never miss a renewal date."
date: "2026-10-30"
category: "Automation"
image: "https://images.pexels.com/photos/8730969/pexels-photo-8730969.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Contract renewal reminder workflow with n8n: step-by-step setup"
alt: "n8n-sozlesme-yenileme-hatirlaticisi-kurulum"
---

To set up a contract renewal reminder with n8n, you build a workflow that reads contract end dates from your CRM or spreadsheet every day, calculates the number of days remaining, and automatically notifies the relevant account manager, the customer and, if needed, a manager at the thresholds you define (for example, 90, 60, 30 and 7 days out). The core components of this workflow are a **Schedule Trigger**, a data source node (HubSpot, Pipedrive, Zoho or Google Sheets), a **Code** node that handles the date calculations, a **Switch** node that branches by threshold, and your notification channels (Slack, email, CRM tasks). Set up correctly, it ensures not a single renewal date slips through the cracks, and renewal conversations get planned months in advance instead of being crammed into the final week.

In B2B companies, a significant share of revenue comes from existing customers. Yet on most teams, renewals still depend on an account manager's memory, scattered calendar notes or an Excel file that gets updated once a month. In this post, we walk you step by step through building a contract renewal reminder in n8n from scratch: which nodes to use and in what order, how to bring AI into the workflow, and how to avoid the most common mistakes.

## Why do you need a contract renewal reminder?

Renewal processes usually break down quietly. The contract end date approaches, the account manager is busy with new sales opportunities, the decision-maker on the customer side has changed, and nobody notices. A rushed call one week before the contract expires sends the customer the message: "We only remember you when it's time to pay."

An automated reminder solves the following problems:

- **Lack of visibility:** Everyone sees at the same time which contracts will expire in the next 90 days.
- **Late conversations:** The renewal conversation starts before the customer's budget planning period.
- **Opportunity to update pricing:** There is enough time left to propose a price increase or a plan upgrade.
- **Auto-renewal risks:** If the contract has a termination notice period (for example, written notice 30 days in advance), that date is tracked as well.
- **Clear ownership:** Every renewal is assigned to one person, so it's clear who does what.

Especially for SaaS companies with subscription models, agencies and consultancies that sign annual service contracts, this automation is one of the workflows that pays for itself the fastest.

## What does the workflow architecture look like?

Before we get into the setup, let's clarify the big picture. The structure we recommend consists of seven layers:

1. **Trigger:** A Schedule Trigger that runs every business day at 08:30.
2. **Data retrieval:** A node that pulls the list of active contracts from the CRM.
3. **Calculation:** A Code node that calculates the days remaining for each contract and which threshold it falls on.
4. **Filtering:** An IF/Filter node that only passes through records that hit a threshold today.
5. **Branching:** A Switch node that routes records to different actions based on threshold and contract value.
6. **Actions:** Slack notification, CRM task, email to the customer, escalation to a manager.
7. **Logging and error handling:** Logging the reminders that were sent and alerting in case of errors.

This architecture works the same way for a single contract as it does for five hundred. The only thing that changes as you scale is the need for pagination in the data retrieval step.

## What do you need before setup?

The preparation phase is more critical than the setup itself. Don't open n8n until you've completed the following:

- **A single source of truth:** Contract end dates should be stored in one place. If you use HubSpot, create a custom property on the deal or company object (for example, `contract_end_date`). In Pipedrive, you can use a custom date field on the deal; in Zoho, use Deals or a custom Contracts module.
- **Required fields:** Every contract record should include at least the following: customer name, contract end date, annual contract value, account manager (owner), customer-side contact person and their email, whether it auto-renews, and the termination notice period (in days).
- **Threshold decision:** Decide as a team on which days reminders will go out. A common setup is 90, 60, 30, 14 and 7 days.
- **Channel decision:** Will internal notifications go to Slack or Microsoft Teams, or to email? Will automated emails go to the customer, or will only the internal team be alerted?
- **n8n environment:** An n8n Cloud account or a self-hosted installation running on your own server. Be sure to set the Timezone to Europe/Istanbul; otherwise, the trigger will run at unexpected times.

If your CRM's pipeline and field structure isn't settled yet, we recommend first checking out [our step-by-step guide to setting up a sales pipeline in HubSpot](https://cornergroup.co/blog/hubspot-satis-pipeline-kurulumu-adim-adim-rehber). Renewal automation shows its true value when it's built on top of a clean CRM structure.

## Step-by-step setup

We walk through the steps below using HubSpot; if you use Pipedrive, Zoho or Google Sheets, you only need to swap out the data retrieval node.

### Step 1: Configure the Schedule Trigger

Create a new workflow and add a **Schedule Trigger** as the first node.

- **Trigger Interval:** Days
- **Days Between Triggers:** 1
- **Trigger at Hour:** 8
- **Trigger at Minute:** 30

If you don't want to send notifications on weekends, you can use the "Custom (Cron)" option with the expression `30 8 * * 1-5`. In that case, we'll make a small adjustment to the calculation in Step 3 so that thresholds falling on weekends aren't missed.

### Step 2: Pull contract data from the CRM

Add a **HubSpot** node and configure the following settings:

- **Resource:** Deal
- **Operation:** Search
- **Filter:** Records where the `contract_end_date` field is greater than today **and** less than 91 days from today
- **Properties:** dealname, amount, hubspot_owner_id, contract_end_date, auto_renewal, notice_period_days

It's important to apply the filter directly on the API side. Pulling all deals and filtering them inside n8n is both slow and needlessly eats into your API limits. If you have a large number of records, enable the "Return All" option to let n8n handle pagination.

If you use Google Sheets, select the "Get Row(s)" operation in the **Google Sheets** node and make sure the date column in your sheet uses a consistent format (preferably YYYY-MM-DD). Inconsistent date formats are the most common source of errors in workflows like this.

### Step 3: Calculate the days remaining

Add a **Code** node and select "Run Once for All Items" mode. The Luxon library comes built into n8n's Code node, which makes date calculations quite easy:

```javascript
const thresholds = [90, 60, 30, 14, 7];
const today = DateTime.now().setZone('Europe/Istanbul').startOf('day');
const results = [];

for (const item of $input.all()) {
  const p = item.json.properties || item.json;
  if (!p.contract_end_date) continue;

  const endDate = DateTime.fromISO(p.contract_end_date, { zone: 'Europe/Istanbul' }).startOf('day');
  const daysLeft = Math.round(endDate.diff(today, 'days').days);

  const noticeDays = Number(p.notice_period_days || 0);
  const noticeDeadline = noticeDays > 0 ? daysLeft - noticeDays : null;

  const matchedThreshold = thresholds.find(t => t === daysLeft) || null;

  results.push({
    json: {
      dealId: item.json.id,
      dealName: p.dealname,
      amount: Number(p.amount || 0),
      ownerId: p.hubspot_owner_id,
      endDate: endDate.toFormat('dd.MM.yyyy'),
      daysLeft,
      matchedThreshold,
      autoRenewal: p.auto_renewal === 'true',
      noticeDeadline
    }
  });
}

return results;
```

For each contract, this code calculates the days remaining, the matching threshold and the days left until the termination notice deadline. If you're skipping weekends, you can replace the `t === daysLeft` match with a range check: on Mondays, accept cases where `daysLeft` equals `t`, `t-1` or `t-2` so you also catch thresholds that fell on Saturday and Sunday. The logging mechanism in Step 7 guarantees that the same reminder isn't sent twice.

### Step 4: Pass through only the relevant records

Add a **Filter** node and set the condition that `matchedThreshold` is not empty. You may also want to pass through records where `noticeDeadline` is between 0 and 7; this lets you catch the final week in which the customer can exercise their right to terminate an auto-renewing contract. That date is the most critical moment for the account manager to get in touch with the customer.

For example, if you have 40 contracts expiring in the next 90 days, only 2–4 records will pass through this filter on a typical day. That is exactly what prevents notification fatigue.

### Step 5: Branch by threshold and value

Add a **Switch** node. Each threshold calls for a different action:

- **90 days:** Slack notification to the account manager and a "Renewal preparation" task in the CRM. Review the customer's usage data and prepare a value summary.
- **60 days:** A task to schedule a renewal/review meeting with the customer; optionally, a personalized "annual review" invitation to the customer.
- **30 days:** The threshold by which the proposal should have been sent. If it hasn't been sent, notify the manager.
- **14 days:** If the proposal still hasn't been signed, escalate to the sales manager.
- **7 days:** Critical alert; notify both the account manager and the manager, and the finance team if necessary.

It also makes sense to add a second split based on contract value. For example, for contracts whose annual value exceeds a certain threshold, you can loop in the manager directly at the 90-day mark, while keeping the process lighter for lower-value contracts. You can easily set this up with an **IF** node after the Switch that checks the `amount` field.

If you'd also like to automate the renewal proposal, you can connect the 30-day branch to the workflow described in [our guide to automating the B2B proposal process with n8n](/blog/automate-b2b-quote-process-n8n). That way, the proposal draft lands in front of the account manager ready to go.

### Step 6: Create notifications and tasks

Add the necessary action nodes for each branch:

**Slack notification:** In the **Slack** node, select the "Send Message" operation. To reach the account manager's Slack user ID, you can use a small lookup table that maps CRM owner IDs to Slack IDs (in Google Sheets or as a static object in a Code node within n8n). Sample message:

> 🔔 The **Acme Teknoloji** contract expires in 30 days (15.07.2025). Annual value: 120,000 TL. Auto-renewal: No. The proposal status doesn't appear to have been updated in the CRM. Action is recommended today.

**CRM task:** In the **HubSpot** node, use the "Engagement" or "Task" resource to create a task linked to the relevant deal and assigned to the account manager. Set the task's due date a few days out depending on the threshold (for example, 7 days later for the 90-day threshold).

**Customer email (optional):** You can send an email to the customer's contact person using the **Gmail** or **Send Email** node. However, we recommend keeping this step turned off for the first few weeks and enabling it only once you're sure the internal notifications are working correctly. A renewal email with the wrong date going to a customer is more damaging than no email at all.

If you'd like to take a broader look at internal notification design, [our guide to automation in B2B sales team communication with n8n](https://cornergroup.co/blog/n8n-ile-b2b-satis-ekibi-i-letisiminde-otomasyon-verimlilik-rehberi) offers practical examples of channel selection and message formatting.

### Step 7: Log the reminders you send

Sending the same reminder twice annoys both your team and your customer. To prevent this, create a simple log table. Google Sheets, Airtable or n8n's built-in **Data Tables** feature are all sufficient for the job. The table should include the following columns: dealId, threshold, sent date, channel.

In the workflow, check this table **before** the actions: if the same dealId and threshold combination already exists, skip the record. **After** the actions, add a new row. n8n's **Remove Duplicates** node, with its "Remove Items Processed in Previous Executions" option, can also be used for this purpose; you can generate a key that combines dealId and threshold and deduplicate based on that key.

### Step 8: Set up error handling

The most dangerous state for an automation is when it silently stops working. When your CRM API key expires or a field name changes, the workflow fails, and nobody may notice.

Create a separate workflow and add an **Error Trigger** as the first node. Link this workflow in the "Error Workflow" field of the main workflow's settings. When an error occurs, have a notification sent to the person responsible for operations via Slack or email. In addition, sending a weekly summary message such as "X reminders were sent this week" shows everyone that the workflow is alive.

## Which timing setup works best?

There's no single right answer; the right setup depends on your sales cycle and customer profile. Still, we can outline a general framework:

- **High-value enterprise customers:** 120, 90, 60, 30, 14 days. With enterprise customers, procurement and legal approvals take a long time; a renewal process that starts 30 days out often doesn't make it in time.
- **Mid-sized customers:** 90, 60, 30, 7 days.
- **Monthly or low-value subscriptions:** 30 and 7 days; here, reminders are mostly the responsibility of the customer success team.

For contracts with a termination notice period, the truly critical date is not the contract end date but **the last day to give notice of termination**. For example, with an auto-renewing contract that has a 30-day termination notice period, the customer must have made their decision 31 days before expiry. That's why, for these contracts, it's more accurate to calculate thresholds based on the notice deadline.

## How do you bring AI into this workflow?

Once the basic reminder is running, you can enrich the workflow with AI. With n8n's **AI Agent** or **OpenAI / Anthropic** nodes, you can set up scenarios like these:

- **Account summary generation:** At the 90-day threshold, send the latest CRM notes, support tickets and meeting records to a language model to prepare a "what's happened with this customer over the past year" summary for the account manager. This significantly cuts the account manager's prep time.
- **Personalized email drafts:** At the 60-day threshold, generate a draft invitation email for the review meeting based on the customer's industry and the features they use. The draft isn't sent directly; it's submitted to the account manager for approval.
- **Risk signal extraction:** Analyze the tone of recent support tickets and add a "this customer seems dissatisfied" warning to the notification.

If you'd like to explore risk signals in more depth, you can combine the scoring approach from our post on [automating at-risk customer detection in B2B CRM with n8n](https://cornergroup.co/blog/n8n-ile-b2b-crm-de-riskli-musteri-tespiti-otomasyonu) with your renewal reminder. The renewal reminder for a customer flagged as at-risk should go out earlier, and to a more senior person, than for a regular customer.

There are two points to keep in mind when using AI: evaluate which model you're sending customer data to from a KVKK (Turkish personal data protection law) perspective, and never send any AI-generated text to a customer without human approval.

## How much does it cost?

The cost of this automation consists of three items:

- **n8n license:** You can use the self-hosted Community Edition for free; you only pay for the server (a small cloud server is sufficient). On n8n Cloud, plans are priced by the number of monthly executions. This workflow, running once a day, uses roughly 22–30 executions per month, which means even the most entry-level plans are more than enough for it.
- **AI API cost:** Since model calls are only made for contracts that hit a threshold, monthly usage generally stays low. Generating one summary each for an average of 3 records per day comes to roughly 60–90 model calls per month.
- **Setup time:** If your CRM data is clean, an experienced person can build and test the basic workflow in one business day. Once you add the AI layer, escalation rules and reporting, this extends to a few days. Most of the time is usually spent cleaning up missing and inconsistent date fields in the CRM.

On the other side of the equation, missing even a single renewal can mean lost revenue far exceeding these costs.

## What are the most common mistakes?

These are the mistakes we see most often in the field:

1. **Timezone errors:** If the n8n server runs on UTC but the date calculation isn't done in Turkey time, records close to midnight end up shifted by one day.
2. **Empty date fields:** Contracts without an end date silently drop out of the workflow. Sending account managers a weekly list of "active customers with missing dates" solves this problem.
3. **Notification fatigue:** Sending a "40 contracts expire in the next 90 days" message every day leads the team to start ignoring notifications within a few weeks. Send notifications only on threshold days, and only to the relevant person.
4. **Not updating the date of a renewed contract:** If the new end date isn't entered into the CRM when the customer renews, the workflow keeps sending reminders based on the old date. Setting up a second small workflow that automatically moves the end date forward by one year when the deal moves to the "Closed Won" stage eliminates this risk.
5. **Ownerless records:** When an account manager leaves the company, their records become ownerless. Automatically route notifications for records whose owner field is empty or belongs to an inactive user to the sales manager.

## How do you measure success?

After setting up the automation, track the following metrics to measure its impact:

- **On-time renewal initiation rate:** The percentage of contracts for which a review meeting was held 60 days out.
- **Gross and net revenue retention (GRR / NRR):** The impact of renewals and plan upgrades on revenue.
- **Number of renewals left to the final week:** A steadily declining number shows that the process has taken hold.
- **Price update rate at renewal:** Conversations that start early create a better foundation for discussing price updates. To strengthen the pricing side, it's also worth reviewing value-based pricing approaches.

Automatically reporting these metrics monthly to a Slack channel or a management dashboard can also be done with n8n. To see where the renewal process fits within your overall customer success strategy, [our guide to automating B2B customer success processes with n8n](https://cornergroup.co/blog/n8n-ile-b2b-musteri-basarisi-sureclerini-otomatiklestirme-rehberi) is a good complementary resource.

If you want to make renewals part of a data-driven sales operation alongside new customer acquisition, our group's [Sales Corner team, which provides data-driven B2B sales and lead generation services](https://salescorner.co), offers support with pipeline management and sales methodologies.

## Frequently asked questions

### Do I need coding skills to set up a contract renewal reminder with n8n?

The basic workflow can largely be built with drag-and-drop nodes. Using a short Code node for the date calculation makes things easier, but the same calculation can also be done with n8n's Date & Time node and expressions. As you add the AI layer and custom escalation rules, JavaScript knowledge becomes an advantage.

### Which CRMs does it work with?

n8n has ready-made nodes for HubSpot, Pipedrive, Zoho CRM, Salesforce and Google Sheets. If you use a system without a ready-made node, you can access the data with the HTTP Request node as long as it has an API. What matters is that the contract end date is stored in a consistent field in that system.

### Is it a good idea to send automated renewal emails to customers?

For low-value, standard contracts, automated informational emails can work well. For high-value and enterprise customers, however, it's better for the email to go out in the account manager's name and with their approval. We recommend turning on only internal notifications at first and enabling customer emails once the workflow has proven reliable.

### How do I prevent the same reminder from being sent more than once?

Log every reminder you send in a log table along with the contract ID and threshold, and check this table before taking action. n8n's Remove Duplicates node can also be used to filter out records processed in previous executions. This check is a lifesaver, especially when you re-run the workflow manually.

## Conclusion

A contract renewal reminder is one of the simplest automations you can build with n8n, yet one with the most direct impact on revenue. A daily trigger, a clean date field, a days-remaining calculation, threshold-based branching and notifications that reach the right person: when these five components come together, your renewal process no longer depends on people's memory and becomes a predictable operation. Layer on AI-powered account summaries, risk signals and automated reporting, and your team will go into renewal conversations far better prepared.

If you want to build a renewal automation that fits your CRM structure, connect your existing workflows with n8n, or automate your sales and customer success processes end to end, [get in touch with the Corner Group team](/en/contact), and let's design the setup that fits your needs together.
