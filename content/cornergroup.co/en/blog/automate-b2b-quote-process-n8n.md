---
title: "Automating B2B Quotes with n8n: A Step-by-Step Guide"
description: "How can SMBs cut quote preparation time? This guide walks you through building an n8n automation from form request to approved PDF quote."
date: "2026-10-25"
category: "Automation"
image: "https://images.pexels.com/photos/8171198/pexels-photo-8171198.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Guide to automating the B2B quote process with n8n"
alt: "b2b-teklif-sureci-n8n-otomasyon"
---

Automating the B2B quote process with n8n means that **once a deal in your CRM reaches a specific stage, the quote is automatically prepared, approved, sent and followed up**. The workflow runs like this: n8n pulls customer and product data from the CRM, applies pricing and discount rules, obtains manager approval when needed, generates a PDF quote, sends it to the customer and handles reminders on its own until a response arrives. This setup cuts the hours a sales rep spends on a single quote down to minutes and largely eliminates pricing errors.

At many B2B companies, quotes are still prepared manually. The rep opens the price list in Excel, copies the Word file from the previous quote, changes the customer name, messages their manager on WhatsApp about the discount, emails the PDF and leaves the follow-up to memory. In this guide, we walk you step by step through building the same process end to end with n8n: preparation, workflow architecture, pricing logic, approval mechanism, document generation, the right way to use AI, cost and measurement.

## Why is the quote process one of the best candidates for automation?

The quote process combines three traits that make it ideal for automation: it is **repetitive**, **rule-based** and **directly tied to revenue**.

- **It's repetitive:** Every quote follows the same steps: customer information, line items, pricing, discount, terms, validity period, delivery and follow-up.
- **It's rule-based:** Most companies already have rules such as "Discounts above 10% require sales manager approval" or "Annual payment comes with two months free." But these rules are often unwritten and live only in people's heads.
- **It's directly tied to revenue:** A quote that goes out a day late can let a competitor get there first. A miscalculated discount eats straight into your profit margin.

The problems that crop up in a manual process are well known: quotes sent from an outdated price list, the previous customer's name left in the document, deals going cold while waiting for approval, sent quotes never followed up and no clear record of which version a quote is on. n8n lets you tackle each of these problems with a dedicated node.

## How does an automated quote workflow work in n8n?

Before building the workflow, it helps to see the big picture. A typical B2B quote automation consists of the following layers:

1. **Trigger:** A deal is moved to the "Prepare Quote" stage in the CRM, or a form is submitted.
2. **Data collection:** Company, contact, line items, quantities, contract term and payment type are pulled from the CRM.
3. **Validation:** A check for missing fields. For example, if the tax ID or billing address is missing, the workflow stops and the rep is notified.
4. **Pricing engine:** Calculation based on the current price list, application of discount rules, and computation of tax and totals.
5. **Approval layer:** An approval request sent to a manager for quotes that exceed threshold values.
6. **Document generation:** A PDF quote is created from a template and archived with a version number.
7. **Delivery:** The quote is sent to the customer in a personalized email.
8. **Follow-up:** Reminders at set intervals, with branching based on open or reply status.
9. **Closing:** For accepted quotes, the CRM stage is updated and the deal is handed over to the accounting and operations teams.

What makes n8n strong for this job is that you can connect these layers in a visual interface while writing custom logic in JavaScript when needed. It has ready-made integrations for HubSpot, Pipedrive and Zoho. You can also connect to systems without a dedicated node through their APIs using the HTTP Request node.

## What should you prepare before you start?

Most automation projects stall not for technical reasons but because of unclear processes. Before you open n8n, nail down these four areas.

### 1. A single, up-to-date pricing source

If your prices are spread across three different Excel files and two different people's computers, automation will do nothing more than spread the wrong data faster. Consolidate your price list in one place. That place can be your CRM's product catalog (HubSpot Products, Pipedrive Products, Zoho Price Books), a Google Sheets spreadsheet or Airtable. Each product should have at least the following fields:

- Product code and name
- Unit price and currency
- Pricing unit (per user, monthly, per unit, etc.)
- Maximum allowed discount rate
- Validity date

### 2. A written discount and approval matrix

Put into a table who can approve which discount. A sample matrix:

- **0–10% discount:** The sales rep grants it on their own authority; no approval required.
- **10–20% discount:** Sales manager approval required.
- **Discounts above 20% or special payment terms:** General manager or finance approval required.
- **If the total amount exceeds a certain threshold** (for example, 500,000 TL), finance is informed even if there is no discount.

These rates will vary depending on your business. What matters is that the rule is written down and unambiguous.

### 3. A standard quote template

