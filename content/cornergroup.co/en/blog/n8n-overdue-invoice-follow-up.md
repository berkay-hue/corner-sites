---
title: "Automate Overdue Invoice Follow-Up with n8n"
description: "Manually chasing overdue invoices hurts cash flow. Learn how to build an automated reminder and escalation workflow in n8n, step by step."
date: "2026-11-04"
category: "Automation"
image: "https://images.pexels.com/photos/4872034/pexels-photo-4872034.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Automating overdue receivables follow-up with n8n"
alt: "n8n-ile-vadesi-gecen-tahsilat-takibi"
---

Automating overdue receivables follow-up with n8n means building a workflow that scans the open invoices in your accounting software or CRM at a set time every day, sends customers tiered reminders based on how many days overdue they are, and alerts the right people about receivables that cross a critical threshold. This setup eliminates manual Excel tracking and forgotten reminder emails, so your team only deals with receivables that actually need attention. Setup usually takes a few days. Thanks to n8n's built-in scheduler, HTTP requests, conditional routing, and email and messaging integrations, it runs without any additional collections software.

In B2B companies, a large share of cash flow problems doesn't come from customers being unwilling to pay. The real causes are invoices that never reach the right person, invoices forgotten during the payment approval process, or simply nobody sending a reminder on time. In this post, we explain how to build an end-to-end collections follow-up automation with n8n. We cover what data you need, how to design the workflow node by node, how to structure your reminder schedule, and common mistakes, all with concrete examples.

## Why shouldn't overdue receivables be tracked manually?

In many growth-stage B2B companies, collections follow-up works like this: once a week, someone on the finance team exports open invoices from the accounting system, filters the overdue ones in Excel, and writes emails one by one. That works with 15–20 customers. Once you pass 100 customers, three core problems emerge:

- **Inconsistency:** Some customers get a reminder three days after the due date, while others don't get one even after three weeks. Follow-up depends on how busy the team is that week.
- **Lack of visibility:** The sales team may prepare a new expansion proposal without knowing the customer has two unpaid invoices. The account manager doesn't know they should raise the issue in their weekly meeting with the customer.
- **Relationship risk:** The same customer may receive messages in different tones from both finance and sales, which comes across as unprofessional.

Automation solves all three problems at once. Every invoice is tracked by the same rules, everyone involved is informed on time, and customer communication stays within a single, standard framework.

## How does automated collections follow-up work?

A collections follow-up system built with n8n essentially consists of five layers:

1. **Trigger:** A scheduler that starts the workflow at a set time every business morning (for example, 09:00).
2. **Data collection:** Pulling open invoices from your accounting software, ERP, payment provider, or CRM.
3. **Calculation and segmentation:** Calculating how many days each invoice is overdue and grouping invoices by days overdue, amount, and customer segment.
4. **Action:** Emailing the customer, notifying the account manager via Slack or Teams, creating a task in the CRM, and escalating to a manager when a threshold is crossed.
5. **Logging and feedback:** Recording every reminder sent and automatically stopping the sequence once payment arrives.

This architecture is quite similar to the [contract renewal reminder setup with n8n](/blog/n8n-contract-renewal-reminder) we covered earlier. The difference is that here the date lies in the past, and the tone of communication shifts gradually as the delay grows.

## What data do you need before setup?

Before you start building the workflow, make sure your data source reliably provides the fields below. An automation built on incomplete or incorrect data can do more harm than manual tracking. Sending a reminder for an invoice that has already been paid is one of the fastest ways to lose a customer's trust.

**Required fields:**

- Invoice number
- Customer name and unique customer ID
- Invoice amount and currency
- Invoice date and due date
- Payment status (unpaid, partially paid, paid)
- Outstanding balance
- Email address of the billing contact (usually accounting or procurement)

**Recommended additional fields:**

- Name of the account manager or sales rep
- Customer segment (for example, strategic, standard, small business)
- Promised payment date, if a payment commitment was made
- Dispute status
- Date of last reminder

