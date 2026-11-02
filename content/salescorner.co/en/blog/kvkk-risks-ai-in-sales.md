---
title: "KVKK Risks of Using AI in Sales"
description: "What to watch for under Turkey's KVKK when using AI in sales: data processing, privacy notices and cross-border transfers, with a checklist."
date: "2026-11-03"
category: "Artificial Intelligence"
image: "https://images.pexels.com/photos/5833230/pexels-photo-5833230.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "KVKK Risks of Using AI in Sales"
alt: "satista-yapay-zeka-kvkk-riskleri"
---

The biggest KVKK risks of using AI in sales fall under five headings: **processing personal data without a legal basis**, **transferring data to servers abroad without adequate safeguards**, **failing to inform the data subject**, **keeping more data than necessary for longer than necessary**, and **failing to put the right contract in place with the AI provider**. Even when your counterpart in B2B sales is a company, the person whose email, phone number, job title or call recording you process is a real human being. That is why Turkey's Law No. 6698 on the Protection of Personal Data (KVKK) applies directly. AI does not eliminate these risks. On the contrary, it amplifies them, because it processes data faster, across more systems and often far less visibly.

In this article, we explain where AI-powered sales workflows touch personal data, the most common mistakes, the penalty risk, and how to build a KVKK-compliant process step by step. This article is for general information purposes only. We recommend seeking advice from a KVKK specialist or a lawyer for your own processes.

## Where does AI touch personal data in sales?

The first step in managing risk is seeing where data comes in and where it goes. In a typical B2B sales team, AI processes personal data at the following points:

- **Prospecting and lead list building:** First name, last name, job title, business email, phone number and LinkedIn profile URL are collected.
- **Data enrichment:** New fields are added to an existing record: seniority, previous companies, technologies used, social media activity.
- **Personalized email generation:** The person's profile, posts and company information are sent to a language model, which writes a message tailored to them.
- **Call recording and transcription:** Audio is recorded, transcribed, summarized and written to the CRM.
- **Lead scoring and prioritization:** People and companies are scored automatically based on behavioral data.
- **Sales assistants and chatbots:** A bot that talks to website visitors collects their name, email and needs.
- **Individual use by employees:** A rep pastes a 500-row list from the CRM into a general-purpose chatbot and says "segment these."

The last item is usually the least discussed but the riskiest. This kind of use, done without the company's approval, contract or records, is known as "shadow AI." It never shows up in any inventory.

## What are the most common KVKK risks?

### 1. Processing data without a legal basis

Article 5 of the KVKK states that personal data may only be processed if one of certain conditions is met. These conditions are explicit consent, being expressly provided for by law, the establishment or performance of a contract, a legal obligation, the data subject having made the data public, the establishment of a right, and the legitimate interest of the data controller.

The most common misconception in sales teams is this: "It's publicly available on LinkedIn, so I can use it however I want." The "made public" condition only permits processing **limited to the purpose for which the data was made public**. A person opening up their professional profile to build business connections does not mean they have given unlimited permission for that data to be automatically scraped and enriched, analyzed by AI and added to a mass sequence.

In B2B outbound, the more defensible basis is usually **legitimate interest**. However, legitimate interest only applies provided that it does not harm the data subject's fundamental rights and freedoms. If you have not carried out a written assessment showing you struck this balance, you have nothing to show in an audit.

### 2. Cross-border data transfers

Most AI tools used in sales process data on servers outside Turkey. Every prompt you send to a language model may count as a cross-border transfer if it contains personal data.

Article 9 of the KVKK was fundamentally amended in 2024 by Law No. 7499, and the new regime came into force on 1 June 2024. Cross-border transfers can now essentially be made in three ways:

- **Adequacy decision:** A decision issued by the Board for the country in question. As of the date this article was written, there was no adequacy decision in widespread practical use. Check the current status separately.
- **Appropriate safeguards:** Chief among these are the **standard contracts** published by the Board. Binding corporate rules and written undertakings also fall into this category. Once a standard contract is signed, it must be **notified to the Authority within 5 business days**.
- **Exceptions for incidental transfers:** Exceptions such as explicit consent can now only be used for incidental, meaning non-recurring, transfers.