Prepare a single template that includes a cover page, customer details, a line-item table, totals, payment terms, validity period and a signature field. Mark variable fields with curly braces, such as `{{firma_adi}}`, `{{teklif_no}}` and `{{gecerlilik_tarihi}}`.

### 4. Well-organized CRM fields

Every piece of information needed for a quote must live in a specific CRM field. The "I wrote it in the notes" approach doesn't work with automation. If you haven't yet decided which CRM to use, [our SMB decision guide comparing HubSpot and Pipedrive](/blog/hubspot-vs-pipedrive-smb-decision-guide) will point you in the right direction.

## Setting up n8n quote automation step by step

In the example below, we assume Pipedrive as the CRM, Google Docs for documents, Slack for approvals and Gmail for delivery. The same logic can be applied with HubSpot, Zoho, Microsoft Teams or Outlook.

### 1. Set up the trigger

Connect the Pipedrive Trigger node to the "Deal updated" event. Then add an IF node so the workflow only continues when the stage is "Prepare Quote." This way, not every minor change to a deal triggers the workflow.

Alternatively, some teams prefer to have the rep fill out a form. With n8n's Form Trigger node, you can collect the products, quantities and discount request from the rep and pull the rest from the CRM.

### 2. Collect and validate the data

Using the deal ID, pull the following data:

- The organization linked to the deal (legal name, tax office, tax ID, address)
- The contact (name, title, email)
- Products added to the deal and their quantities
- Custom fields: contract term, payment type, requested discount

