---
title: "How to Build a Target Account List in B2B"
description: "How do you build a target account list in B2B? A practical, Turkey-specific method covering ideal customer profile, data sources and scoring steps."
date: "2026-10-26"
category: "Marketing"
image: "https://images.pexels.com/photos/8192051/pexels-photo-8192051.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "How to Build a Target Account List in B2B"
alt: "b2b-hedef-hesap-listesi-nasil-olusturulur"
---

In B2B, a target account list is **a limited list of companies that best match your ideal customer profile (ICP), selected and prioritized using data, and worked on jointly by your sales and marketing teams.** To build it, you first analyze your best existing customers. From that analysis, you derive measurable ICP criteria, scan the entire market for companies that meet them, and then score and tier those companies based on fit and buying signals. In the final step, you map the decision-makers at each account and import the list into your CRM with account owners assigned.

This definition looks simple on paper. In practice, though, most B2B SaaS companies either work from a messy spreadsheet with tens of thousands of rows under an "everyone is a potential customer" mindset, or they chase a handful of big names the founder has in mind. Either way, the outcome is the same: SDRs waste time on the wrong companies, the marketing budget gets spread thin, and the pipeline becomes unpredictable. In this article, we use concrete examples to show how to build a target account list from scratch, how many accounts you should work with, how to score them, and how to keep the list current.

## What is a target account list, and how does it differ from a lead list?

A lead list is made up of **people**, while a target account list is made up of **companies**. The difference may seem small, but it fundamentally changes your sales strategy.

In a lead-based approach, you follow up with whoever fills out a form or replies to an email. In an account-based approach, you first ask, "Which companies do we want to work with?" Then you reach the buying committee inside those companies. In B2B SaaS, purchasing decisions are rarely made by a single person. For HR software, the HR director, finance manager, IT lead and sometimes the general manager all get involved. That's why thinking in terms of accounts produces more realistic results.

A good target account list has the following characteristics:

- **It's limited:** It contains only as many accounts as your team can realistically work.
- **It's justified:** The reason each account is on the list can be explained with written criteria.
- **It's prioritized:** Not all accounts are equal. There are tiers.
- **It's owned:** Every account has an owner in the CRM.
- **It's live:** It's updated regularly and fed with new signals.

## Why can't you build a list without an ICP?

The quality of your target account list is directly proportional to the clarity of your ideal customer profile. "Mid-sized and large companies" is not an ICP. You need measurable, filterable criteria. We recommend defining your ICP in three layers:

### Firmographic criteria

- Industry (e.g., manufacturing, logistics, retail, finance)
- Employee count range (e.g., 200–1,000)
- Geography (e.g., Turkey, especially the Marmara and Aegean regions)
- Approximate revenue band
- Company structure (holding subsidiary, independent, or multi-location)

### Technographic criteria

- The ERP, CRM or accounting software they use
- Systems you need to integrate with
- Whether they use a competing solution
- Their status in migrating to cloud infrastructure

### Behavioral and situational criteria

- Are they currently hiring for relevant roles?
- Is there a new investment, plant or branch opening?
- Has there been a change in senior leadership?
- Have they visited your website or engaged with your content?

An ICP also ensures that marketing and sales speak the same language. If you want to reduce debates over whether an account is qualified, it helps to map the definitions in [our guide explaining the difference between MQL and SQL](/blog/what-is-mql-mql-vs-sql-b2b-saas) to your ICP criteria.

## How do you build a target account list step by step?

We've laid out the seven steps below in the order we apply them in the field with B2B SaaS companies operating in Turkey. As an example, we'll use a fictional SaaS company that sells shift and workforce management software to mid-sized manufacturers.

### 1. Analyze your existing customers

Start from the inside, not the outside. Pull customer data from the last 12–24 months from your CRM and billing system, and ask these questions:

- Who are the top 20 customers by annual contract value (ACV)?
- Which customers closed with the shortest sales cycle?
- Which segment has the lowest churn rate and the highest expansion revenue?
- Which customers open the fewest support tickets and use the product most intensively?

