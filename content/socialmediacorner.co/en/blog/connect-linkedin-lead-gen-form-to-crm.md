---
title: "How to Connect LinkedIn Lead Gen Forms to Your CRM"
description: "Learn how to automatically sync LinkedIn Lead Gen Form leads to HubSpot, Salesforce or Excel, with step-by-step instructions and a checklist."
date: "2026-11-16"
category: "Social Selling"
image: "https://images.pexels.com/photos/6285086/pexels-photo-6285086.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "How to connect a LinkedIn Lead Gen Form to your CRM"
alt: "linkedin-lead-formu-crm-baglantisi"
---

There are three ways to connect a LinkedIn Lead Gen Form to your CRM: **native integrations in LinkedIn Campaign Manager** (such as HubSpot, Salesforce and Microsoft Dynamics 365), **middleware tools like Zapier or Make**, and **manual CSV import**. If your CRM supports it, a native integration is the most reliable option. With it, every person who fills out the form lands in your CRM as a record within minutes, gets assigned to the right sales rep, and follow-up starts automatically. Whichever method you choose, a successful connection requires you to complete field mapping, source tagging, lead assignment rules and testing in full.

Many B2B companies invest serious budget in LinkedIn ads, yet the leads they collect sit in Campaign Manager for weeks or get forgotten in an Excel file. As each hour passes and the lead cools down, the sales team has no idea whom to contact or when. In this article, we walk you step by step through setting up the connection between LinkedIn Lead Gen Forms and your CRM end to end, choosing the right method for you, mapping your fields, and deciding what to measure after setup.

## Why should LinkedIn leads flow into your CRM automatically?

The biggest advantage of LinkedIn Lead Gen Forms is that they auto-fill the user's details from their profile and reduce conversion friction. However, that advantage is largely wasted if you can't reach the lead quickly. In B2B sales, a decision-maker's interest peaks at the moment they submit the form. If the same person is called a few days later, they often don't even remember filling it out.

Here are the concrete benefits of an automated CRM connection:

- **Speed:** The moment a lead lands in the CRM, the rep is notified and first contact can happen the same day.
- **Data integrity:** Manual copy-paste errors disappear. Name, job title, company and email are written to the correct fields.
- **Source tracking:** You can see which campaign, form and ad set produced the leads that converted into sales.
- **Automated nurturing:** The lead is immediately added to an email sequence, segment list or scoring model.
- **Reportable ROI:** You can tie ad spend to pipeline and closed deals.

When this connection isn't in place, the picture is usually the same: Marketing says "we delivered leads," and Sales replies "the leads are low quality." But the problem often isn't lead quality; it's that leads are delivered late and without context.

## What should be in place before you start?

Before you move on to the integration, a few fundamentals need to be in place. This preparation prevents most of the problems you might run into during setup.

1. **A live or ready-to-launch Lead Gen Form:** If you don't have a form yet, start with our [step-by-step guide to setting up a LinkedIn Lead Gen Form](/blog/how-to-set-up-linkedin-lead-gen-form). Your form fields directly determine the fields you'll map in the integration.
2. **The right permissions:** On the LinkedIn side, you need at least the "Campaign Manager" or "Account Manager" role on the ad account. Some integrations also require admin access to the company Page. On the CRM side, you need admin permissions that allow you to set up integrations.
3. **A decision on the target object in your CRM:** Will leads land in the CRM as a "Lead" or a "Contact"? This distinction matters in systems like Salesforce and Dynamics. HubSpot typically uses the "Contact" object.
4. **Required field check:** If a field that's mandatory in your CRM isn't on the form, the record won't be created. For example, if your CRM requires a "Phone" field but your form doesn't ask for a phone number, the integration may fail silently.
5. **Lead owner and assignment logic:** Who will incoming leads be assigned to? Will they be distributed by region, industry or company size? Document these rules in advance.
6. **KVKK (Turkish data protection law) and consent text:** The form should include a link to your privacy policy and, where required, an explicit consent checkbox. This consent information must also be passed to your CRM.

## Which integration method should you choose?

The right method depends on the CRM you use, your technical resources and your monthly lead volume. The comparison below will make the decision easier.

### Native integration (Lead Sync)

