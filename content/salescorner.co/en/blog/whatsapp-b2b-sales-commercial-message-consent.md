---
title: "WhatsApp B2B Sales: How to Get Commercial Message Consent"
description: "How do you get commercial message consent for B2B WhatsApp sales in Turkey, and what records must you keep? Legal limits and examples, step by step."
date: "2026-11-07"
category: "Sales Automation"
image: "https://images.pexels.com/photos/7648026/pexels-photo-7648026.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "WhatsApp B2B Sales: How to Get Commercial Message Consent"
alt: "whatsapp-b2b-satis-ticari-ileti-izni"
---

To send B2B sales messages over WhatsApp, you need **prior, explicit and verifiable consent to receive commercial electronic messages** from the recipient, and you must register that consent in the **Message Management System (İYS)**. Law No. 6563 exempts tradespeople and merchants from the consent requirement. However, that exemption becomes unclear when you message a company representative's personal number. Meta's WhatsApp policy also requires opt-in in every case, regardless of the law. The safest approach is therefore to obtain consent from every recipient that explicitly names WhatsApp as a channel, store the consent record and offer an easy way to opt out in every message.

In B2B sales, WhatsApp sits somewhere between email and the phone. It lets you reach decision-makers quickly, shortens post-meeting follow-up and can reduce dead time in the sales cycle. Used incorrectly, that same speed amplifies both legal and reputational risk. In this article, we walk step by step through how to obtain commercial message consent, the gray areas specific to B2B, the İYS process and how to connect WhatsApp to your sales automation in a compliant way.

> Note: This content is for general information purposes only and does not constitute legal advice. Legislation and Meta policies may change. Confirm with your legal counsel before running large-scale campaigns.

## Why does a WhatsApp message count as a "commercial electronic message"?

In Turkey, commercial communication is governed by two key pieces of legislation: **Law No. 6563 on the Regulation of Electronic Commerce** and the **Regulation on Commercial Communication and Commercial Electronic Messages**. Under these rules, messages sent via electronic means such as telephone, call centers, fax, automated dialing machines, smart voice recording systems, email and SMS for the purpose of promoting goods or services, marketing or promoting a business are considered commercial electronic messages.

A WhatsApp message is also sent through an electronic communication tool. If its purpose is to promote a product, offer a demo or announce a campaign, it falls within the scope of commercial electronic messages. The "it's just a chat app" defense doesn't hold up in practice. What matters is not the channel but **the content and purpose of the message**.

A quick test makes things easier:

- **"Our new module is out. Would you like a 15-minute demo?"** → Promotional and marketing purpose, a commercial message.
- **"Here's the link for our meeting tomorrow at 2:00 PM."** → Information about an existing business relationship, generally not considered a commercial message.
- **"Our offer expires on Friday, and we've added an extra discount."** → A mix of information and marketing; it's safer to treat it as a commercial message.

## In B2B, is it allowed to message merchants without consent?

This is the question B2B teams ask most often. The answer: **partly yes on paper, but risky in practice.**

Law No. 6563 states that commercial electronic messages may only be sent with the recipient's prior consent. The same article also states that commercial electronic messages may be sent to **tradespeople and merchants without prior consent**. This exemption matters for B2B, but it has three limits.

### 1. Who owns the number?

A message sent to a company's corporate line or corporate email address can be considered as sent to a merchant. In B2B, however, WhatsApp messages usually go to **the mobile phone of the procurement manager, IT director or founder**. That number often belongs to the individual and qualifies as personal data. In this case, the "I sent it to a merchant" defense weakens, and obligations under the Turkish Personal Data Protection Law (KVKK) also come into play. We cover how this affects AI-powered sales processes in detail in our article on [KVKK risks when using AI in sales](/blog/kvkk-risks-ai-in-sales).

### 2. The right to opt out always applies

Even if you message a merchant without consent, the recipient's **right to opt out** remains intact. You must stop sending the moment an opt-out notice arrives. Failing to offer an easy, free way to opt out in your message creates a risk of violation, even if you fall within the exemption.

### 3. Meta's rules are independent of the law

Even where the law permits it, the WhatsApp Business Platform requires that **the recipient has agreed to receive messages via WhatsApp** for business-initiated messages. Messages sent without opt-in increase blocks and complaints. This lowers your number's quality rating, restricts your messaging limit and, in the worst case, can get your account shut down.

**Practical takeaway:** Even in B2B, don't build a "no-consent messaging" strategy for WhatsApp. Treat the exemption as a safety net, not a business model.