If you keep these fields in your CRM, clean records are critical. Duplicate records for the same company and outdated billing contacts are common problems. Our [guide to automatically cleaning and enriching CRM data with AI](https://cornergroup.co/blog/yapay-zeka-ile-crm-verilerini-otomatik-temizleme-ve-zenginlestirme-rehberi) is a good starting point here.

## How do you build the n8n workflow step by step?

The setup below assumes a scenario where accounting data can be retrieved via API, notifications go to Slack, and reminders are sent by email. If your accounting software doesn't have an API, you can build the same structure on top of Google Sheets or a database table.

### 1. Daily trigger with Schedule Trigger

Start the workflow with a **Schedule Trigger** node. Set it to run every weekday at 09:00. Not running on weekends matters: in B2B, a payment reminder that arrives on a Saturday morning is usually read by no one and gets buried among other emails in Monday's inbox.

Tip: If you also want to exclude public holidays, you can add a simple **IF** node at the start of the workflow that checks against a list of holiday dates.

### 2. Pulling open invoices

Use an **HTTP Request** node to pull invoices with a payment status of "unpaid" or "partially paid" from your accounting software's API. Rather than pulling every invoice and filtering inside n8n, filtering in the API query is faster and reduces the risk of hitting API limits.

If the system you use has a ready-made n8n integration (some accounting and payment platforms have built-in nodes, for example), you can use that node directly instead of HTTP Request.

### 3. Calculating days overdue

Add a **Code** node to calculate the number of days overdue for each invoice and assign a reminder tier. Sample JavaScript logic might look like this:

```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);

return items.map(item => {
  const dueDate = new Date(item.json.due_date);
  dueDate.setHours(0, 0, 0, 0);
  const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

  let tier = 'not_due';
  if (daysOverdue === -3) tier = 'pre_reminder';
  else if (daysOverdue === 1) tier = 'tier_1';
  else if (daysOverdue === 7) tier = 'tier_2';
  else if (daysOverdue === 15) tier = 'tier_3';
  else if (daysOverdue === 30) tier = 'tier_4';
  else if (daysOverdue > 30 && daysOverdue % 15 === 0) tier = 'escalation';

  return { json: { ...item.json, daysOverdue, tier } };
});
```

The key point here is that the tiers are defined with "equals" checks. This way, the customer receives a message only on the specified days, not every day. When the workflow runs on day 8, it won't message an invoice that already received its day-7 reminder.

However, this approach has a weakness: if the workflow fails to run on a given day for any reason, that day's reminder is skipped. A more robust method is to store the "last tier sent" for each invoice and check with logic like "days overdue has passed 7 and tier 2 hasn't been sent yet." We cover this in step 9.

### 4. Exclusion filters

Use a **Filter** node to remove the following invoices from the flow:

- Invoices flagged as disputed
- Invoices with a payment commitment whose promised date hasn't passed yet
- Invoices with an outstanding balance below a set threshold (for example, small residuals caused by exchange rate differences)
- Receivables handed over to legal collection

This filter is the most overlooked part of the automation, yet it prevents the most problems. Sending an automated "your payment is overdue" email to a customer in the middle of a dispute can easily escalate an issue that's in the process of being resolved.

### 5. Routing by tier

Use a **Switch** node to route invoices to different branches based on their tier value. Each branch will trigger a different set of actions. You may also want a second split by customer segment: for strategic customers, it may be better for the account manager to make the first contact personally instead of sending an automated email.

### 6. Reminder email to the customer

In each tier branch, send the customer a reminder with a **Send Email** node or a Gmail/Outlook node. The email must include:

- Invoice number and date
- Amount and outstanding balance
- Due date
- Payment details (IBAN, payment link, etc.)
- The invoice as a PDF attachment or a download link
- The name and direct contact details of the person to reach if there's an issue

Sending the email from a personal address, such as under the name of a specific person on the finance team, generally gets more replies than messages sent from "noreply" addresses.

### 7. Internal team notification

In the same branch, use a **Slack** node to inform the account manager. A sample message format:

> ⚠️ *ABC Teknoloji* — Invoice #2024-118, 48,000 TL, **15 days** overdue. The 3rd reminder was sent today. If you're meeting with the customer this week, we recommend putting this on the agenda.

This notification closes the information gap between sales and finance. For a broader framework on designing internal team notifications, check out our [guide to automation in B2B sales team communication with n8n](https://cornergroup.co/blog/n8n-ile-b2b-satis-ekibi-i-letisiminde-otomasyon-verimlilik-rehberi).

### 8. Creating CRM tasks and escalating

From tier 3 onward, a notification alone may not be enough. Use a HubSpot, Pipedrive, or Zoho node to assign the account manager a task with a deadline: "Call ABC Teknoloji about the overdue payment." At tier 4 (30 days) and beyond, send a summary escalation email to the finance manager and the sales director.

It's also useful to add an "overdue payment" tag to the company record in the CRM, so the sales team sees the situation when preparing a new proposal for this customer. This tag can also serve as one of the inputs for a more comprehensive risk scoring setup, such as [at-risk customer detection automation in your CRM with n8n](https://cornergroup.co/blog/n8n-ile-b2b-crm-de-riskli-musteri-tespiti-otomasyonu).

### 9. Logging and preventing duplicate sends

After each send, write the following to a Google Sheets row or a database table: invoice number, tier sent, send date, recipient email address. Read this table at the start of the workflow to prevent the same tier from being sent to the same invoice twice.

This log also creates a valuable audit trail. When a customer says "we never received a reminder," you can show within seconds what was sent, to which address, and on what date.

### 10. Stopping the sequence when payment arrives

If your payment provider or bank supports webhooks, set up a separate n8n workflow that listens for payment notifications. When a payment comes in, update the invoice status, send a "payment received" notification to the relevant account manager in Slack, and optionally send the customer a short thank-you email. If webhooks aren't supported, paid invoices automatically drop out of the flow on the next run, since the daily workflow only pulls open invoices. Still, to avoid a scenario where a customer pays in the morning and receives a reminder in the afternoon, it's good practice to add a final status check right before sending.

## How should you structure the reminder schedule?

Every company has different payment terms and customer profiles. Still, here's a tiered structure that commonly works well in B2B:

- **3 days before the due date (pre-reminder):** A polite heads-up, in a "reminder about your upcoming payment" tone. The goal is to make sure the invoice hasn't gotten lost in the customer's approval process.
- **1 day after the due date (tier 1):** Friendly and non-presumptive. A "we haven't seen your payment yet; it may have slipped through the cracks" approach.
- **Day 7 (tier 2):** A clearer reminder. Reattach the invoice and ask whether the payment has been scheduled.
- **Day 15 (tier 3):** Direct and specific. A message that copies in the account manager and suggests a phone call. A CRM task is created at this point.
- **Day 30 (tier 4):** Formal tone. Reference the payment terms in the contract and remind the customer of any penalties defined in the contract, such as possible service restrictions or late-payment interest. Escalate to management.
- **Every 15 days after day 30:** Internal escalation and management reporting. From this point on, it's usually better to switch to human intervention rather than sending the customer automated emails.

Let's walk through an example scenario: imagine a B2B SaaS company that issues 120 invoices a month, some of which aren't paid on time each month. With manual tracking, a finance specialist has to spend several hours on this every week. After automation, the specialist only deals with invoices that reach tier 3 or beyond, usually a single-digit number. The rest close on their own through automated reminders.

## What tone should reminder emails take?

In collections communication, protecting the customer relationship matters as much as getting paid. Below are sample messages for two tiers.

**Tier 1 example (1 day after the due date):**

> Hi Ayşe,
>
> We haven't yet seen payment in our system for invoice #2024-118, amounting to 48,000 TL and due on March 15. If your payment is already in process, please disregard this message.
>
> I'm attaching the invoice again for your convenience. If you have any questions, feel free to write to me directly.

**Tier 3 example (day 15):**

> Hi Ayşe,
>
> Our invoice #2024-118 has been showing as open for 15 days. If anything is missing on our side or an approval is pending in your payment process, we're ready to help resolve it.
>
> Your account manager, Mehmet, is also aware of this. We'd appreciate it if we could schedule a short phone call this week. Could you share a time that works for you?

Points to keep in mind:

- Avoid accusatory language. Say "we haven't seen your payment yet" instead of "you haven't paid."
- Offer a path to resolution in every email: who to contact with questions and how to make the payment.
- Increase clarity as the tiers progress, but don't reduce respect.
- Write in the customer's language and cultural context. If you have international customers, separate your templates by language.

## How can AI contribute to this process?

Basic collections automation is rule-based and sufficient for most companies. AI, however, can make the process smarter at certain points:

- **Response classification:** You can send replies to reminder emails to an AI node and classify them as "payment made," "payment commitment," "dispute," "wrong contact," or "auto-reply." Extracting the date from replies containing a payment commitment and writing it to the relevant field lets the sequence pause automatically until that date.
- **Tone personalization:** Adjusting the message tone based on the customer's past payment behavior. A customer who has paid reliably for years and is late for the first time shouldn't be addressed the same way as a chronically late payer.
- **Late payment risk prediction:** Using historical payment data to predict which invoices are likely to be paid late and sending those customers a pre-reminder earlier.

An important caveat: have a human approve AI-generated messages before they're sent, especially during the first few weeks. Approval flows in n8n or "approve/reject" buttons in Slack are very handy for this.

## What mistakes should you avoid?

These are the problems teams most often run into when building collections automation:

1. **Going live without a test environment:** Having emails go out to every open invoice at once on the first run creates a serious reputational risk. Test the workflow for a few days first by routing all emails to your own address.
2. **Ignoring legacy invoices:** If there's an invoice that's 60 days overdue on the day you set up the system, decide in advance which tier it should start from. Otherwise, the customer may receive an inconsistent message like "your payment is 1 day overdue."
3. **Mishandling partial payments:** Base reminders on the outstanding balance, not the total amount. Reminding a customer who has paid 40,000 TL of a 48,000 TL invoice about the full amount creates unnecessary friction.
4. **Not keeping billing contacts up to date:** When the person in procurement changes, reminders go nowhere. Adding a small branch that catches bounced emails and notifies the account manager solves this problem.
5. **Overlooking personal data protection:** Invoice and contact data include personal data. If you self-host n8n, restrict access permissions; if you use the cloud version, review the data processing terms with your legal team in terms of KVKK compliance.
6. **Leaving the sales team out of the process:** If account managers don't know what's being sent to the customer, they may be caught off guard in a meeting when the customer asks, "Why did you send us such a harsh email?"

The collections process is an integral part of the post-sale customer journey. When it's handled together with onboarding, usage tracking, and renewal processes, the result is a much more consistent customer experience. For this holistic approach, take a look at our post on [automating post-sale B2B customer follow-up processes with n8n](https://cornergroup.co/blog/n8n-ile-satis-sonrasi-b2b-musteri-takip-surecleri-otomasyonu).

## Which metrics should you use to measure success?

After setting up the automation, you need to measure its impact regularly. Recommended metrics to track:

- **Days sales outstanding (DSO):** The average number of days from invoice issuance to payment receipt. This is the metric the automation affects most directly.
- **On-time payment rate:** Useful for seeing the impact of the pre-reminder.
- **Close rate by tier:** What share of invoices close at tier 1, and what share at tier 3? If most close at tier 1, the problem is likely forgetfulness or process; if they drag on to tier 3, there may be deeper causes such as cash constraints or dissatisfaction.
- **Receivables over 30 days:** A critical metric that should be tracked separately in management reports.
- **Number of invoices requiring manual intervention:** An indirect measure of the time your team spends on this process.

You can compile these metrics weekly with n8n and send them to management as an automated summary report. If you're wondering how to structure sales and revenue metrics together, our [B2B sales team KPI guide](/blog/b2b-sales-team-kpis) offers a useful framework.

Collections data is also a valuable signal for sales strategy. Recognizing the profiles of customers who consistently pay late helps you define your ideal customer profile more accurately and fill your future pipeline with healthier customers. For this kind of data-driven sales and targeting, you can also work with the [Sales Corner team, which provides data-driven B2B sales and lead generation services](https://salescorner.co).

## How much does it cost?

The cost of a collections follow-up automation with n8n consists of three components:

- **n8n license or hosting:** n8n's community edition is free and can be hosted on your own server. In that case, you only pay the monthly cost of a small server. The cloud version is offered as a monthly subscription based on the number of workflow executions. A collections workflow that runs once a day comfortably stays within the limits of lower-tier plans.
- **Integrated tools:** If you already have accounting software, a CRM, and email infrastructure, there's usually no extra cost. If you add an AI layer, the API cost of the language model is added depending on processing volume. For low-volume tasks such as replies to collections emails, this cost generally stays modest.
- **Setup effort:** A basic workflow can be built in a few days by someone with n8n experience. Adding AI classification, webhook integrations, and multi-currency structures extends the timeline. The most time-consuming part is usually not the technical setup, but finalizing the reminder schedule, exceptions, and templates together with the finance and sales teams.

For comparison, it helps to consider this: assuming someone on your finance team spends several hours a week on collections follow-up, most of that time is freed up by automation. When you add the effect of improved cash flow on financing costs, the investment is likely to pay for itself quickly.

## Frequently asked questions

### Does my accounting software need an API for collections follow-up with n8n?

No, it's not required. If there's no API, you can regularly export open invoices to a Google Sheets file, Excel, or a database and have n8n read from that source. However, an API integration keeps the data always up to date, which significantly reduces the risk of accidentally sending reminders for invoices that have already been paid.

### Will automated reminders harm customer relationships?

When designed correctly, it's usually the opposite. Consistent, polite, and informative reminders leave a professional impression and keep customers from forgetting invoices. Harm usually stems from setup mistakes such as failing to filter out disputing customers, miscalculating partial payments, or sending messages too frequently.

### Should strategic customers also receive automated emails?

That depends entirely on the nature of your customer relationship. Many companies prefer to have the account manager personally send the first reminder to large, strategic customers. In that case, instead of emailing the customer, n8n only creates a task and notification for the account manager. This preserves the follow-up discipline of automation while keeping communication personal.

### How can I make sure reminders stop once payment is made?

The most reliable method is to update the invoice status in real time with webhook notifications from your payment provider or bank. If webhooks aren't supported, add a step that rechecks the invoice's current status right before each email is sent. By also keeping send logs, you can always audit which invoice received a message at which tier.

## Conclusion

In most B2B companies, overdue receivables follow-up is still a manual, irregular process that depends on individuals. An automation built with n8n tracks every invoice by the same rules, reaches the customer at the right time in the right tone, gives sales and finance teams the same information, and leaves only the cases that truly need intervention to people. The key to success lies less in the technical setup than in defining exceptions correctly, writing templates carefully, and testing the system thoroughly before going live.

If you want to automate your collections, post-sale, or CRM processes with n8n and free up your team's time for work that truly creates value, [get in touch with the Corner Group team](/en/contact). Let's analyze your processes together and build an automation roadmap tailored to you.