LinkedIn offers native integrations with a range of CRM and marketing automation platforms that you can connect directly from within Campaign Manager. HubSpot, Salesforce, Microsoft Dynamics 365, Zoho CRM, Adobe Marketo Engage and Oracle Eloqua are among the most prominent. Since the list of supported platforms may change over time, we recommend checking the current list on the integrations screen in Campaign Manager.

- **Pros:** No extra cost, setup usually takes 15-30 minutes, data latency is low, and it's supported by LinkedIn.
- **Cons:** Field mapping flexibility may be limited. Complex assignment rules need to be built separately on the CRM side.

### Middleware tools (Zapier, Make, LeadsBridge, etc.)

If your CRM isn't natively supported (for example, if you use Pipedrive, Bitrix24 or a custom-built CRM), middleware tools come into play. In these tools, the trigger is "New LinkedIn Lead Gen Form response" and the action is "Create contact in CRM."

- **Pros:** Works with almost any CRM. Conditional logic, data cleansing and multiple actions (CRM + Slack notification + email list) can be set up in a single workflow.
- **Cons:** There's a monthly subscription cost, pricing rises as task volume grows, and adding another link to the chain increases the number of potential failure points.

### Manual CSV import

In Campaign Manager, you can download each form's responses as a CSV file and import them into your CRM. LinkedIn stores lead data in Campaign Manager for a limited period (typically 90 days), so it's important not to miss that window.

- **Pros:** Free and requires no technical knowledge.
- **Cons:** Delays are unavoidable, the risk of errors is high, and it doesn't scale. Not recommended except for test campaigns that generate only a few leads a month.

### Custom integration via API

In enterprise setups, especially for teams using custom CRMs or data warehouses, a custom integration can be built on the LinkedIn Marketing API. This is the most flexible route, but it requires developer resources and going through LinkedIn's API access approval process.

**A practical rule of thumb:** If you get fewer than 20 leads per month and your CRM isn't among the native integrations, a middleware tool is enough. If your CRM is supported, start with the native integration regardless of your lead volume.

## How do you connect a LinkedIn Lead Gen Form to your CRM, step by step?

The steps below apply to native integrations. Our examples are based on HubSpot and Salesforce, but the logic is similar on other platforms.

### 1. Open the integrations screen in Campaign Manager

Log in to Campaign Manager and select the relevant ad account. In the left-hand menu, go to the **"Lead Gen Forms"** section under **"Account Assets"**. There you'll see an **"Integrations"** or **"Connect CRM"** tab. Interface labels may change with LinkedIn updates, but integrations are generally found under this menu.

### 2. Select and authorize your CRM

Choose your CRM from the list. In the window that opens, log in to your CRM account and grant LinkedIn access. You need admin permissions on the CRM side for this step.

**An alternative route in HubSpot:** You can also start lead syncing by connecting your LinkedIn ad account under *Marketing > Ads* in HubSpot. Most teams prefer this method because it also enables HubSpot's ad reporting.

**In Salesforce:** You'll be asked to choose whether leads should be written to the "Lead" or "Contact" object. If your sales process is built on lead qualification, choose the "Lead" object.

### 3. Select the forms to sync

Rather than connecting all forms automatically, specify one by one which forms should be synced. For example, a "Demo Request" form should go straight into the sales pipeline, while an "E-book Download" form should go to a nurturing list. Making this distinction at the form level makes your assignment rules much easier later on.

### 4. Map your fields

This is the most critical step of the integration. You define the CRM equivalents of your LinkedIn form fields. A typical mapping looks like this:

- **First Name** → First Name
- **Last Name** → Last Name
- **Email Address** → Email
- **Job Title** → Job Title
- **Company Name** → Company
- **Country/Region** → Country
- **Phone Number** → Phone
- **Company Size** → Number of Employees (custom field)
- **Seniority** → Seniority Level (custom field)
- **Custom question: "What is your current CRM?"** → Current Technology (custom field)

**Things to watch out for:**

- For dropdown fields, the options in LinkedIn must exactly match the option values in your CRM. For example, if an option is "51-200" in LinkedIn but defined as "51–200 employees" in your CRM, the data may not be written.
- Create a custom field in your CRM in advance for every custom question on the form.
- Always write the consent checkbox response to a separate field. This allows you to prove, under KVKK, who has agreed to which type of communication.

### 5. Carry source information with hidden fields

You can define **hidden fields** in Lead Gen Forms. These fields are invisible to the user but pass data to your CRM. The hidden fields we recommend:

