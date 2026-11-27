---
title: "How to Classify Outbound Replies with AI: A Guide"
description: "Learn how to classify outbound email replies with AI, with examples of interested, objection, referral and negative responses."
date: "2026-11-28"
category: "AI"
image: "https://images.pexels.com/photos/7651572/pexels-photo-7651572.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Guide to classifying outbound replies with AI"
alt: "outbound-yanitlarini-yapay-zekayla-siniflandirma"
---

Classifying outbound replies with AI means having a language model read every incoming email reply and automatically sort it into predefined categories such as **"interested", "meeting request", "not now", "wrong person", "out of office", "negative" and "unsubscribe"**. The model also triggers the next action based on the category: it updates the CRM record, stops the sequence, notifies the sales rep or creates a future-dated reminder. Set up correctly, inbox triage shrinks from hours of work to a few minutes of review, and the risk of hot leads slipping through the cracks drops significantly.

In this guide, we use concrete examples to show you how to design your category structure, what instructions to give the model, how to set everything up step by step, how to measure accuracy and which mistakes to avoid. Teams that receive a few hundred replies a week, or that run outbound across multiple domains and inboxes, will get the most out of this guide.

## Why does outbound reply classification matter so much?

In outbound campaigns, getting a reply is only half the job; the other half is handling that reply correctly and quickly. Consider a typical scenario: a team sending a total of 250 emails a day from 5 inboxes makes roughly 1,250 touches a week. With a reply rate of around 4%, that's 50 replies a week. A large share of them are out-of-office notices, "we're not interested" responses or "take me off your list" requests. The 5–8 people who are genuinely interested get lost in the pile.

Manual handling has three core problems:

- **Delay:** There's a big difference between responding to an interested reply within the first few hours and responding two days later. The buyer's interest is hot in the moment, then it cools off.
- **Inconsistency:** One rep counts "We don't have budget right now, let's talk in Q3" as negative, while another flags it as a future opportunity. That makes your reports unreliable.
- **Compliance risk:** If the next step in a sequence goes out to someone who said "Take me off your list," you'll face both reputational and legal problems.

AI-powered classification solves all three problems at once: it tags each reply within seconds, makes decisions using the same rules every time and automatically executes critical requests (such as unsubscribes).

Classified data also helps you understand why your campaigns aren't working. If "wrong person" replies are high, you have a targeting problem; if "not now" replies are high, you may have a timing or offer problem. We recommend reading about these kinds of diagnoses alongside our post on [7 common mistakes that explain why your outbound reply rate stays low](/blog/why-outbound-reply-rate-is-low).

## Which categories should you use?

The quality of your classification depends on category design before it depends on the model. Use too few categories and the split is too coarse to act on. Use too many and the model becomes indecisive on borderline replies. In practice, **8–10 main categories** is a balanced starting point for most B2B teams.

### Recommended core category set

1. **Meeting request / positive:** "Does next Tuesday work?", "Let's have a quick call."
2. **Information request:** "Can you share your pricing?", "Which integrations do you support?"
3. **Not now / later date:** "Our budget cycle is in September, write to us again then."
4. **Wrong person / referral:** "This is a matter for our procurement team, please write to Ayşe."
5. **Objection:** "We already use a similar solution," "Your prices are too high for us."
6. **Negative / not interested:** "Thanks, we don't need this."
7. **Unsubscribe / no contact requested:** "Please don't email me again."
8. **Auto-reply – out of office:** "I'm on leave until July 15."
9. **Auto-reply – left the company:** "This person no longer works at our company."
10. **Unclear / human review:** Anything the model isn't sure about.

### Adding sub-tags

Beyond the main category, extracting a few additional details makes the follow-up actions much easier:

- **Date information:** Generating a concrete date from phrases like "in September," "in three months" or "after the holiday."
- **Referred contact:** The name, title and, if available, email address of the new person mentioned in the reply.
- **Objection type:** Price, existing vendor, timing, authority or no need.
- **Sentiment:** Neutral, positive, annoyed. Annoyed replies should be flagged separately.

For example, you can collect replies carrying the price objection sub-tag in a separate list and route your reps to templates built on the framework from our post on [how to respond to price objections in B2B sales](/blog/b2b-sales-price-objections).

## How does AI classify a reply?

