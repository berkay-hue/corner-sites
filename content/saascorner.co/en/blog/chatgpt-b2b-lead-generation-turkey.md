---
title: "Finding B2B Leads with ChatGPT: Practical Tips for Turkey"
description: "How to build target sector, company and decision-maker lists with ChatGPT and other AI tools. KVKK limits and a step-by-step method, explained."
date: "2026-11-23"
category: "Lead Generation"
image: "https://images.pexels.com/photos/39204830/pexels-photo-39204830.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Finding B2B Leads with ChatGPT: Practical Methods for Turkey"
alt: "chatgpt-ile-b2b-lead-bulma"
---

ChatGPT is not a standalone data source for finding B2B leads in Turkey. Where it really pays off is in the **thinking and processing** part of lead generation: sharpening your ideal customer profile, building company lists from public sources, segmenting those lists, interpreting buying signals and drafting a tailored first message for each company. For contact data (the right person, the right email, the right phone number), you still need B2B data tools and human review.

In this article, we walk step by step through how to fit ChatGPT into your B2B prospecting process, taking sources specific to the Turkish market into account. You'll find prompt templates you can use, a sample weekly workflow, common mistakes and what to watch out for regarding KVKK (Turkey's Personal Data Protection Law). The goal is to drop the "let AI find me customers" mindset and build a measurable, repeatable system.

## What can ChatGPT actually do in lead generation, and what can't it do?

If you don't set expectations correctly, you'll be disappointed by the end of the first week. Ask ChatGPT for "the emails of the procurement managers at 50 logistics companies in Istanbul," and it will either refuse or produce information that looks real but is largely made up. Language models don't "remember" information; they generate probable text. Specific data such as names and email addresses is exactly where that generation is least reliable.

**What ChatGPT does well:**

- Structuring your ideal customer profile (ICP) and buyer personas
- Mapping which types of companies in a sector face which problems
- Generating sensible keyword combinations for search queries (Google, LinkedIn, job boards)
- Cleaning, classifying and standardizing the raw lists you collect
- Extracting buying signals from company websites, press releases or job postings
- Writing personalized opening lines for each segment and each company
- Preparing objection responses and follow-up message variations

**What ChatGPT does poorly, or should never do:**

- "Guess" people's email addresses or phone numbers
- Verify current employees, job titles and company size
- Provide figures such as company revenue or headcount without citing a source
- Make a definitive call on which company is "ready to buy right now"

Versions with web search enabled can browse and summarize public pages. That speeds up research, but it doesn't remove the responsibility to verify. The rule is simple: **every factual claim ChatGPT produces must be tied to a source before it reaches the sales team.**