Then use a Code node to check the required fields. If anything is missing, stop the workflow and send the rep a clear Slack message such as "The quote could not be created because the tax ID is missing." This single step completely prevents quotes from reaching customers with incomplete information. If your CRM data is messy, we recommend implementing [automated CRM data cleansing and enrichment with AI](https://cornergroup.co/blog/yapay-zeka-ile-crm-verilerini-otomatik-temizleme-ve-zenginlestirme-rehberi) before rolling out quote automation.

### 3. Build the pricing engine

This is the heart of the workflow. After pulling the price list from Google Sheets or your CRM catalog, perform the calculation in a Code node. A simplified example:

```javascript
const kalemler = $json.urunler;
const talepIndirim = $json.indirim_orani || 0;
const yillikOdeme = $json.odeme_tipi === 'yillik';

let araToplam = 0;
const satirlar = kalemler.map(k => {
  const tutar = k.birim_fiyat * k.adet * (k.ay_sayisi || 1);
  araToplam += tutar;
  return { ...k, tutar };
});

let indirim = araToplam * (talepIndirim / 100);
if (yillikOdeme) indirim += araToplam * (2 / 12);

const kdvsiz = araToplam - indirim;
const kdv = kdvsiz * 0.20;
const genelToplam = kdvsiz + kdv;

let onaySeviyesi = 'yok';
if (talepIndirim > 20) onaySeviyesi = 'genel_mudur';
else if (talepIndirim > 10) onaySeviyesi = 'satis_muduru';

return [{ json: { satirlar, araToplam, indirim, kdvsiz, kdv, genelToplam, onaySeviyesi } }];
```

Let's take a concrete example: a software license for 25 users at 400 TL per user per month, a 12-month contract and a requested 15% discount. The subtotal comes to 25 × 400 × 12 = 120,000 TL. The 15% discount equals 18,000 TL, bringing the amount excluding VAT down to 102,000 TL. Because the discount exceeds 10%, the workflow automatically routes it for sales manager approval. The rep no longer needs to open a calculator or remember the rules.

In a real-world scenario, you'll also need to add the VAT rate, currency conversion and product-level maximum discount limits to this node.

### 4. Set up the approval flow

Use a Switch node to branch based on the `onaySeviyesi` value:

- **If no approval is needed:** Proceed directly to document generation.
- **If approval is needed:** Send the relevant manager a Slack message containing the customer name, total amount, discount rate and the rep's justification. Add "Approve" and "Reject" buttons to the message.

n8n's Wait node, in "On Webhook Call" mode, waits for the manager to click a button. If approved, the workflow continues; if rejected, the rep is notified along with the reason. If no response arrives within a set time (for example, 4 business hours), you can configure a reminder to the manager, followed by escalation to the next level after 24 hours. When designing internal notifications, you can draw on the channel and message structure recommendations in our article on [automation in B2B sales team communication with n8n](https://cornergroup.co/blog/n8n-ile-b2b-satis-ekibi-i-letisiminde-otomasyon-verimlilik-rehberi).

Don't forget to log approval records, meaning who approved which amount and when, in a table or CRM note. This record is a valuable data source both for internal audits and for evaluating your discount policy later on.

### 5. Generate the quote document

There are three common methods for document generation:

- **Google Docs template:** Copy the template, fill in the variables using the "Replace text" operation and export it as a PDF. This is the easiest method to set up.
- **HTML to PDF:** Build the quote in HTML and send it to a PDF conversion service such as Gotenberg. It offers greater design control and is more flexible for tables with a variable number of line items.
- **Proposal platforms:** You can create documents through the APIs of PandaDoc or similar tools and take advantage of their e-signature features as well.

Give every quote a unique number. A format like `TKL-2025-0142`, matched with the deal ID, makes archiving easier. For revisions, switch to the `TKL-2025-0142-R2` format. Save the PDF to the customer's folder in Google Drive and attach the link to the deal in the CRM.

### 6. Personalize the delivery

A quote email should not look like a template. When sending through the Gmail or Outlook node, make the following elements dynamic:

- The contact's name and title
- The core need discussed in the meeting (from the meeting notes field in the CRM)
- The quote's validity date
- A clear proposal for the next step: "Shall we schedule a 15-minute review call on Thursday?"

Sending the email from the rep's own address matters for reply rates. In n8n, you can define separate credentials for each rep or use your email service's "send as" feature.

### 7. Automate follow-ups and reminders

Follow-up is where the most deals are lost after a quote is sent. A recommended follow-up cadence:

1. **2 business days after sending:** A short check-in email: "Have you had a chance to review the quote?"
2. **After 5 business days:** If there's no reply, create a phone call task for the rep.
3. **3 days before the quote expires:** A final reminder to the customer and a notification to the rep.
4. **When the quote expires:** Move the deal to the "Quote Expired" stage and assign the rep a decision task.

Before each step, check the deal's stage in the CRM. If the customer has replied in the meantime or the deal has been won, no reminder should go out. Without this check, a customer who has already signed the contract might receive a "Have you reviewed our quote?" email, which seriously damages trust.

### 8. Design the post-acceptance handover

The workflow doesn't end when the customer accepts the quote. At this point:

- Mark the deal as "Won" in the CRM.
- Send accounting a task or email containing the billing information.
- Create an onboarding task for the operations or customer success team.
- Schedule the welcome email.

A smooth handover of a newly won customer is the most critical moment in shaping their first impression. If you'd like to expand this stage, take a look at [our guide to automating B2B customer success processes with n8n](https://cornergroup.co/blog/n8n-ile-b2b-musteri-basarisi-sureclerini-otomatiklestirme-rehberi).

## Where should you use AI in the quote process, and where shouldn't you?

n8n's integrations with OpenAI, Anthropic and other language models make it easy to add AI to the quote process. But using it at every step is not the right approach.

**Where AI adds value:**

- **Summarizing needs from meeting notes:** Turning a rep's scattered notes into clean paragraphs suited to the quote's "Your Needs as We Understand Them" section.
- **Personalizing email copy:** Tailoring the opening paragraph to the customer's industry and the topics discussed.
- **Classifying customer replies:** Detecting whether an incoming reply is "positive," a "price objection," a "postponement" or a "request for more information," and routing it to the right branch.
- **Interpreting revision requests:** Extracting structured data from a reply such as "We'd like to increase the number of users to 30 and pay monthly."

**Where AI should not be used:**

- **Price calculation:** Figures should always be calculated with deterministic code. Language models can make mistakes with numerical operations.
- **Discount decisions:** Approval logic should be based on written rules.
- **Legal terms:** Contract clauses should come from the approved template, not be rewritten by a model.

In short, AI should handle text and interpretation, while code handles numbers and rules. Adding a preview step where the rep can review the model's output before it reaches the customer is a good safety layer, especially in the first few months.

## How should quote automation be designed for multi-brand organizations?

In companies with more than one brand, each brand may have its own price list, logo, template and even a separate legal entity. In this case, rather than building a separate workflow for each brand, it's more sustainable to use **a single main workflow and a brand-level configuration table**.

The configuration table stores the following for each brand:

- Template file ID
- Price list source
- Approval matrix and approvers' Slack IDs
- Sender email address and signature
- Legal entity and billing details

The workflow reads the relevant row from this table based on the "brand" field on the deal and runs the remaining steps with the same logic. That way, when you want to change a rule, you update a single table instead of ten separate workflows. We covered the data side of this approach in detail in our article on [centralized CRM strategies for multi-brand holding companies](https://cornergroup.co/blog/cok-markali-holdinglerde-merkezi-crm-stratejileri-veri-butunlugu-rehberi).

## Which metrics should you track?

You can't claim success without measuring whether the automation actually works. Record your current baseline before setup, then track these metrics regularly:

- **Quote preparation time:** The time from the deal moving to the "Prepare Quote" stage until the quote is sent.
- **Approval time:** The time from sending the approval request until a response arrives.
- **Quote acceptance rate:** The percentage of sent quotes that are won.
- **Average discount rate:** By rep and by brand. Discount discipline is expected to improve after automation.
- **Number of revisions:** The average number of revisions per quote.
- **Follow-up compliance:** The share of planned reminders that went out on time.

Each of these data points is already generated within the n8n workflow. By writing a timestamp to a table at each step, you can also generate a weekly report automatically with a separate n8n workflow. If you want to build a reporting infrastructure and manage your sales pipeline based on data, [Sales Corner's data-driven B2B sales approach](https://salescorner.co) is also a great starting point.

## How much does it cost?

n8n's cost structure is one of the things that makes it attractive for quote automation. There are essentially two options:

- **Self-hosted (on your own server):** n8n's community edition is free. You only pay for the server. A cloud server with modest specs is usually sufficient for a small to mid-sized quote workflow. However, responsibility for installation, updates, backups and security rests with you.
- **n8n Cloud:** Runs on a monthly subscription, with pricing tiered by the number of executions. It's more practical for teams that don't want to deal with infrastructure management. We recommend checking current pricing on n8n's official website.

On top of these, you should account for the following:

- AI API usage (usually a low cost per quote)
- Subscription fees if you use a PDF conversion or e-signature service
- Internal team time or consulting fees for initial setup and process design

A simple way to calculate ROI: multiply the number of quotes you prepare per month by the average time spent per quote and the rep's hourly cost. For example, a team that prepares 60 quotes a month and spends an average of 1.5 hours on each is devoting roughly 90 hours a month to quote preparation. When automation frees up most of that time, reps can redirect it to sales conversations. The indirect gains from speed and accuracy come on top of this calculation.

## What are the most common mistakes?

These are the traps teams most often fall into when building quote automation:

1. **Automating before clarifying the process:** You can't turn an unwritten approval rule into code. Map out the process on paper first.
2. **Skipping error handling:** Define what happens when an API connection drops or a field comes back empty. Use n8n's Error Trigger node to instantly report failed executions to a Slack channel.
3. **Cutting the rep out of the loop:** A quote going out without the rep's knowledge creates trust issues. At least in the early phase, add a "Ready to send, do you approve?" step.
4. **Trying to build everything at once:** Start with the trigger, calculation and document generation. Add the approval, follow-up and AI layers in the second and third weeks.
5. **Forgetting to update the price list:** The pricing source must have a clear owner and update frequency. Otherwise, the automation will flawlessly send outdated prices to customers.
6. **Not using a test environment:** Test workflows first with test deals and internal email addresses. A faulty quote reaching a real customer can instantly shake confidence in the automation.

## Frequently asked questions

### Do you need coding skills to build quote automation with n8n?

Basic workflows can be built in the visual interface without writing code. However, basic JavaScript knowledge makes steps like the pricing engine and data validation much easier. Companies without a technical team usually do the initial setup with an expert and then hand maintenance over to their in-house team.

### Which CRMs does it work with?

n8n has ready-made nodes for HubSpot, Pipedrive, Zoho CRM and Salesforce. Systems without a dedicated node can be connected via their APIs using the HTTP Request node. This also makes it possible to integrate with local ERP or accounting software.

### How long does it take to set up quote automation?

If your price list, template and approval rules are ready, a basic workflow can be up and running within a few days. An end-to-end system with layers such as approvals, follow-ups, AI and a multi-brand structure usually requires a few weeks of phased work. The biggest factor affecting the timeline is not the technical setup but how clearly the process is defined.

### How is customer data kept secure?

With a self-hosted setup, your data stays on your own server, which gives you greater control over compliance with KVKK, Turkey's data protection law. Storing credentials in n8n's encrypted credential system, restricting access on a role basis and sending only the minimum necessary data to AI services are the core security measures.

## Conclusion

The B2B quote process is one of the areas where automation delivers the fastest and most measurable return. With n8n, you can pull data from your CRM, apply pricing and discount rules consistently, speed up approvals, generate documents in seconds and run follow-ups without missing a beat. The key to success lies less in the technical tool than in the process itself: teams that start with a single pricing source, a written approval matrix and a standard template begin to see the benefits of automation within the first few weeks.

If you'd like to automate your quote process end to end, build an n8n workflow integrated with your CRM or design an architecture suited to your multi-brand structure, the Corner Group team is ready to help. To review your current process together, reach out to us through our [contact page](/en/contact).