## Two separate layers of permission: The law and the platform

In WhatsApp sales, you comply with two different sets of rules at the same time. Confusing them is the most common mistake.

| Layer | Who enforces it? | What does it require? | Consequence of violation |
|---|---|---|---|
| Legal consent (6563 + Regulation) | Ministry of Trade, İYS | Prior consent, İYS registration, opt-out method, record retention | Administrative fine |
| Personal data (KVKK) | Personal Data Protection Authority | Privacy notice, legal basis, explicit consent where required | Administrative fine, reputational damage |
| Platform policy (Meta) | Meta | WhatsApp-specific opt-in, approved templates | Quality drop, limit restrictions, account closure |

You can satisfy all three layers with a single consent form, as long as you design the form correctly.

## What elements should valid commercial message consent include?

The Regulation states that consent can be obtained in writing or through any electronic communication tool. To be valid, consent must include the following elements:

- **The recipient's explicit consent:** Pre-ticked boxes, wording buried in a general contract clause or "by continuing, you are deemed to have accepted" phrasing do not count as valid consent.
- **The recipient's full name:** For corporate consent, the company's trade name and the authorized person.
- **Electronic contact address:** For WhatsApp, the phone number.
- **Channel information:** Which channel the consent was given for (SMS, call, email). WhatsApp is generally treated under the SMS/messaging channel. For Meta opt-in, it's recommended that the word **"WhatsApp"** appears explicitly in the text.
- **Identity of the sender:** Which business the consent was obtained on behalf of.
- **Proof record:** Date, time and the source of consent (form URL, IP, event name, call recording).

Sample consent text:

> "I agree to receive commercial electronic messages from ABC Software Inc. about products, services and events via **WhatsApp and SMS**. I understand that I can withdraw my consent at any time free of charge."

It should be accompanied by a link to the KVKK privacy notice and an unticked consent checkbox.

## How do you obtain commercial message consent? Implementation in 7 steps

### 1. Define your use cases

Write down what you'll use WhatsApp for: meeting reminders, post-demo follow-up, proposal status updates, event invitations, reactivation campaigns. Evaluate separately whether each scenario counts as a commercial message. Separating informational and marketing messages from the start also makes things easier when choosing template categories.

### 2. Register with İYS as a service provider

Businesses that send commercial electronic messages are required to register with İYS. After registering, you upload your existing consents to the system and add new ones on an ongoing basis. In practice, newly obtained consents are expected to be registered in İYS **within 3 business days**. Unregistered consents may be deemed invalid.

### 3. Prepare the consent text and form

Create a single consent text that includes the elements above and use the same text across all channels. On web forms, event registration pages, demo request forms and proposal forms, position the WhatsApp consent checkbox as a **separate, optional field**. People who don't give consent should still be able to request a demo.

### 4. Store consent records technically

For each consent, keep the following fields in your CRM:

- Consent status (given / declined / withdrawn)
- Channel (WhatsApp, SMS, call, email)
- Date and time
- Source (form name, URL, event, sales rep)
- Version of the consent text
- İYS sync status

Consent records must be retained for a certain period even after consent expires (the period set out in the legislation is three years). So when consent is withdrawn, don't delete the record; update its status.

### 5. Set up the WhatsApp Business Platform

Small teams sending messages one by one can start with the WhatsApp Business app. For automation, CRM integration and multi-agent use, however, you need the **WhatsApp Business Platform (API)**. Setup requires a verified Meta business account, a separate phone number and approval of your message templates.

### 6. Get templates approved in the right category

Business-initiated messages are sent using Meta-approved templates. Templates fall into three main categories:

- **Marketing:** Promotions, campaigns, event invitations.
- **Utility:** Messages related to an existing transaction, such as meeting confirmations, proposal status or order information.
- **Authentication:** One-time passcodes.

Disguising marketing content as a utility template leads to both reclassification by Meta and legal risk. Add sender information and opt-out instructions to every marketing template.

### 7. Automate the opt-out mechanism

Every marketing message should end with a clear instruction: *"If you don't want to receive these messages, just reply STOP."* Set up a rule that automatically captures replies such as "STOP," "END," "CANCEL" or "I don't want these." This rule should move the contact to "opted out" status in the CRM, update İYS and remove them from all active sequences. Opt-out requests must be applied within **3 business days** at the latest. With automation, you can bring this down to minutes.