Today, large language models (LLMs) are typically used for this job. With the classic machine learning approach, you had to train a model on thousands of labeled examples; with LLMs, a well-written instruction (prompt) and a few examples are usually enough.

The process works roughly like this:

1. A new reply arrives; the email body, subject line and, ideally, the last message you sent are pulled together.
2. The text is cleaned: quoted previous messages, signatures and legal disclaimers are stripped out.
3. The cleaned text is sent to the model along with an instruction containing the category definitions.
4. The model returns a structured output (usually in JSON format).
5. The automation tool reads this output and takes action based on the category.

### Example prompt structure

A prompt like the one below is a good starting point:

> You are a B2B outbound reply classifier. Assign the email reply below to exactly one of the given categories. Categories and their definitions: [list]. If the reply mentions a date, extract it in ISO format; today's date is {date}. If the reply refers you to another person, extract their name, title and email. If you're not sure, choose the "unclear" category. Return the output only in the JSON format below.

The expected output looks something like this:

```json
{
  "category": "not_now",
  "confidence": 0.88,
  "follow_up_date": "2025-09-15",
  "referred_contact": null,
  "objection_type": "timing",
  "tone": "neutral",
  "short_summary": "Budget planning happens in September; they want to be contacted again then."
}
```

The **"confidence" field** is critical here. Asking the model to provide its own confidence score isn't a perfect measure, but it gives you a practical threshold for routing low-scoring replies to human review.

### Why do few-shot examples work?

Adding 2–3 real examples from each category to the prompt noticeably improves accuracy. Indirect phrasing is especially common in Turkish replies. "We're busy right now, we'll look at it later" is sometimes a polite rejection and sometimes a genuine timing issue. Examples selected from your own inbox teach the model how to make that distinction in your context.

## How do you set it up step by step?

The steps below work for small teams as well as agencies managing multiple inboxes.

### 1. Collect your existing replies

Export your outbound replies from the last 3–6 months. Your sending tool's reply history, your inbox archive or your CRM records can all serve as sources. At this stage, a sample of **200–300 replies** is enough. Make sure your sample includes replies from both personal and corporate addresses, in both Turkish and English.

### 2. Write your category dictionary

For each category, write a one-sentence definition, 2–3 examples and **boundary rules**. Examples of boundary rules:

- "Reply asks about pricing but doesn't want a meeting → information request."
- "Negative reply, but says 'maybe in the future' → not now."
- "Contains both an out-of-office notice and a referral → wrong person / referral, because that's the information that requires action."

These rules are essential for your team before they're essential for the model; if two reps label the same reply differently, you can't expect the model to be consistent.

### 3. Build a gold-standard dataset

Have two different people independently label 100 of the replies you've collected. Discuss the replies they disagree on, settle them together and update the dictionary. These 100 replies will become your **test set** for measuring the model's performance.

### 4. Write and test the prompt

Once you've written the prompt, send the 100 replies in your test set to the model and compare the results with your labels. Seeing agreement in the 75–85% range on the first attempt is normal. Review the misclassified replies, add new rules to the dictionary or prompt and test again. Agreement usually rises noticeably within 3–4 iterations.

### 5. Build the automation workflow

Once the classifier is ready, you need to place it between your inbox and your CRM. A typical workflow:

1. **Trigger:** A "reply received" webhook from your sending tool, or a new email in the inbox.
2. **Cleaning:** A step that strips out quoted text and signatures.
3. **Classification:** The LLM call and parsing of the JSON output.
4. **Routing:** A structure that branches by category (switch/router).
5. **Action:** CRM update, Slack/Teams notification, sequence stop, reminder creation.
6. **Logging:** Writing each classification, with its input and output, to a table.