In practice, this means that for an AI tool that processes customer data regularly every day, saying "we got explicit consent from the user" is no longer a sufficient solution. A standard contract must be signed with the provider and notified. Many global SaaS providers do not yet offer the Turkey-specific standard contract on their own initiative. That is why the issue needs to be put on the table at the procurement stage.

### 3. Incomplete contracts with providers and model training on your data

As a rule, the company using an AI tool is the **data controller**, and the company providing the tool is the **data processor**. Article 12 of the KVKK states that the data processor is jointly responsible with the data controller for security measures. This relationship must be defined in a written contract.

Pay particular attention to two questions here:

- **Is the data you send used to train the model?** On some free and individual plans, this is the default setting. On enterprise plans it is usually turned off, but you need to confirm this in the contract and the settings.
- **How long is data retained, and who can access it?** It is common for prompts to be retained for a certain period for abuse monitoring purposes. This period and the scope of access must be set out in writing.

An AI subscription opened with a personal account, paid for with a company card and with a contract nobody has read is a third party processing data on your behalf with no defined obligations.

### 4. Skipping the duty to inform

Under Article 10 of the KVKK, you must inform the person whose personal data you process of who you are, the purpose for which you process the data, who you transfer it to, the method of collection and the legal basis, and their rights. This obligation does not go away if you obtained the data from a data provider or a public source rather than from the person themselves.

In outbound, the practical solution is often to add a short notice and a link to your privacy notice at the bottom of the first outreach email. This notice should explicitly cover AI processing and cross-border transfers. We covered the legal framework of cold email and where it intersects with commercial electronic message legislation in detail in our article on [KVKK-compliant B2B cold email and legal limits](/blog/kvkk-compliant-b2b-cold-email).

### 5. Call recordings and special categories of data

AI note-takers save a great deal of time, but they also carry risk. The first risk is **recording without informing the other party**. Stating at the start of the call that it is being recorded, what the recording will be used for and that it will be processed by AI is a basic requirement.

The second risk is **special categories of personal data** that come up spontaneously during a conversation. When a buyer says, "I had surgery last month, that's why the process was delayed," health data passes into the transcript, from there into the summary, and from there into the CRM. Article 6 of the KVKK imposes much stricter conditions for this category of data. If the audio recording is processed to identify the person, the question of biometric data may also arise.

The practical safeguard is this: add a rule to your summarization instructions such as "do not include personal information like health, religion or political views in the summary," keep the retention period for raw recordings short, and write only business-related information to the CRM. We covered the technical side of this workflow step by step in our article on [automating sales call notes with AI](/blog/automate-sales-call-notes-with-ai).

### 6. Automated scoring and profiling

Article 11 of the KVKK grants the data subject the right "to object to a result arising against them through the analysis of processed data exclusively by automated systems." B2B lead scoring rarely produces a serious adverse outcome for an individual. Even so, using AI to derive personality analyses from a person's social media behavior, generating labels such as "decision-making style," or building profiles that exceed the bounds of proportionality may conflict with the principle in Article 4 of the KVKK that data must be "relevant, limited and proportionate to the purpose."

A safer approach is to base scoring as much as possible on **company-level signals** (industry, size, technology usage, hiring activity) and keep personal behavioral data limited. When building your model, you can consider this balance alongside the criteria in our guide on [building a B2B lead scoring model](/blog/b2b-lead-scoring-model).

### 7. Excessive data collection and indefinite retention

AI enrichment has become so easy that teams add dozens of fields to every record, thinking "it might come in handy someday." Yet one of the core principles of the KVKK is that data should be retained **only for as long as necessary for the purpose for which it is processed**. There is no legitimate reason to keep enriched data on people who did not respond a year ago, no longer fit your ICP, or have left their company.

Identifying which fields actually contribute to sales decisions during enrichment matters for both compliance and efficiency. Our article on [how to do B2B data enrichment in Turkey](/blog/b2b-data-enrichment-turkey-guide) is a good starting point on this topic.