## Which channels work for collecting consent in B2B?

Collecting consent is more than a checkbox on a form. In B2B, the most effective sources are:

- **Demo and proposal forms:** The interest is already warm. The question "Would you like to receive demo reminders and follow-up messages on WhatsApp?" gets high acceptance because it directly benefits the buyer.
- **Event and webinar registrations:** A short form opened via a QR code at a trade show booth is far more valuable than a stack of paper business cards. A business card is not consent.
- **Verbal consent during a sales call:** A "yes" to "Would you like me to send the proposal over WhatsApp?" can be a valid source of consent if it's recorded. Keep the call recording or meeting notes, then send the person a consent confirmation message.
- **Double opt-in via email:** Ask a prospect who responds positively in an outbound email sequence, "Would you like me to share the details on WhatsApp?" and document the consent with their reply email.
- **Click-to-WhatsApp ads and website buttons:** When a user starts the conversation, Meta's 24-hour customer service window opens. Replies within this window don't require a template. However, this conversation does not count as automatic consent for subsequent marketing messages. Ask for consent separately.
- **LinkedIn engagement:** Inviting decision-makers who engage with your content on LinkedIn to a WhatsApp community or newsletter list is a natural bridge. Teams that want to run this side consistently can work with [Social Media Corner, which provides B2B LinkedIn management](https://socialmediacorner.co).

A word of caution: Contact details obtained from data providers, however valuable for prospecting, **are not a substitute for consent**. A mobile number you find with tools like [Apollo.io](https://get.apollo.io/679irkzm35ya) gives you a way to reach the person, not permission to message them. Use these numbers first on channels such as email or phone calls, and switch to WhatsApp only after obtaining consent.

## Which messages can you send without consent?

The Regulation recognizes that some messages don't require consent. The most common cases in B2B are:

- **Information related to an existing transaction or contract:** Meeting links, contract renewal reminders, invoice or payment information, subscription changes.
- **Where the recipient provided their own contact details,** messages about the use, maintenance and changes of the product or service provided.
- **Messages sent to tradespeople and merchants** (subject to the limits described above).

The trap here is adding marketing to an informational message. "Your meeting is tomorrow at 10:00 AM. By the way, our new package is 20% off!" is no longer informational; it's a commercial message. Keep information and marketing in separate messages.

## How does the İYS process work in practice?

İYS is the system where recipients' consent and opt-out preferences are held centrally. Recipients can see which businesses they've consented to on which channels and withdraw consent from a single point. So think of İYS not as a one-time upload but as **a source that needs to be continuously synced with your CRM**.

Recommended flow:

1. Consent from a form or call lands in the CRM.
2. Automation sends the consent to İYS and writes the sync status back to the CRM.
3. A pre-send check queries the recipient's current status in İYS.
4. If the recipient has opted out via İYS, the status in the CRM is updated automatically and the contact is removed from all sequences.

This flow prevents costly mistakes like "the CRM showed consent, but they had opted out in İYS." When deciding which data should live where, the distinction in our article on [the difference between CRM and sales automation](/blog/crm-vs-sales-automation) will be useful: the CRM is the system of record, while automation is the layer that acts on those records according to rules.

## How do you connect WhatsApp to your B2B sales flow?

Once your consent infrastructure is in place, WhatsApp can make a real difference at specific points in the sales process. Here's a concrete example flow:

**Scenario:** A 50-person software company wants to convert demo requests into meetings faster.

1. **The demo form is submitted.** The form includes an optional WhatsApp consent checkbox.
2. **If consent is given,** automation sends a message using a utility template within 2 minutes: "Hello Ms. Ayşe, we've received your demo request. You can pick a time that suits you via this link."
3. **Once the meeting is scheduled,** reminders go out 24 hours and 1 hour beforehand. This is one of the simplest ways to reduce no-show rates.
4. **After the demo,** the sales rep sends the proposal by email, and a short WhatsApp note follows: "The proposal has arrived in your inbox. If you have any questions, feel free to message us here."
5. **If the proposal goes unanswered for 7 days,** a task is created for the rep based on the opportunity stage in the CRM. No automated marketing message is sent; a personal follow-up is made instead.
6. **If the contact replies STOP,** all WhatsApp flows stop, and the email sequence is evaluated separately.

You can build this flow with no-code tools. To capture form data via webhook, update the CRM and send templates to the WhatsApp API, the setup in our [B2B sales automation with n8n](/blog/b2b-sales-automation-with-n8n-guide) guide is a good starting point.

A few principles to keep in mind:

- **Don't use WhatsApp as a cold outbound channel.** First contact should be made via email, LinkedIn or phone, and WhatsApp should come into play once the relationship has warmed up. For SaaS companies that want cold outbound handled professionally, [SAAS Corner, which provides outbound and lead generation services specifically for B2B SaaS](https://saascorner.co), can take on this first-contact stage.
- **Keep frequency low.** B2B decision-makers don't like receiving more than one marketing message a week. As your block rate rises, your number's quality drops.
- **Respect business hours.** Sales messages sent outside weekday business hours are intrusive and trigger blocks.
- **Personalize, but don't overdo it.** Name, company and a reference to a previous conversation are enough. Long texts don't get read on WhatsApp. 2–4 sentences is ideal.

## How much does it cost?

The cost of B2B sales on WhatsApp consists of four items:

- **Meta messaging fees:** Template messages are priced by category and the recipient's country. Marketing templates are generally more expensive than utility templates. Replies within 24 hours to a conversation started by the recipient are usually free. Since Meta changes its pricing model from time to time, check the current rates on its own page.
- **Business Solution Provider (BSP) or platform fees:** If you're not connecting to the API directly, the intermediary platform's monthly subscription fee is added.
- **Automation and integration:** Licenses or server costs for tools like n8n and Make, plus setup effort.
- **Compliance costs:** İYS integration, legal review of consent texts, record retention infrastructure.

For a small team, messaging fees are usually the smallest item. The real cost lies in setup and integration effort. To factor this in alongside other automation costs when budgeting, take a look at our guide to [the cost of sales automation in Turkey](/blog/sales-automation-cost-turkey).

## What are the most common mistakes?

- **Treating a business card as consent:** A mobile number on a business card collected at a trade show is not WhatsApp consent.
- **Sales reps messaging from their personal phones:** No consent records are kept, opt-out requests get lost, and when the rep leaves, customer communication leaves with them.
- **Sending campaigns via broadcast lists:** Broadcast lists in the WhatsApp Business app seem practical at small scale, but they offer no consent management or opt-out tracking.
- **Not uploading consent to İYS:** Consent that sits in the CRM but isn't registered in İYS weakens your defense in an audit.
- **Trying to cover everything with a single consent text:** Broad wording such as "messages on any topic from all of our group companies" both erodes trust and makes validity questionable.
- **Bombarding the same content via email after an opt-out:** Even though it's technically a different channel, the recipient's intent is clear. It damages the relationship.

## Frequently asked questions

### In B2B, can I message a company representative on WhatsApp without consent?

The law allows commercial messages to be sent to tradespeople and merchants without consent. However, when you message a representative's personal mobile number, whether this exemption applies becomes debatable and KVKK comes into play. Since Meta also requires opt-in for WhatsApp regardless of the law, the safest approach is to obtain WhatsApp consent from every recipient.

### Is verbal consent valid?

Consent can be obtained through any electronic communication tool. Verbal consent given during a phone call and recorded can be a valid source. What matters is that the consent is stored in a verifiable way with the date, channel and recipient details, and registered in İYS on time.

### Do I need consent for meeting reminders too?

Purely informational messages related to an existing transaction, such as a meeting link or time reminder, are generally not considered commercial messages and don't require consent. However, if you add a campaign or product promotion to that message, it becomes a commercial message. On the WhatsApp API side, the recipient must still have agreed to receive messages through this channel.

### How quickly must I stop sending after a recipient opts out?

The legislation requires sending to stop within 3 business days of the opt-out notice reaching the service provider. Bringing this down to minutes with automation is the right approach for both compliance and customer experience. Don't delete the opt-out record; keep it with an updated status.

## Conclusion

WhatsApp is a powerful channel that can speed up meeting conversion and strengthen follow-up discipline in B2B sales. The key to making that power last is setting up consent correctly. When you put in place a clear consent text that mentions WhatsApp, verifiable records in your CRM, continuous sync with İYS, approved templates and an automated opt-out mechanism, you significantly reduce both legal and platform risk. Rather than relying on the merchant exemption, building a communication channel the buyer has said "yes" to means higher response rates and fewer blocks in the long run.

If you want to set up your WhatsApp consent flow, İYS integration and CRM connections end to end, we can review your current process together. [Schedule a call with the Sales Corner team](/en/iletisim) and add WhatsApp to your sales automation with confidence.
