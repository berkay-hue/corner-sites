---
title: "AI Meeting Assistants and KVKK: Recording Risk in B2B Sales"
description: "AI assistants that record sales calls and take notes are on the rise in B2B teams. What to watch for on consent, retention and data transfers under KVKK."
date: "2026-10-21"
category: "Trends"
image: "https://images.pexels.com/photos/6285285/pexels-photo-6285285.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "AI Meeting Assistants and KVKK: Recording Risk in B2B Sales"
alt: "ai-toplanti-asistanlari-kvkk-b2b-satis"
---

**AI meeting assistants are not prohibited under KVKK. However, recording, transcribing and summarizing a call is a personal data processing activity. When these tools are used without a privacy notice, without an appropriate legal basis and without regard for cross-border transfer rules, they expose B2B sales teams to both administrative fines and a loss of trust.** In short, the problem is not the tool itself but how it is set up and what the other party is told. A "notetaker" bot that silently joins a meeting can signal secret recording, not efficiency, to a prospect.

Over the past two years, transcription and summarization tools integrated with Zoom, Google Meet and Microsoft Teams have become standard equipment for sales teams. SDRs record discovery calls, AEs push demo summaries into the CRM automatically, and sales leaders coach with conversation analytics. In this article, we use concrete examples to show where these tools create risk under Turkey's legal framework, which steps can make them safe, and how you can build a compliant system without slowing down your sales process.

> Note: This article is for general information only and does not constitute legal advice. We recommend seeking support from a lawyer specializing in KVKK for your own processes.

## What data does an AI meeting assistant actually process?

Many sales teams see these tools as "a helper that takes notes." In reality, a typical AI meeting assistant processes multiple categories of data in a single call:

- **Audio recording:** Participants' voices, tone of voice and speaking time.
- **Video recording:** Facial images if the camera is on, and everything visible during screen sharing.
- **Transcript:** A text version of every word spoken, matched to speaker names.
- **Identity and contact information:** First name, last name, email, company and title pulled from the calendar invite.
- **Derived data:** AI-generated inferences such as sentiment analysis, "interest scores," objection tags and talk/listen ratio.
- **Third-party data:** People mentioned in the call who are not present ("Our procurement manager, Ms. Ayşe, is very sensitive about this").

The last two items on this list are usually overlooked. When a prospect says, "I had surgery last month, so we postponed the process," health data has entered the transcript. Under KVKK, health data falls into the category of **special categories of personal data** and is subject to much stricter rules. Even if you never intended to collect this data, the tool records it, stores it and may even carry it into your summary.

## What are the key risks under KVKK?

### 1. Skipping the obligation to inform

Article 10 of Law No. 6698 requires the data controller to inform data subjects when collecting their personal data. You must tell them who you are, for what purpose you process the data, to whom it may be transferred, the method of collection and the legal basis, and what rights the data subject has. A participant named "Fireflies Notetaker" or "Otter Assistant" joining the meeting does not count as informing anyone. If the other party does not know what it is, where the recording goes and how long it will be kept, the obligation to inform has not been fulfilled.

### 2. The wrong legal basis

The most common mistake sales teams make is trying to solve everything with "explicit consent," or not identifying any legal basis at all. Article 5 of KVKK provides processing conditions other than explicit consent: the establishment or performance of a contract, a legal obligation, and legitimate interest, among others. Recording an onboarding call with an existing customer can be linked to the performance of a contract. Recording a discovery call with a prospect you are speaking to for the first time is far more debatable. Documenting in writing which legal basis you have chosen forms the foundation of your defense if a complaint arises later.

If you rely on explicit consent, it must be **specific, informed and freely given**. Implied statements such as "By joining this meeting, you are deemed to have consented to the recording" struggle to meet this standard.

### 3. Cross-border data transfers

This is the biggest and least discussed risk. The vast majority of AI meeting assistants on the market process data on servers in the US or the EU. The language models used for transcription also often run on third-party infrastructure. This means a call you hold with a prospect in Turkey has been transferred abroad without you even noticing.

Article 9 of KVKK was extensively amended in March 2024, and the new provisions entered into force in June 2024. Under the new system, an adequacy decision is required first for cross-border transfers. If there is none, **appropriate safeguards** such as standard contracts, binding corporate rules or written undertakings come into play. A standard contract must be notified to the Board within 5 business days of signing. There are also limited exceptions for incidental transfers. A server located in the EU does not automatically mean "safe" under Turkish law. Be sure to check current adequacy decisions and the standard contract texts published by the Board.