## How big is the penalty risk?

Administrative fines under Article 18 of the KVKK are updated every year in line with the revaluation rate, so quoting a fixed figure would be misleading. Current amounts have upper limits that can reach millions of Turkish lira, particularly for VERBİS registration and data security obligations. With the 2024 amendment, failing to notify the Authority of a standard contract also became a separate ground for penalties.

But fines are not the only risk:

- **Reputational damage:** Board decisions are published. A headline like "Data leaked through a tool used by the sales team" is a serious trust problem, especially for a company selling to enterprise customers.
- **Longer sales cycles:** Procurement and legal teams at large companies now ask their suppliers detailed questions about AI usage and data transfers. A company that cannot answer may see its process drag on for weeks. This further lengthens the already long [B2B sales cycle in Turkey](/blog/b2b-sales-cycle-length).
- **Data subject requests and complaints:** A single complaint to the Board from one annoyed buyer can lead to all your processes being examined.
- **Data breach notification:** When a breach occurs, the Board must be notified as soon as possible. In practice, the Board interprets this period as 72 hours. For a team that does not know which tool holds which data, preparing a notification within this time is almost impossible.

## How do you build a KVKK-compliant AI-powered sales process?

The following steps can be adapted for anything from a 5-person sales team to a 50-person organization.

1. **Create an AI inventory.** List every AI tool used by the team. This includes browser extensions, individual chatbot accounts, note-takers and AI features inside the CRM. For each, write down what data it processes, where the data is stored and whose account it is used under. This exercise usually takes 1-2 weeks and is full of surprises.

2. **Draw a data flow map.** Show on a single page the source of personal data (data provider, web form, LinkedIn, calls), the tools it passes through and its final destination (CRM, email tool, archive).

3. **Determine the legal basis for each processing activity.** Put mappings such as "legitimate interest for cold outbound" and "pre-contractual process for post-demo follow-up" in writing. Where you rely on legitimate interest, add a short balancing test note.

4. **Identify and secure cross-border transfers.** Find out the server location for each tool. If there is a cross-border transfer, start the standard contract process and schedule the 5-business-day notification deadline. If the provider does not support this, consider an alternative tool or a way of using it that does not send personal data.

5. **Complete your data processing agreements.** Put model training, retention periods, sub-processors, breach notification and data deletion in writing. Move individual accounts to enterprise accounts.

6. **Apply data minimization in prompts.** For email personalization, you usually do not need to send the person's email address or phone number to the model. Job title, industry and company information are often enough. Where possible, mask names and contact details and merge them back into the output afterward.

7. **Update your privacy notice.** Add information about AI processing, profiling and cross-border transfers. Include a link to this notice in outbound emails and meeting invitations.

8. **Set retention and deletion rules.** For example: enriched data on non-responders is deleted after 12 months, raw call recordings are destroyed after 30-90 days, and summaries are kept for a set period after the opportunity closes. Set the periods based on your business needs. What matters is having a written rule that is applied automatically.

9. **Restrict access.** A setup in which every rep can export the entire database is the source of shadow AI risk. Restrict export permissions by role.

10. **Train the team and write a short usage policy.** Even a one-page "What not to paste into AI" list makes a significant difference. On this list, customer contact details, contract texts, price quotes and call recordings should never go into anything other than approved tools.

Thinking about these steps at the start of an automation setup is far cheaper than fixing things afterward. Tools you can run on your own servers make it easier to control data location. For example, when setting up [B2B sales automation with n8n](/blog/b2b-sales-automation-with-n8n-guide), it is possible to host the workflow on a server in Turkey and send only masked data to the AI step.

## A concrete example: two versions of the same outbound workflow

Imagine an 8-person sales team selling software. Their targets are operations managers in the manufacturing sector.

**The risky version:**

- A rep pulls a 300-person list from LinkedIn using an extension.
- They paste the list into their personal chatbot account and say "write a personal email for each one." The list contains names, emails, phone numbers and profile summaries.
- An enrichment tool adds personal phone numbers and personal social media accounts for each person.
- The emails contain no privacy information and no unsubscribe option.
- Non-responders sit in the CRM indefinitely.