- **lead_source:** "LinkedIn Ads"
- **campaign_name:** For example, "2024-Q3_Demo_IT-Managers"
- **form_name:** "Demo Request v2"
- **offer_type:** Such as "Demo," "E-book" or "Webinar"

This approach is the in-form equivalent of the logic behind [measuring social media traffic with UTM parameters](/blog/utm-parameters-social-media-traffic), which you use for website traffic. Keeping your naming convention consistent with your UTMs makes reporting much easier.

### 6. Send a test lead

Campaign Manager lets you send a **test lead** for your forms. After sending the test lead, check the following:

- Was the record created in the CRM? How many minutes did it take?
- Were all fields written to the correct places?
- Are the hidden fields populated?
- Was the lead assigned to the right person?
- Were the notification and automated email triggered?

Don't forget to delete the test record from your CRM or tag it as "test" after checking it. Otherwise, your reports will be skewed.

### 7. Import historical leads

Integrations usually sync only leads that come in after the connection is set up. Some platforms can also pull historical data, but this isn't guaranteed. Download previously collected leads from Campaign Manager as a CSV and import them into your CRM using the same field mapping. Use the email address as a unique key to prevent duplicate records.

## How do you set up the connection with Zapier or Make?

If your CRM isn't among the native integrations, the process goes like this:

1. Create a new workflow in Zapier or Make.
2. **Trigger:** LinkedIn Lead Gen Forms → "New Form Response." Connect your LinkedIn ad account and select the relevant form.
3. **Intermediate step (optional):** Use "Formatter" to standardize phone numbers and fix inconsistent capitalization in name fields.
4. **Filter (optional):** Route leads that come in with personal email addresses (Gmail, Hotmail, etc.) to a separate stage.
5. **Action 1:** Create a contact or lead in your CRM. First add a "find by email address" step: if the record exists, update it; if not, create a new one.
6. **Action 2:** Send a notification to the sales team's Slack or Teams channel, such as "New demo request: [Full Name], [Job Title], [Company]."
7. Test the workflow and publish it.

Pay attention to the polling interval in middleware tools. On free and lower-tier plans, new leads may only be checked every 15 minutes. For hot leads like demo requests, it makes sense to choose a plan that offers a shorter interval.

## What should happen after a lead lands in your CRM?

Setting up the connection is only half the job. The real value comes from the process you run in the first 24 hours after the lead lands in your CRM.

### Assignment rules

Here's an example of how assignment logic can be set up:

- **Demo request + more than 200 employees:** Assigned to an enterprise sales rep, with a call task due within 1 hour.
- **Demo request + fewer than 200 employees:** Round-robin distribution to the SMB sales team, with an email and call on the same day.
- **E-book / content download:** Added to the marketing nurturing flow, a series of 3-5 emails.
- **Out-of-target job titles (students, interns, etc.):** Tagged as low priority, not assigned to the sales team.

### First-contact flow

When reaching out to someone who filled out the form, use the LinkedIn context. Instead of saying "You contacted us through our website," start with "I saw you downloaded our X report on LinkedIn." For the tone of your first message, you can draw on our [examples of writing effective sales messages on LinkedIn](/blog/linkedin-cold-sales-message-examples). Even though the lead isn't cold, a short, personal message structure that proposes one clear next step works here too.

A simple follow-up plan example:

1. **Day 0:** Automated thank-you email and the promised content.
2. **Days 0-1:** Personal email from the rep and a LinkedIn connection request.
3. **Day 2:** Phone call (if a number is available).
4. **Day 4:** An industry-specific case study or short video.
5. **Day 7:** Final personal follow-up with a meeting proposal.

### Data enrichment

Lead Gen Forms are usually kept short, because every additional field lowers the conversion rate. As a result, information such as company size, industry, tech stack or direct phone number is often missing. You can fill this gap with your CRM's enrichment features or with B2B data platforms like [Apollo.io](https://get.apollo.io/679irkzm35ya). This way, you keep the form short while giving the sales team a record rich in context.

If your lead volume is high and your in-house team can't keep up with follow-up, you can also outsource the qualification of inbound leads and their support with outbound processes. For example, B2B SaaS companies can consider [SAAS Corner, which provides outbound sales and lead generation services](https://saascorner.co), while companies in other industries can consider [Sales Corner, which offers data-driven B2B sales and lead generation services](https://salescorner.co) to close this gap.