### 4. The data processor using data to train models

Some tools' terms of use include language stating that customer data may be used to "improve the service." This means what your prospect said during a price negotiation could become training data for an AI model. You need to check whether model training is explicitly excluded in the data processing agreement (DPA).

### 5. The criminal law dimension

KVKK is an administrative regulation, but recording conversations also has a criminal law dimension. Article 133 of the Turkish Penal Code defines recording non-public conversations between individuals without their consent as a crime. Even if you are a party to the conversation, recording without the consent of the other participants may fall within the scope of this article. That is why the defense "but I was in the meeting too" is not a safe harbor.

## How does the risk show up in real life?

To make this concrete, let's consider a fictional but very typical scenario. An Istanbul-based B2B SaaS company with 8 SDRs and 4 AEs holds an average of 40 discovery and demo calls per week. To boost productivity, the sales director connects a popular AI notetaker tool to the entire team's calendars and turns on the "automatically join all meetings" setting.

Three months later, the picture looks like this:

- The tool has recorded roughly 480 external calls. No verbal or written notice was given in any of them.
- Because of the calendar integration, the bot also joined a performance review between the HR manager and an employee, as well as two internal budget meetings.
- Transcripts were automatically pushed into HubSpot, and 25 people, from the sales team all the way to the marketing intern, can access these notes.
- One prospect noticed the bot during a demo, left the meeting and published a LinkedIn post about "unauthorized recording."
- No retention period was defined for any recording; all data sits indefinitely on the vendor's servers in the US.

In this scenario, the company has accumulated serious legal and reputational risk without a single data breach notification. Moreover, none of these risks stem from bad intent; all of them result from accepting default settings without question.