The customers at the intersection of these four questions are your "golden segment." When the SaaS company in our example runs this analysis, it might find that most of its best customers are companies with 250–800 employees, at least two production facilities and shift-based operations. If you have no customers or very few, do this step using feedback from sales calls and pilot users. Write down your hypothesis explicitly and test it within the first 90 days.

### 2. Make your ICP criteria written and filterable

Turn the patterns from your analysis into criteria that can be used directly as filters in a data tool. For our example, the ICP could be written as follows:

- **Industry:** Automotive suppliers, textiles, food manufacturing, home appliance suppliers
- **Employee count:** 200–1,000
- **Location:** Turkey, at least two production facilities
- **Technology:** Uses a local ERP, does shift planning in Excel
- **Trigger:** Job postings in production or HR within the last 6 months

Also write down your **exclusion criteria** here. For example, companies with fewer than 50 employees, public institutions or software companies that compete with you should not make the list. An exclusion list significantly reduces the hours you'll spend cleaning up the list.

### 3. Map your total addressable market (TAM)

Find all the companies that match your ICP criteria. At this stage, the list is broad and not yet prioritized. Sources you can use:

- **B2B data platforms:** Tools that let you pull company and contact data using filters. For example, on [Apollo.io](https://get.apollo.io/679irkzm35ya) you can build your first raw list in minutes using filters for industry, employee count, location and technology used.
- **LinkedIn Sales Navigator:** A powerful source, especially for company growth signals and people moves.
- **Member lists of chambers of industry, organized industrial zones and industry associations:** For the manufacturing sector in Turkey, these are often more comprehensive than global databases.
- **Trade show exhibitor lists:** Exhibitor pages for industry trade shows are a valuable source for niche markets.
- **Your own CRM:** Opportunities that were contacted but never closed, lost customers and old demo requests.

If you're considering buying a ready-made list, first assess the quality and legal compliance risks. We covered this topic in detail in [our article on whether buying a B2B customer list is safe](/blog/is-buying-b2b-customer-lists-safe).

In our example, let's assume this step produces a raw TAM list of about 2,500 companies.

### 4. Clean and enrich the data

A raw list is almost always dirty. Different spellings of the same company, defunct businesses, holding companies mixed up with their subsidiaries and incorrect industry tags are common. In this step:

1. **Deduplicate:** Use the website domain as the unique key. Company names can be written in many different ways with Turkish characters and suffixes like "A.Ş." and "San. ve Tic."
2. **Clarify holding structures:** Decide which subsidiary you'll sell to. Are purchasing decisions usually made at headquarters or at the subsidiaries?
3. **Fill in missing fields:** Fields you'll use for scoring, such as employee count, number of locations and technology used, should not be left blank.
4. **Apply the exclusion list:** Existing customers, active opportunities, competitors and partners should be tagged separately.

After this cleanup, the 2,500-company list usually shrinks noticeably. In our example, let's assume it comes down to around 1,800.

### 5. Score and tier your accounts

Scoring is the heart of the list. A simple but consistent model always beats a complex one that nobody understands. We recommend a two-axis approach: a **fit score** (how closely the account resembles your ICP) and an **intent/signal score** (how close it is to buying right now).

Sample fit scoring (100 points total):

- Exact industry match: 25 points
- Employee count in ideal range (250–800): 20 points; in acceptable range (200–250 or 800–1,000): 10 points
- Multiple facilities: 15 points
- Uses a compatible ERP: 15 points
- Shift-based operating model: 15 points
- Headquartered in Turkey: 10 points

Sample signal scoring (50 points total):

- HR or production planning hiring in the last 6 months: 15 points
- News of a new facility or investment: 15 points
- New executive in HR or operations: 10 points
- Has visited your website or engaged with your content: 10 points

Use these two scores to sort accounts into tiers:

- **Tier 1:** Fit score of 80+ and at least one strong signal. These are accounts that require a one-to-one, personalized approach.
- **Tier 2:** Fit score of 60–79, or high fit but no signals. Industry-level personalization is sufficient.
- **Tier 3:** Fit score of 40–59. Worked through scalable outbound and marketing campaigns.
- **Off-list:** Below 40. Set aside for now and re-evaluated if a signal appears.

In our example, running the 1,800 accounts through this model might yield roughly 60 Tier 1, 300 Tier 2 and 900 Tier 3 accounts. The rest stay off the list.

### 6. Map the buying committee

Once the accounts are set, define whom you'll reach at each one. For the shift management software in our example, a typical buying committee might look like this:

- **Economic decision-maker:** General manager or finance director
- **User-side champion:** HR manager or production planning manager
- **Technical evaluator:** IT manager or ERP lead
- **Influencer:** Plant manager, shift supervisors

Aim to map at least 3–5 people at Tier 1 accounts, 2–3 at Tier 2 and 1–2 at Tier 3. LinkedIn is usually the most efficient channel for reaching people. You can find details, from profile preparation to message structure, in [our guide to using LinkedIn for sales success](https://saascorner.co/blog/linkedin-ve-satis). It's also important for decision-makers to encounter your brand before they get to know you. Here, [Social Media Corner's B2B LinkedIn management service](https://socialmediacorner.co) can help keep company and executive profiles fed with regular content.

### 7. Import the list into your CRM and assign owners

As long as the list sits in a spreadsheet, it's useless. Set up the following structure in your CRM:

- **Custom fields on the account record:** Tier, fit score, signal score, date added to the list, reason for being added
- **Account owner:** Each account is assigned to a single SDR or AE. A "shared pool" means unowned accounts.
- **Contact roles:** The role of each person on the buying committee (decision-maker, champion, technical evaluator) is tagged.
- **Views and reports:** Track the rate of accounts contacted, meeting rate and opportunity conversion rate by tier.

When assigning accounts, use a consistent rule such as region, industry expertise or account size. That way, you avoid the embarrassing situation of two reps calling the same company.

## How many accounts should be on the list?

The answer to this question isn't a single number; it's **your team's capacity**. Calculate your list size backward.

A sample calculation:

- The team has 2 SDRs.
- Each SDR approaches an account with a multichannel sequence (email, LinkedIn, phone) lasting 4–6 weeks on average.
- The number of active accounts an SDR can work well at the same time depends on the level of personalization. A reasonable starting assumption is 15–25 accounts for Tier 1, 50–80 for Tier 2 and 150–250 for Tier 3.

Under these assumptions, 2 SDRs can work roughly 60 Tier 1, 300 Tier 2 and 600–900 Tier 3 accounts in a quarter. It's no coincidence that the list in our example fits this capacity. The list should be cut to fit capacity. A list far above capacity leads to accounts being worked halfheartedly. A list below capacity leaves the team idle or causes them to drift toward non-ICP accounts.

As a general rule, **your Tier 1 list should never turn into a list of "the big names everyone wants."** This tier should include only accounts that truly stand out in terms of both fit and timing.

## How should you approach each tier?

The purpose of tiering is to allocate resources according to each account's potential.

**Tier 1 accounts (one-to-one approach):**
- Account-level research: annual reports, press coverage, executives' LinkedIn posts
- A separate message structure for each decision-maker
- Account-specific content: a short analysis, industry benchmark or sample ROI calculation
- Coordinated outreach from sales, marketing and, if needed, the founder

**Tier 2 accounts (segment-based approach):**
- Message templates tailored to industry or role
- A company-specific reference in the first sentence
- Industry case studies and webinar invitations

**Tier 3 accounts (scalable approach):**
- Multistep sequences run through automation
- Emails personalized with variable fields
- Warming up with targeted ads and content

We covered practical ways to adjust personalization levels by tier in [our article on the impact of personalized emails on sales conversion](https://saascorner.co/blog/kisisellestirilmis-emails).

## Which signals keep the list current?

A target account list isn't a document you create once and shelve. Markets change, companies grow or shrink, and executives change jobs. To keep your list live, regularly monitor the following signals:

- **Job postings:** New roles opening in a relevant department indicate investment in that area and growing pain points.
- **Leadership changes:** A newly hired HR director or CFO typically questions existing tools in their first 6 months and is open to new solutions.
- **Investment and growth news:** News of a new facility, new market, acquisition or funding.
- **Technology changes:** Major projects such as an ERP migration trigger a reassessment of adjacent systems as well.
- **Digital engagement:** Pricing page visits, webinar attendance, content downloads.
- **Lost opportunities:** Accounts that said "not right now" should be revisited after 6–12 months.

Here's the practical rhythm we recommend: **Monitor signals weekly, update tier assignments monthly, and review your ICP and scoring model quarterly.** In your quarterly review, ask: Were the accounts that turned into opportunities actually the high-scoring ones? If not, adjust your scoring weights.

## What should you watch out for in the Turkish market?

We'd also like to highlight a few points that rarely appear in global guides but that we encounter frequently in the field in Turkey:

- **Data coverage varies by industry:** Global data platforms perform quite well in technology, finance and consulting. In industries like manufacturing, construction and logistics, however, decision-makers may have a weaker digital footprint. In these industries, you need to supplement with chamber records, organized industrial zone lists and trade show data.
- **Holding structures are common:** Many large groups operate with dozens of subsidiaries. Research separately for each group how centralized purchasing decisions are.
- **KVKK compliance is mandatory:** When processing personal data, you must take into account the legal basis, the obligation to inform data subjects and the rules on commercial electronic messages. As you build your list, record the source of the data and clarify your processes with your legal counsel.
- **Phone is still a strong channel:** Email response rates can be low, especially at mid-sized companies in Anatolia. Switchboard and direct line information also matters when enriching your list.
- **Relationships and references matter:** A reference customer from the same industry and region is one of the most effective arguments for opening doors at Tier 1 accounts.

## What are the most common mistakes?

Let's briefly summarize the mistakes we see most often in the field:

1. **Starting the list without writing down your ICP:** The result is an inconsistent list where every rep picks accounts by their own criteria.
2. **Keeping the list too large:** A list of 10,000 accounts effectively means no prioritization was done at all.
3. **Relying only on firmographic data:** A company of the right size and industry may not be ready to buy right now. Without a signal layer, you miss the timing.
4. **Sales and marketing working from separate lists:** If marketing is running ads to one list while sales calls another, the entire benefit of an account-based approach is lost.
5. **Focusing on a single person:** Engaging only one person at an account means the opportunity disappears entirely when that person leaves or loses interest.
6. **Not updating the list:** A list created six months ago and never touched since is no longer a target list; it's an archive.
7. **Not measuring results:** You can't improve the list without knowing which tier, which industry and which signal is generating pipeline.

If you don't have enough time or team resources to build this process in-house, [Sales Corner's B2B sales and lead generation services](https://salescorner.co), which run data-driven list building and outbound processes end to end, are an alternative worth considering.

## Frequently asked questions

### Is a target account list the same as an ICP?

No. An ICP is a profile that defines the characteristics of your ideal customer. A target account list is the concrete list in which real companies that match this profile are identified by name and prioritized. The ICP answers the question "Who are we looking for?" while the target account list answers "Exactly which companies are we going after?"

### How often should a target account list be updated?

A good rhythm is to monitor buying signals weekly, update account tiers monthly, and review your ICP and scoring model quarterly. In the event of major developments, such as a new product, a new market or a pricing change, the list should be reassessed from scratch.

### Can a small SaaS company apply an account-based approach?

Yes. In fact, prioritization is even more critical for small teams. Even a single SDR, or a founder who handles sales personally, can work efficiently with a list of 20–30 Tier 1 accounts and a few hundred Tier 2–3 accounts. What matters is sizing the list according to capacity.

### How do you measure the success of a target account list?

The core metrics are the rate of accounts contacted by tier, the rate of accounts where you've met with at least one decision-maker, the rate of accounts converted into opportunities, and the resulting pipeline value. In addition, tracking how many closed deals came from the list shows whether the list is truly selecting the right accounts.

## Conclusion

In B2B SaaS, the target account list is the shared compass for sales and marketing. Derive a measurable ICP from your existing customers and scan the market for companies that match this profile. Then clean the data and tier your accounts based on fit and signal scores. After mapping the buying committee, manage the list in your CRM with owners assigned. This way, your team reaches the right companies at the right time with the right message. Sizing the list to capacity and updating it regularly are the two core disciplines that make the process work over the long term.

If you want to clarify your ICP, build your target account list or turn your existing list into a structure that generates pipeline, [get in touch with the SAAS Corner team](/en/contact). Let's put together a roadmap that fits your market and your team's capacity.