## What are the most common mistakes?

Here are the typical mistakes we encounter during setup and how to fix them:

- **Required field mismatch:** If a field that's mandatory in your CRM isn't on the form, the record won't be created. Either add the field to the form or define a default value in your CRM for records coming from the integration.
- **Expired authorization:** When the person who set up the integration leaves the company or changes their password, the connection can break. Set up the integration with a system or service user instead of a personal account.
- **Duplicate records:** When the same person fills out two different forms, two separate records may be created. Define an email-based deduplication rule.
- **Lost source information:** Without hidden fields, all leads appear simply as "LinkedIn," and you can't tell which campaign worked.
- **Error logs no one monitors:** When the integration fails, no one notices. Every week, compare the number of leads in Campaign Manager with the number of LinkedIn-sourced records in your CRM.
- **Overlooked targeting:** A form shown to the wrong audience will produce low-quality leads even with a perfectly working integration. Make sure you apply the principles of [B2B targeting in LinkedIn ads](/blog/linkedin-ads-b2b-targeting) when setting up your campaigns.

## How do you measure the integration's success?

Once the connection is set up, track the following metrics regularly:

- **Sync rate:** The gap between the number of leads in Campaign Manager and the number of records that land in your CRM. Goal: the gap should be close to zero.
- **Speed to lead:** The time from when a lead lands in the CRM to the rep's first activity. Aim for hours on demo requests and no more than one business day on content downloads.
- **Lead → MQL → SQL conversion rates:** Shows which forms and campaigns produce qualified leads.
- **Pipeline value and closed deals:** The opportunity value generated per campaign.
- **Cost per lead and cost per opportunity:** Looking only at cost per lead is misleading. Only with CRM data can you spot a campaign that brings in cheap leads but never produces any opportunities.

When you bring these metrics together, you can calculate the true return on your LinkedIn ad investment. For the calculation method, take a look at our [guide to measuring B2B social media ROI](/blog/measure-b2b-social-media-roi).

## How much does it cost?

The cost depends entirely on the method you choose:

- **Native integration:** There's no extra charge on the LinkedIn side. However, in some CRMs, ad integrations or custom field usage may be limited to certain plans. Check your CRM subscription tier.
- **Middleware tools:** Priced based on monthly task volume. At low volumes, free or entry-level plans may be enough; for multi-step workflows and high volume, you'll need to move to a paid plan.
- **Custom development via API:** Involves developer time and maintenance costs. Generally only makes sense at enterprise scale.
- **Manual import:** No direct cost, but a high indirect cost. Every lead reached too late means part of your ad budget has gone to waste.

## Frequently asked questions

### How long does it take for LinkedIn leads to land in the CRM?

With native integrations, leads are usually transferred to the CRM within a few minutes. With tools like Zapier or Make, the time can range from a few minutes to 15 minutes depending on your plan's polling interval. With manual CSV import, the delay depends entirely on how often your team downloads the data.

### Can I also import previously collected leads into my CRM?

Yes, but most integrations automatically transfer only leads that come in after the connection is set up. You'll need to download historical leads from Campaign Manager as a CSV and import them into your CRM. Since LinkedIn stores lead data for a limited time, it's important not to delay this.

### What should I do if my CRM isn't on the native integration list?

You can use middleware tools like Zapier, Make or LeadsBridge. These tools take LinkedIn Lead Gen Form responses as a trigger and can create records in almost any CRM. If you operate at enterprise scale and use a custom CRM, a custom integration via the LinkedIn Marketing API is also an option.

### What should I pay attention to regarding KVKK?

Your form should include a link to your privacy policy. If you collect explicit consent for marketing communications, the checkbox response should be saved to a separate field in your CRM. This way, you can document who has agreed to which type of communication and automatically exclude those who haven't consented from your email workflows.

## Conclusion

Technically, connecting a LinkedIn Lead Gen Form to your CRM is often a half-hour job. But for that connection to actually generate sales, you need accurate field mapping, source information carried through hidden fields, clear assignment rules and a well-designed follow-up process for the first 24 hours. A properly set-up integration transforms LinkedIn ads from a channel that merely "collects leads" into a sales engine that makes a measurable contribution to your pipeline.

If you'd like to design your LinkedIn campaigns, lead forms and CRM workflow together from end to end, the Social Media Corner team is here to help. [Get in touch with us](/en/contact) to review your current setup together.