At this point, the issue is not only legal but also a matter of sales ethics. As we emphasized in our article on [the ethical limits of AI in B2B sales and the balance between transparency and trust](https://cornergroup.co/blog/ai-in-b2b-satista-etik-sinirlari-seffaflik-ve-guven-dengesi), B2B buyers are paying increasing attention to how the other side uses technology.

## A step-by-step roadmap for a compliant setup

The steps below offer a practical framework for making AI meeting assistants more KVKK-compliant without sacrificing sales productivity.

### Step 1: Classify your use cases

Not every call carries the same level of risk. Divide your calls into three groups:

1. **Low risk:** Onboarding, training and support calls with existing customers. There is a contractual relationship, and the purpose of the recording is clear.
2. **Medium risk:** Demo and proposal calls with qualified prospects. The other party knows you, but there is no contract.
3. **High risk:** Initial discovery calls, first contacts following cold outbound, and internal HR and legal meetings.

In the high-risk group, recording should be **off** by default and turned on only with explicit approval. HR and legal meetings should be excluded entirely. For more on the legal grounds for cold outreach, take a look at our guide to [KVKK-compliant cold outbound and the legal boundaries in Turkey](/blog/kvkk-compliant-cold-outbound-turkey).

### Step 2: Turn off auto-join

The "join all meetings on the calendar" setting is the most common source of problems. Instead, use one of these options:

- The bot joins only meetings with a specific tag or calendar category.
- The bot joins only meetings that include external participants and are organized by someone on the sales team.
- Manual triggering for each meeting.

### Step 3: Add a privacy notice to the calendar invite

The most efficient way to inform participants is through the meeting invite itself. A sample text:

> "This call will be recorded and transcribed by an AI-powered meeting assistant to facilitate note-taking and follow-up. Recordings are retained for [X] days, are accessible only to the members of our sales team involved in the call, and are processed on [vendor/country]. If you do not want the call to be recorded, simply reply to this email or let us know at the start of the call. You can find our full privacy notice at [link]."

This text alone is not sufficient, but it forms the first line of defense. Make sure the link to the full privacy notice actually exists on your website.

### Step 4: Get verbal confirmation at the start of the call

Give your sales reps a standard sentence to use in the first 30 seconds of the call:

> "Before we start, a quick note: we record our calls with an AI-powered assistant for follow-up notes. Is that okay with you? If you prefer, I can turn the recording off, no problem at all."

This sentence has two benefits. First, it documents consent, or at least the notice, because the confirmation appears in the first line of the transcript. Second, it builds trust. In our experience, most prospects respond positively to this question, and those who decline appreciate being asked. When the answer is "no," the rep should turn off the recording immediately and note this in the CRM.

### Step 5: Apply a vendor due diligence checklist

Before choosing a tool or continuing with your current one, answer these questions:

- In which country is the data processed and stored? Can you choose a region?
- Does the vendor offer a data processing agreement (DPA)? Can this agreement be adapted to the standard contract requirements under KVKK?
- Is customer data used for model training? Can this feature be turned off?
- Who are the sub-processors, and in which countries are they located?
- Can the retention period be configured? Is there automatic deletion?
- Are role-based access controls and access logs available?
- What is the notification period in the event of a data breach?

### Step 6: Define a retention and destruction policy

The "we might need it someday" mindset conflicts with KVKK's principles of proportionality and purpose limitation. A practical model could look like this:

- **Raw audio and video recordings:** Automatically deleted after 30 days.
- **Full transcript:** Retained for 90 days, then deleted.
- **Summary and action items:** Kept in the CRM for the duration of the customer relationship and for the period set out in your personal data retention and destruction policy.

Write these periods into your personal data retention and destruction policy. Also reflect this processing activity accurately in your VERBİS registration.

### Step 7: Filter what goes into the CRM

Having AI summaries flow automatically into the CRM is a major productivity gain. That said, pushing an unfiltered transcript into the CRM also amplifies the risk. The principles we described in our article on [AI-powered B2B CRM record management automation](https://cornergroup.co/blog/ai-ile-b2b-crm-kayit-yonetimi-otomasyonu-veri-girisini-ve-dogrulugu-artirma) apply here as well: only structured data needed for business should enter the CRM.

## How do you build a "clean first, then transfer" workflow with n8n?

Many teams connect their AI notetaker directly to HubSpot or Pipedrive. Placing an automation layer in between instead increases both control and compliance. Here is how a sample workflow built with n8n works:

1. **Trigger:** When the call ends, the meeting assistant sends the transcript and metadata to n8n via webhook.
2. **Consent check:** The workflow checks whether a consent statement appears in the first few minutes of the transcript, or checks the "recording consent" field in the CRM. If there is no consent, the workflow stops and a deletion request for the recording is triggered.
3. **Masking:** Using regular expressions and a language model step, patterns such as Turkish national ID numbers, IBANs, credit card numbers and personal phone numbers are masked. Indications of special categories of data such as health, religion and political opinions are flagged.
4. **Summarization:** Only a business-focused summary is extracted from the cleaned text. Needs, budget range, decision-makers, timing, objections and next steps make up this summary.
5. **Writing to the CRM:** Only this structured summary, not the raw transcript, is added to the relevant opportunity record in the CRM.
6. **Destruction:** When the defined period expires, the raw recording and transcript are deleted via the vendor's API, and the deletion is logged.

This setup gives sales reps the same productivity while significantly reducing the amount of data sent to the CRM. It also lets you clearly show which data is kept where if an audit or a data subject request comes in.

## What should you do if the other party brings their own bot?

There is another side to the coin. Enterprise buyers now also join meetings with their own AI assistants. Your sales rep's voice and words are being recorded in the other party's tool and likely transferred to their CRM or procurement system.

In this case, keep the following in mind:

- **Inform your team:** When the other party arrives with a bot, reps need to be more careful when sharing pricing, discounts and special terms verbally. Everything said can turn into a written record.
- **Don't hesitate to ask:** "I see your assistant is recording. May I ask how the recordings will be used?" is a professional and legitimate question.
- **Move confidential information to written channels:** Rather than sharing trade secrets verbally in the meeting, opt to send them in writing under a non-disclosure agreement.

## How much does it cost?

The cost of a compliant setup is usually lower than expected, and most of it is a one-time effort. You can think of the cost items as follows:

- **Legal counsel:** Privacy notice, legal basis analysis, retention policy and the standard contract process. Varies depending on company size and existing KVKK maturity.
- **Internal process design:** Classifying use cases, calendar templates, verbal confirmation scripts. A few days' work for a small to mid-sized sales team.
- **Automation:** A workflow like the n8n example above can typically be built and tested by an experienced team in anywhere from a few days to a few weeks.
- **Training:** A 60–90 minute training session for the sales team, followed by a short refresher every three months.

What really needs to be calculated is the cost of non-compliance. Administrative fines under KVKK are updated every year by the revaluation rate and can reach substantial amounts. More importantly, in B2B, a prospect's experience of "I was recorded without permission" affects not just that opportunity but other opportunities within that person's network. In enterprise sales, where buying committees are growing, a single negative experience can shake a pipeline built over months of effort.

## What about conversation analytics and sales coaching?

One of the most valuable uses of AI meeting assistants is sales coaching. Metrics such as talk/listen ratio, objection-handling patterns and the depth of discovery questions give sales leaders the ability to provide concrete feedback. We covered [how AI-powered sales coaching boosts B2B team performance](https://cornergroup.co/blog/ai-destekli-satis-koclugu-b2b-ekiplerinin-performansini-nasil-yukseltir) separately. This use case is not independent of KVKK either.

There are two separate groups of data subjects here:

- **Prospects and customers:** The notice and legal basis rules above apply.
- **Your own employees:** Analyzing sales reps' performance with AI is also a personal data processing activity. You need to include this activity in your employee privacy notice and clarify the purpose for which the analyses will be used (coaching, performance evaluation or commission calculation). Avoid making automated decisions based solely on inferences such as sentiment analysis.

A practical recommendation: Run coaching analyses on anonymized or sampled calls. Instead of analyzing every second of every call, select two or three calls per rep per week and review them in depth. This approach complies with the data minimization principle and also improves coaching quality.

## Thinking holistically across outbound and other channels

The AI meeting assistant is not the only data point in the sales funnel. First contact with a prospect is made via cold email or a LinkedIn message, followed up on WhatsApp, then a meeting takes place, and all this data comes together in the CRM. Each channel has its own rules: İYS for commercial electronic messages, KVKK for personal data. For example, [WhatsApp follow-up and İYS consent processes in B2B sales](/blog/whatsapp-b2b-sales-follow-up-iys-consent-guide) involve their own specific rules for post-meeting follow-up.

Rather than making channels compliant one by one, mapping an end-to-end data flow delivers much healthier results. You need to see in a single diagram where data is collected, which tools it passes through, where it is stored and when it is deleted. For B2B SaaS companies that want to design their outbound processes with this discipline, [SAAS Corner's outbound sales and lead generation service](https://saascorner.co) provides support within this framework, as does [Sales Corner's B2B sales approach](https://salescorner.co) for teams that want to build a data-driven sales operation.

## Frequently asked questions

### Is explicit consent required for every call to use an AI meeting assistant?

Explicit consent is not required in every case; KVKK also recognizes other processing conditions such as the performance of a contract or legitimate interest. However, whichever legal basis you rely on, the obligation to inform always applies. In addition, because of the criminal law dimension, obtaining the other party's knowledge and consent is the safest approach, especially for recordings with people you are speaking to for the first time.

### Does storing data on servers in the EU solve the KVKK issue?

No, not on its own. Under KVKK, the EU is also considered abroad, and the transfer must rely on an adequacy decision, appropriate safeguards such as standard contracts, or one of the exceptions listed in the Law. Server location is an important criterion, but it does not replace a legal transfer mechanism.

### What should be done if a prospect objects to the recording?

The recording should be stopped immediately, any portion recorded up to that point should be deleted, and a "no recording consent" note should be added to the CRM. The rep can continue the call by taking manual notes. This approach eliminates the legal risk and also increases your credibility in the prospect's eyes.

### Is it problematic to transfer transcripts directly to the CRM?

Transferring unfiltered full transcripts to the CRM means exposing unnecessary personal data to a wide group of users and may conflict with the principle of proportionality. The recommended method is to mask the transcript in an automation layer and write only a business-focused, structured summary to the CRM. Raw recordings should be deleted automatically at the end of the defined period.

## Conclusion

AI meeting assistants are powerful tools that reduce the note-taking burden on B2B sales teams, enrich CRM data and make coaching more concrete. However, when used with default settings, without a privacy notice and without regard for cross-border transfer rules, they can create legal and reputational risks far greater than the productivity they deliver. The solution is not to abandon the tool but to set it up deliberately. Classify calls by risk level, turn off auto-join, be transparent in the invite and at the start of the call, audit your vendor, limit retention periods and transfer only cleaned data to the CRM.

In B2B sales, transparency is now more than a compliance item; it is a competitive advantage. A rep who asks, "May I record this call?" builds a much stronger relationship than a competitor who records silently.

If you want to set up AI meeting assistants, n8n automations and CRM integrations in your sales processes in a way that is both efficient and KVKK-conscious, you can reach the Corner Group team through our [contact page](/en/contact).