Visual automation tools are ideal for building this workflow without writing code. If you're looking for an option you can run on your own server, our [beginner's guide to setting up B2B sales automation with n8n](/blog/b2b-sales-automation-with-n8n-guide) covers the technical side of these steps in detail. If you manage your sequences in a prospecting platform like [Apollo.io](https://get.apollo.io/679irkzm35ya), you can connect reply events to the same workflow via webhook or integration.

### 6. Add a human approval layer

For the first 2–4 weeks, run the automation in "shadow mode": let the model classify and suggest actions, but have a human approve the critical ones. Human approval should remain permanently in place for:

- Replies with a confidence score below 0.7
- The "unclear" category
- Replies with an annoyed tone
- Automatically emailing the new person in referral replies

### 7. Measure and improve

Check 20–30 random classifications every week. Add the replies where you spot errors to your test set. Over time, your test set grows and your classifier adapts better to your market, your product and your buyers' language.

## What action should follow each category?

The value of classification lies in the action that follows it. The mapping below is a good starting template for most teams:

- **Meeting request:** Stop the sequence immediately, move the record to the "opportunity" stage in your CRM, send an instant notification to the relevant rep and prepare a reply draft that includes a calendar link. The goal should be to respond within the first few hours.
- **Information request:** Stop the sequence, tag the topic of the question (pricing, integration, references, etc.) and suggest the relevant content template to the rep.
- **Not now:** Stop the sequence and create a reminder in your CRM based on the date the model extracted. If no date was given, default to 90 days later.
- **Wrong person / referral:** Create the referred person as a new contact, link them to the original contact and prepare a custom sequence draft that opens with "Mr. X referred me to you." These replies often provide a warmer starting point than a cold email.
- **Objection:** Record the objection type and suggest the objection-specific reply template to the rep. Report the distribution of objections at the campaign level.
- **Negative:** Stop the sequence, mark the record as "closed – not interested" and block it from being added to new sequences for at least 6–12 months.
- **Unsubscribe:** Remove the person from all sequences and future lists immediately and add them to your suppression list. This category should **never wait for human approval**; it must be applied automatically and instantly.
- **Out of office:** Extract the return date, pause the sequence until that date and resume where it left off 1–2 days after their return.
- **Left the company:** Deactivate the record; if the reply names a new person, add them as a contact. Finding the person who left at their new company can also be a separate opportunity.

Regularly feeding "left the company" and invalid-address signals back into your list is one of the cheapest ways to maintain data quality. Our [B2B guide to reducing your email bounce rate](/blog/reduce-email-bounce-rate) offers complementary steps on this topic.

## How do you measure accuracy?

The answer to "Is the model working correctly?" isn't a single percentage. Categories carry different business risks, so you need to look at each one separately.

### Three core metrics

- **Overall accuracy:** What percentage of replies in the test set were assigned to the correct category?
- **Precision:** When the model says "meeting request," how often is it actually a meeting request? Low precision means reps wasting time on empty notifications.
- **Recall:** What percentage of real meeting requests did the model catch? Low recall means missing hot leads.

### Which metric takes priority in which category?

- **Meeting request and information request:** Recall takes priority. Missing a hot lead is far more expensive than a false notification.
- **Unsubscribe:** Recall must be near-perfect. In doubtful cases, the model should lean toward choosing this category.
- **Negative:** Precision takes priority. Permanently closing out someone who was actually saying "not now" leads to lost opportunities down the line.

### Use a confusion matrix

Track which categories get confused with one another using a simple table. The most common confusions usually occur between "not now" and "negative," and between "information request" and "meeting request." Adding extra examples and clear boundary rules for these pairs to your prompt usually solves the problem.

## How much does it cost?

Reply classification is one of the lowest-cost AI applications. That's because the inputs are short: a cleaned outbound reply rarely exceeds a few hundred words.

Let's do a rough calculation:

- Assume one request, including the prompt, category definitions and examples, averages 1,500–2,500 tokens.
- Assume the output JSON is 100–200 tokens.
- Assume you process 2,000 replies a month.

In that case, monthly token consumption stays at the level of a few million tokens. Given the pricing of the small and mid-sized models that are sufficient for classification today, this volume generally translates to an API cost of **somewhere between a few dollars and a few tens of dollars a month**. The exact figure depends on the current price list of the model and provider you choose.

The main cost items are usually:

- **Automation platform:** Per-operation pricing for cloud-based tools; server costs for tools you run on your own server.
- **Setup and maintenance effort:** Preparing the category dictionary, building the test set and running weekly checks.
- **Integration:** Establishing the data flow between your CRM and your sending tool.

On the savings side, think about rep time. An SDR who manually reads and tags 30–40 replies a day, logs them in the CRM and stops sequences can easily spend 1–1.5 hours a day on this work. Shifting most of that time to conversations with hot leads typically makes the return on investment visible within the first few months.

## What should you watch for regarding KVKK (Turkey's data protection law) and data security?

Outbound replies contain personal data: first and last names, email addresses, job titles, phone numbers and sometimes personal circumstances (leave, health, departure, etc.). Before sending this data to an AI provider, you need to answer these questions:

- Does the provider use the data you send for model training? This is usually turned off in enterprise API plans, but check the contract.
- In which country is the data processed and stored? Evaluate the requirements for cross-border transfers.
- Are the phone numbers and personal details in signature blocks necessary for classification? If not, mask them before sending them to the model.
- How quickly do you act on unsubscribe and objection requests, and can you prove it?

The principle of "data minimization" is especially useful here: the model only needs the reply body for classification; sending the sender's address, signature and previous correspondence history is usually unnecessary. You can find the legal framework in more detail in our post on [the KVKK risks of using AI in sales](/blog/kvkk-risks-ai-in-sales).

## What are the most common mistakes?

These are the mistakes we see most often in the field:

1. **Not cleaning out quoted text.** The model also reads your original message below the reply, picks up the word "meeting" from your text and misclassifies the reply. The cleaning step must not be skipped.
2. **Not defining an "unclear" category.** If you force the model to assign every reply to a category, it will guess when it isn't sure. There should always be an escape category.
3. **Not providing today's date for date calculations.** For the model to convert phrases like "next month" or "after the holiday" into the correct date, it needs to know the reference date.
4. **Automating every action from day one.** If you skip shadow mode, misclassifications can turn into emails sent directly to prospects.
5. **Ignoring multilingual replies.** Even in campaigns run from Turkey, some replies come in English. Your test set should include examples in both languages.
6. **Not reporting on classification data.** Tags should be used not only for actions but also for campaign diagnosis. Regularly track which segment, which message and which sequence produces which type of reply.
7. **Setting up the model once and forgetting about it.** A new product, a new target segment or a new messaging tone changes the reply distribution. Review your prompt and examples every quarter.

Reply classification is an integral part of large-scale outbound operations. If you'd rather opt for an end-to-end managed process than build this infrastructure with your own team, [SAAS Corner, which provides outbound sales and lead generation services](https://saascorner.co) for B2B SaaS companies, handles these kinds of workflows together with campaign management.

## Frequently asked questions

### Which AI model should I choose for reply classification?

Because classification is a relatively simple task, you usually don't need large, expensive models. A small or mid-sized model that supports structured JSON output and understands Turkish well is sufficient in most scenarios. Before choosing, the most reliable method is to compare two or three models using your own 100-reply test set.

### Can AI classification completely replace human review?

For routine categories (out of office, unsubscribe, clear rejection), it largely can. However, human review should permanently remain in place for replies with low confidence scores, unclear replies and replies with an annoyed tone. The healthiest setup is a hybrid model in which AI handles the initial screening and routine actions while humans make the critical decisions.

### How many replies do I need for this system to make sense?

If you're below 20–30 replies a week, manual handling is usually enough, although building a category dictionary still provides reporting consistency even at this stage. Once your weekly reply count exceeds 50, or when you manage multiple inboxes, automation starts delivering significant time savings. For agencies and teams running multiple campaigns, it becomes almost essential.

### How can I use classification results to improve my campaigns?

Report the category distribution for every campaign, segment and sequence step. If the "wrong person" rate is high, review your targeting and job title filters; if "objections" are dominated by pricing, strengthen your value proposition; if "not now" is common, rethink your timing and trigger signals. This data gives you a much clearer diagnosis than looking at reply rate alone.

## Conclusion

Classifying outbound replies with AI turns inbox chaos into an organized, action-oriented workflow. The secret to success isn't the model, it's the preparation: a clear category dictionary, a test set built from real replies, cleaned inputs, human approval based on a confidence threshold and concrete actions tied to each category. With these foundations in place, you'll respond to hot leads faster, honor every unsubscribe request and see, based on data, why your campaigns are or aren't working.

Start small: collect the last three months of replies, write a dictionary with 8–10 categories and run your first test. If you'd like to get the setup up and running quickly, integrated with your own CRM and sending infrastructure, [schedule a call](/en/contact) with the Sales Corner team and we'll design a reply classification workflow that fits your needs together.