This workflow has at least five separate problems: an unclear legal basis, data sent without a contract and probably abroad, model training risk, no privacy notice, and indefinite retention.

**The safer version:**

- The list is pulled from a data platform whose source and collection method are documented, and includes only people who match the ICP criteria.
- Personalization uses data such as company name, industry, job title and company news, with a language model on an enterprise plan with model training turned off. Email addresses and phone numbers are never sent to the model.
- Enrichment is limited to business contact information and company-level fields.
- The first email states the sender's identity and how the data was obtained, and includes a link to the privacy notice. An easy opt-out option is offered.
- Once the 3-step sequence ends, non-responders are automatically deleted within 12 months.

The second version is not entirely risk-free either. But in an audit you can show what you did and why. That is what ultimately counts in KVKK compliance. What's more, with narrower and more precise targeting, the second version usually delivers a better response rate.

## What questions should you ask when choosing an AI tool?

At the procurement or trial stage, ask the provider the following questions in writing:

- In which countries, and on which providers' infrastructure, is data processed and stored?
- Is the data we send used to train your model? Is this turned off by default?
- How long are prompts and outputs retained? Can you delete them on request?
- Can you share a list of your sub-processors?
- Are you prepared to sign the standard contract under the KVKK?
- How quickly will you notify us in the event of a data breach?
- Do you support role-based access, audit logs and single sign-on (SSO)?

For prospecting and contact data platforms, add one more question: **How is the data collected, and can its sources be documented?** For example, if you use a global data platform such as [Apollo.io](https://get.apollo.io/679irkzm35ya), you need to clarify cross-border transfer and data source issues at the contract stage and limit the fields you export to what you actually need. For a general evaluation framework, see our article on [6 criteria to consider when choosing an AI tool for sales](/blog/how-to-choose-ai-sales-tool).

If you are considering outside support rather than building your outbound processes in-house, remember that your service provider is also subject to the same rules as a data processor. For example, when working with a team such as [SAAS Corner](https://saascorner.co), which runs outbound and lead generation for B2B SaaS companies, data sources, retention and transfers still need to be defined in the contract.

## Frequently asked questions

### Does the KVKK apply to B2B sales too?

Yes. The KVKK protects the data of natural persons, not legal entities. However, the names, business emails, phone numbers and job titles you process in B2B sales belong to natural persons. So the fact that your counterpart is a company employee does not prevent the law from applying.

### Is uploading a customer list to a tool like ChatGPT a KVKK violation?

It is not automatically a violation in itself. However, it poses a serious risk if there is no legal basis, no cross-border transfer safeguard, no data processing agreement and no privacy notice. If it is done with a personal account, on a plan open to model training and without the company's knowledge, the risk of a violation is very high.

### If I obtain explicit consent, are all my problems solved?

No. Explicit consent must be freely given and specific to a particular matter, and it can be withdrawn at any time. Since the 2024 amendment, explicit consent is also no longer the primary method for regular cross-border data transfers. In sales processes, a properly designed structure using tools such as legitimate interest and standard contracts is usually more sustainable.

### Do cold emails written with AI require separate permission?

The fact that an email was written with AI does not require any additional permission. What matters is whether you have the right to send the message to the recipient under commercial electronic message legislation and the KVKK. The use of AI, however, should be addressed separately in your privacy notice and provider contracts.

## Conclusion

Using AI in sales is not contrary to the KVKK. What is risky is using it without knowing where the data goes, on what basis it is processed and how long it is retained. Creating an AI inventory, securing cross-border transfers, sending only the necessary data in prompts, updating your privacy notice and automating retention periods make most of the risk manageable. These steps also mean a cleaner database, more precise targeting and a sales team ready to answer enterprise customers' security questions.

If you want to build your AI-powered sales automation on an architecture that takes the KVKK into account from the start, or review your existing workflows, [schedule a call](/en/iletisim) with the Sales Corner team. Let's map together which data flows where and build a secure, efficient setup.