If you're curious about AI's broader role in sales, take a look at our article on [how AI is transforming lead generation and customer engagement in sales](https://saascorner.co/blog/ai-in-satis).

## Step 1: How do you sharpen your ideal customer profile with ChatGPT?

The most common mistake B2B SaaS companies in Turkey make is defining their target too broadly, as "SMEs" or "manufacturers." There are millions of businesses in Turkey. No message written for a target that broad will feel personal to anyone.

Use ChatGPT as a strategy assistant here. Describe your 10-15 best customers in anonymized form (without company names or personal information) and ask it to identify what they have in common.

**Sample prompt:**

> "We are a B2B SaaS company selling production planning software in Turkey. Our best customers have the following characteristics: [sector, headcount range, city, whether they export, the ERP they use, who makes the purchasing decision, sales cycle length]. Based on this data, suggest 3 distinct ICP segments. For each segment, write: company criteria, decision-maker titles, influencer titles, the segment's 3 biggest operational problems, and 5 observable signals that would let us identify these companies from the outside."

The output of this prompt usually follows a structure like this:

- **Segment A:** Exporting automotive supplier companies with 50-250 employees operating in the Organized Industrial Zones (OSBs) of Bursa, Kocaeli and Manisa. Decision-makers: Plant Manager, Production Planning Manager. Signals: production planning specialist job posting, news of a new production line investment, customer audit requirements.
- **Segment B:** Furniture manufacturers with 20-100 employees that have an ERP but manage production in Excel.
- **Segment C:** Mid-sized food manufacturers that have received an investment incentive certificate for capacity expansion.

Don't accept this output as is. In a 30-minute meeting with your sales team, test each segment with the question: "Do we really close deals easily with these companies?" ChatGPT speeds you up here; it doesn't make decisions for you.

## Step 2: Where do you build a target company list in Turkey?

Turkey's B2B data ecosystem isn't as mature as those in the US or Western Europe. Global data tools work well for large companies but can have gaps when it comes to local SMEs. That makes local public sources highly valuable. ChatGPT's role is to **find, scan and organize** these sources.

### Useful sources specific to Turkey

- **Organized Industrial Zone (OSB) member and company lists:** Many OSBs list the companies in their zone on their websites by sector. This is one of the most valuable sources for manufacturing-focused SaaS companies.
- **Member directories of chambers of industry and commerce:** These can be filtered by province, sector and activity code.
- **Exporters' associations and industry associations:** Their member lists are great for finding export-oriented companies with a growth trajectory.
- **Trade fair exhibitor lists:** Exhibitor lists published on trade fair websites point to companies that are active and willing to spend on marketing.
- **Trade Registry Gazette announcements:** Developments such as capital increases, new branches or changes of trade name can be buying signals.
- **Job boards and LinkedIn:** A company that posts an opening for a particular role is investing in that area.
- **Google Maps and company websites:** Especially useful for local service companies and dealer networks.

### Generating source-scanning queries with ChatGPT

Instead of searching all these sources by hand, ask ChatGPT to generate search queries:

> "Write 15 search queries I can use on Google to find plastic injection molding manufacturers in Kocaeli and Sakarya. Use the site: and intitle: operators, and target OSB company lists, trade fair exhibitor lists and industry association member pages."

Then copy the tables or lists from the pages you find, paste them into ChatGPT and have it turn them into a clean table: company name, city, website, sub-sector. Turning a messy 400-row list from an OSB page into a clean CSV in a few minutes is one of the most tangible time savings ChatGPT offers.

**Important note:** At this step, don't tell ChatGPT to "add" companies that aren't on the list. Ask it to process only the data you provide. Adding the sentence "Do not add any company that isn't on the list; leave fields you're unsure about blank" at the end of the prompt significantly reduces the risk of fabrication.

## Step 3: Cleaning, enriching and segmenting the list

Once your raw list is ready, you need to do three things.

1. **Deduplication and standardization:** "ABC Plastik San. ve Tic. A.Ş." and "ABC Plastik" are the same company. ChatGPT handles this kind of matching quickly. Ask it to convert full legal company names into short trade names and to standardize city names.
2. **Classification from websites:** Using a version with web access, you can have it briefly review each company's website and answer questions like "What do they make, who do they sell to, do they emphasize exports, how many facilities are visible?" Do this in batches of 20-30; feeding it hundreds of companies at once produces poor-quality summaries.
3. **Segment tagging:** Tag each company according to the A, B and C segments you defined in Step 1. Mark those that don't fit as "out of scope."

**Sample prompt:**

> "The table below contains 25 companies and their website descriptions. For each company, fill in the following columns: main product group, target customer type (B2B/B2C/mixed), export emphasis (yes/no/unclear), matching ICP segment (A/B/C/out of scope) and a one-sentence rationale for this decision. If information is missing, write 'unclear'; don't guess."

The "rationale" column is critical. It lets you audit the model's reasoning, and it leaves the sales rep a ready-made note before the call.

## How do you catch buying signals with ChatGPT?

Even a good list will deliver poor results if you don't reach out at the right time. The signals that work particularly well in Turkey are:

- **Job postings:** Openings such as "CRM specialist," "digital transformation lead," "production planning engineer" or "sales operations specialist" indicate budget and need in the related area.
- **Investment and incentive news:** Developments such as a new facility, capacity expansion or an investment incentive certificate trigger the need for new systems.
- **Leadership changes:** A newly appointed sales director or general manager is more open to changing tools and processes in their first months.
- **Trade fair participation:** The few weeks before and after a fair offer a natural opening to talk about sales and marketing tools.
- **Entering new markets:** Companies that start exporting or enter a new country run into operational scaling problems.

ChatGPT serves two functions here. First, when you paste in a job posting or news article, it interprets **what can be inferred from that text in relation to your product**. Second, it suggests a messaging angle based on the signal.

**Sample prompt:**

> "Below is a 'Sales Operations Specialist' job posting a company published on LinkedIn. We provide CRM implementation and sales process consulting to B2B companies. What needs related to this company's sales process can you infer from the posting? Quote the evidence from the posting text. Then suggest two opening lines that address this need without exaggeration and without sounding salesy."

The phrase "quote the evidence" ensures the model ties its interpretation to the text and reduces fabrication.

## How do you find the decision-maker and their contact details?

Once your company list and signals are ready, it's time to reach the right person. ChatGPT's role at this step is limited. Only ask it **which job titles you should be looking for**. For example, at an 80-person manufacturing company, the decision-maker may be the "Plant Manager" or even the "General Manager" rather than the "Procurement Manager." ChatGPT can offer a reasonable framework for the likely decision chain based on company size.

For names and contact data, turn to verified sources:

- **LinkedIn:** One of the most up-to-date sources for matching job titles to companies. If you want to strengthen your LinkedIn profile and content strategy, the approach of [Social Media Corner, which handles B2B LinkedIn management](https://socialmediacorner.co), can give you some ideas.
- **B2B data tools:** Platforms like [Apollo.io](https://get.apollo.io/679irkzm35ya) bring contact discovery with company and title filters and email verification together in one place. Coverage in Turkey varies by sector and company size. When choosing a tool, see [our guide comparing Apollo and Lusha in Turkey](/blog/apollo-vs-lusha-b2b-data-tool-turkey).
- **Company website and switchboard:** Especially with SMEs, the "About Us" and "Our Team" pages, along with calling the switchboard to ask for the right person, are still effective methods.

One useful thing ChatGPT can do here is review the list you export from your data tool. For instance, you can have it filter out people whose titles are "Intern" or "Sales Representative" and who don't meet your decision-maker criteria.

## Step 4: How do you write a personalized first message in Turkish?

This is where ChatGPT is used the most, and misused the most. If you simply say "write me a cold email," you'll get the typical text: it opens with "I hope this email finds you well," runs three paragraphs, lists product features and immediately asks for a 30-minute meeting. Decision-makers in Turkey recognize this tone instantly.

### Components of a good prompt

- **Context:** Who you are, what you sell, which segment you're writing to
- **Signal:** Why you're writing to this company now
- **Tone rules:** The formal "siz" form of address, short sentences, no exaggeration, full use of Turkish characters
- **Length limit:** For example, 90 words maximum
- **A single call to action:** A low-commitment question instead of a meeting request

**Sample prompt:**

> "We sell production planning software to mid-sized furniture manufacturers in Turkey. Buyer: Plant Manager. Signal: last month the company posted a job opening for a production planning engineer. Write a first email of no more than 80 words. Rules: no clichés like 'I hope you're well,' no list of product features, reference the signal naturally, end with a single question. Tone: respectful, clear, the way a peer would write. Also suggest 3 different subject lines, each no longer than 5 words."

**Sample output approach:**

> Subject: About your production planning opening
>
> Hello Mr. Ahmet,
>
> I saw that you're looking for a production planning engineer. At furniture manufacturers of a similar size, much of the first few months in this role goes into keeping Excel plans up to date.
>
> We're building a system that automatically matches this planning with orders. To make things easier for your new hire, may I ask which tool you currently use for planning?

This text isn't perfect, but it's a starting point. **A human should read every message before it goes out.** If the name, title or signal information in particular is wrong, personalization stops being an advantage and turns into a loss of trust.

### Personalization at scale

Instead of having every message written from scratch for a 100-company list, use this structure:

1. Write one master template per segment (3 templates for 3 segments).
2. Have ChatGPT personalize only the **first sentence** for each company. Give it the company's website summary and signal note as input.
3. Write the output to a separate column in your table and use it as a variable in your email tool.

With this method, 80% of the message stays controlled and tested, while 20% is specific to the company. We covered the overall logic of outbound and the core principles of booking meetings in our article on [what outbound sales is and how it delivers qualified meetings in B2B](/blog/what-is-outbound-sales-b2b-qualified-meetings).

## Step 5: Which leads should you go after first?

Say you have a clean list of 300 companies. Your sales team can't reach all of them in the same week. Prioritization is essential.

You can use ChatGPT as a simple scoring assistant. But **you** should define the scoring criteria. A sample model:

- Full fit with the ICP segment: +30
- Strong signal in the last 60 days (job posting, investment news): +25
- Decision-maker identified and email verified: +20
- Export or growth emphasis on the company website: +10
- Indication that they use a competitor's product: +10
- Out-of-scope sector or very small scale: -40

You can give ChatGPT these rules and your table and have it calculate a score for each row. To build a more robust model, use our guide on [how to build a B2B lead scoring model step by step](/blog/b2b-lead-scoring-model). The model should be updated over time with real conversion data. Review every three months which criteria actually turn into meetings.

## What does a sample weekly workflow look like?

The workflow below is an example that a single SDR, or a founder who also handles sales, can run by setting aside roughly 6-8 hours a week. The numbers are a target framework; actual results vary depending on your sector, your offer and the quality of your list.

**Monday (1.5 hours): Source scanning**
- Find 2-3 new sources using queries generated with ChatGPT (OSB lists, trade fair exhibitors, association members).
- Convert the raw list into a table. Target: 100-150 raw companies.

**Tuesday (1.5 hours): Cleaning and segmentation**
- Deduplication, standardization, segment tagging.
- Weed out out-of-scope companies. Remaining: 60-80 qualifying companies.

**Wednesday (2 hours): Signals and contact discovery**
- Scan job postings and news, write signal notes.
- Find decision-makers using your data tool and LinkedIn, and verify emails.
- Score the list and select the 30-40 highest-scoring companies.

**Thursday (1.5 hours): Message preparation and sending**
- Generate the personalized first sentences and check each one individually.
- Send the first wave and run LinkedIn connection requests in parallel.

**Friday (1 hour): Follow-up and learning**
- Categorize incoming replies: interested, not now, wrong person, not interested.
- Give ChatGPT the replies (with personal data removed) and have it summarize objection patterns.
- Make a single change to the template for the following week and test it.

When you keep up this rhythm for a few weeks, you build up both a growing target list and real data on which segments and messages work. If you'd like to connect these repetitive steps with automation tools, our article on [automating your lead generation operation](https://saascorner.co/blog/b2bde-uykusuz-gecelerin-ciktisi-lead-generation-operasyonunu-otomatige-baglamak) is a good starting point.

## Which mistakes undermine results?

These are the mistakes we commonly see in ChatGPT-assisted prospecting:

- **Trusting fabricated data:** The model saying "this company has 120 employees" doesn't mean the company has 120 employees. No source, no data.
- **The same "personal" message for everyone:** "I've been following your company's successful work in the industry" is not personalization. If it doesn't contain a concrete observation, it's a generic message.
- **Turkish that reads like a translation:** Phrases conceived in English and carried over into Turkish (such as "I wanted to reach out because...") erode trust. State explicitly in your prompt "natural Turkish, no translated phrasing," and always do a final read.
- **Prioritizing volume over quality:** It's easy to generate hundreds of messages a day with ChatGPT. But your domain reputation and brand perception will suffer for it. Start with small, well-targeted batches.
- **Carelessly uploading personal data to the model:** This topic deserves its own section.

## What should you watch out for regarding KVKK and commercial electronic messages?

When prospecting B2B in Turkey, two main regulatory areas stand out: the Personal Data Protection Law (KVKK) and the legislation on commercial electronic messages.

**On the KVKK side:**
- Even a corporate email address counts as personal data if it belongs to a real person. You must define the legal basis on which this data is processed and how it is stored.
- Uploading names, emails and phone numbers to tools hosted abroad, such as ChatGPT, is an issue that needs to be assessed in terms of cross-border data transfer. A practical rule: **Give the model company-level data; keep person-level data in your CRM.** If needed for personalization, job title and company information are enough.
- Check the data retention and "do not use for training" settings of enterprise plans.

**On the commercial messaging side:**
- The consent regime for messages to merchants and tradespeople differs from that for individual consumers. In every case, however, you must offer recipients an easy way to opt out (unsubscribe) and keep up with record-keeping obligations.
- Assess how obligations related to the Message Management System (İYS) apply to your situation.

This topic requires legal interpretation. We recommend getting advice from legal counsel before scaling your campaigns.

## How much does it cost?

The direct tooling cost of a ChatGPT-based lead generation system is low. The real cost is time and process. You can think of the line items as follows:

- **ChatGPT subscription:** A paid monthly plan per user is generally sufficient for web search and file processing. For team use, enterprise plans are better suited from a data security standpoint.
- **B2B data tool:** Free tiers are enough to try out contact discovery and email verification. Regular use requires a monthly subscription per user.
- **Email sending and tracking tool:** Set aside a monthly budget for a separate domain, a warm-up period and a sequencing tool.
- **Human time:** 6-8 hours for the weekly workflow above. Multiply that by an SDR's hourly cost and you get the real cost.

A sample calculation: A team member who dedicates 7 hours a week can make personalized contact with roughly 120-160 companies a month. How many of those turn into meetings depends entirely on your offer, your segment and the quality of your messaging. That's why you should track the "cost per meeting" metric for the first two months. If you'd like to hand the system over to a team, teams within our group such as [Sales Corner, which specializes in data-driven B2B sales and lead generation](https://salescorner.co), can run this operation on your behalf.

## Frequently asked questions

### Can ChatGPT give me a customer list directly?

Not reliably. ChatGPT can produce fabricated information, especially for specific data such as names, emails and phone numbers. The right way to use it is to have it process, segment and enrich the list you've collected from public sources.

### In which sectors is it easier to find leads with ChatGPT in Turkey?

The process works faster in sectors with plenty of publicly available company lists. Manufacturing (OSB lists), export-oriented companies (exporters' associations) and sectors that regularly attend trade fairs are examples. For small businesses with a weak digital footprint and no website, ChatGPT's contribution remains limited.

### Do cold emails written with ChatGPT end up in spam?

Spam filters don't look at who wrote the text; they look at sending volume, domain reputation, and link and content patterns. The real risk is that ChatGPT makes it easy to produce large numbers of similar, generic messages. Small batches, verified emails and genuinely personal first sentences reduce this risk.

### Is uploading personal data to ChatGPT a violation of KVKK?

This needs to be assessed based on the version you use, your data processing settings and your legal basis. The safe practice is to give the model company-level information and keep personal data in your CRM. We recommend getting a legal opinion before using it at scale.

## Conclusion

ChatGPT is a powerful assistant that speeds up B2B lead generation in Turkey. But only when used in the right places: sharpening your ICP, building lists from local sources, interpreting signals, prioritizing and drafting personalized messages in Turkish. You need verified tools for contact data, human review for every message and a KVKK-compliant data setup. If you start with small, well-targeted batches and test one thing each week, within a few months you'll have a repeatable prospecting system.

If you'd like to set up a ChatGPT-assisted lead generation process for your team or hand this operation over to an experienced team, [get in touch with SAAS Corner](/en/contact). Let's define your target market together and map out the path to your first qualified meetings.
