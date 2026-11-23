---
title: "LinkedIn Boolean Search for B2B Lead Generation: A Guide"
description: "A step-by-step guide to finding ICP-fit decision-makers on LinkedIn with Boolean operators, with sample queries and KVKK compliance limits."
date: "2026-11-24"
category: "Lead Generation"
image: "https://images.pexels.com/photos/39190477/pexels-photo-39190477.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Guide to finding B2B leads with LinkedIn Boolean search"
alt: "linkedin-boolean-arama-b2b-lead-bulma"
---

Finding B2B leads with Boolean search on LinkedIn means typing **AND, OR and NOT operators, quotation marks and parentheses** together in the search box to filter for decision-makers who match your ideal customer profile. For example, the query `("satın alma müdürü" OR "procurement manager") AND (üretim OR manufacturing) NOT stajyer` returns purchasing managers in the manufacturing sector and removes interns from the list. A single well-built Boolean query cuts hours of manual profile browsing down to minutes. It also directly improves the quality of your outbound lists.

In this guide, we explain how the operators work on LinkedIn, how a free account differs from Sales Navigator, and how to build queries step by step from your ideal customer profile (ICP). We also cover ready-to-use queries for the Turkish market, common mistakes, and how to turn the profiles you find into a usable lead list.

## What is Boolean search on LinkedIn, and why does it work for finding leads?

Boolean search is a method of combining multiple keywords into a single query using logical operators. LinkedIn's standard filters (location, industry, company size) give you a rough cut. A Boolean query lets you fine-tune within that cut.

In B2B sales, this matters in three ways:

- **Job title chaos:** In Turkey, the same role is written in dozens of different ways. A purchasing manager might list their title as "Satınalma Müdürü", "Satın Alma Yöneticisi", "Procurement Manager", "Purchasing Manager" or "Tedarik Zinciri ve Satınalma Müdürü". Search with a single term and you'll miss a large share of these people.
- **Noise:** Search for "satış" (sales) and your results will also include sales consultants, interns, sales assistants and job seekers. The NOT operator clears out this noise.
- **Repeatability:** Once you save a good query, every SDR on the team produces lists of the same quality. This means lead quality no longer depends on who's doing the searching.

## Which Boolean operators work on LinkedIn?

LinkedIn supports five basic constructs. Operators must be written in **uppercase**. A lowercase "and" or "or" may be treated as an ordinary word.

1. **Quotation marks (" "):** Search for an exact phrase. If you type `"satış müdürü"`, you'll get profiles where the two words appear side by side. Without quotes, results are returned even if the words appear scattered across different parts of the profile.
2. **AND:** Requires both terms to be present. `CFO AND fintech`
3. **OR:** At least one of the terms must be present. Used to group synonyms and translations. `CFO OR "finans direktörü" OR "mali işler direktörü"`
4. **NOT:** Excludes results containing the term. `NOT stajyer NOT intern`
5. **Parentheses ( ):** Separate groups and set the order of operations. `(CTO OR "teknoloji direktörü") AND (SaaS OR yazılım)`

LinkedIn processes them in this order of precedence: quoted phrases, parentheses, NOT, AND, and finally OR. Without parentheses, a query like `CTO OR CIO AND yazılım` won't work the way you expect. That's why **wrapping every OR group in parentheses** is the safest habit.

It's also important to know what isn't supported. LinkedIn does not officially support the asterisk (*) wildcard. So you can't type `pazarlama*` to catch variants like "pazarlamacı" (marketer) or "pazarlamada" (in marketing); you need to add each variant individually with OR. Likewise, use AND and NOT instead of the `+` and `-` symbols.

## Where do you enter a Boolean query? Free LinkedIn vs. Sales Navigator

### On a free LinkedIn account

Boolean works when you type the query into the main search bar and switch to the "People" tab. Some fields in the "All filters" panel (such as title and company) may also accept Boolean expressions, depending on your account type. However, a free account has clear limitations:

- A monthly **commercial use search limit** applies. For accounts that search heavily, results may be restricted toward the end of the month.
- Filters such as company headcount, seniority level and start date aren't available.
- Full names may not always be visible for third-degree and out-of-network connections.

### In Sales Navigator

In Sales Navigator, Boolean can be used in filter fields such as title, as well as in the keyword field. The real power comes from combining Boolean with advanced filters. Filters such as seniority level, department, company headcount, people who changed jobs in the past 90 days and company growth rate add a second layer of precision on top of your Boolean query.

If Sales Navigator doesn't fit your budget, or you're looking for a more cost-effective option for the Turkish market, we compared different options in our post on [LinkedIn Sales Navigator alternatives for Turkey](/blog/linkedin-sales-navigator-alternatives-turkey).

## From ICP to Boolean query: a step-by-step method

A good Boolean query starts with a well-defined target audience. The five steps below follow a hypothetical example: **a company selling warehouse management software to manufacturing firms in Turkey with 50-500 employees.**

### 1. Write your ICP in three layers

Before writing a query, give clear answers to these three questions:

- **Company layer:** Which industry, what size, which region? (Example: manufacturing and logistics, 50-500 employees, Marmara and Aegean regions)
- **Role layer:** Who makes the purchasing decision, and who influences it? (Example: logistics manager, warehouse manager, supply chain director, operations director)
- **Exclusion layer:** Who don't you want? (Example: interns, students, consultants, employees of competitors, job seekers)

### 2. Build a job title dictionary

This step is often skipped, yet it's the one that most determines query quality. For each target role, list the Turkish and English variations, abbreviations and common spelling differences. In the warehouse management example, the list might look like this:

- Turkish: "lojistik müdürü", "depo müdürü", "depo yöneticisi", "tedarik zinciri müdürü", "tedarik zinciri direktörü", "operasyon müdürü"
- English: "logistics manager", "warehouse manager", "supply chain manager", "supply chain director", "operations director"
- Spelling variations: "satınalma" and "satın alma", compound titles such as "lojistik ve depo müdürü"

Look at real profiles while you do this. Opening the profiles of 15-20 decision-makers in your target industry and copying their titles produces a much better dictionary than guessing from your desk. This review usually takes about half an hour and reveals the variations you'd otherwise miss.

### 3. Build the query skeleton

Group the terms from your dictionary with OR and wrap them in parentheses, then put AND between the groups:

```
("lojistik müdürü" OR "depo müdürü" OR "tedarik zinciri müdürü" OR "logistics manager" OR "warehouse manager" OR "supply chain manager")
```

This query should go in the title field. Select "Manufacturing" or the relevant sub-industries as the industry filter, and set the location to Turkey or the relevant provinces.

### 4. Clear out the noise with NOT

When you scan the first results, you'll see unwanted profiles. Clean them out with an exclusion group:

```
NOT (stajyer OR intern OR öğrenci OR student OR asistan OR assistant OR danışman OR consultant)
```

But be careful: excluding "asistan" removes profiles such as "Genel Müdür Asistanı" (Executive Assistant to the General Manager) but doesn't affect "Lojistik Müdür Yardımcısı" (Deputy Logistics Manager). After adding each NOT term, check the results and make sure you haven't accidentally filtered out valuable profiles.

### 5. Test the result count and adjust

The number of results your query returns gives you a sense of its precision. There's no single right number, but here's a practical approach:

- **If there are too many results** (for example, several tens of thousands): The query is too broad. Add a seniority filter, narrow the location or use a company size filter.
- **If there are too few results** (for example, a few dozen): The query is too narrow. Expand your title dictionary and check whether your quoted phrases are too specific.
- **Review the first 25 results one by one.** If the vast majority match your target audience, the query is working well. Find what the mismatches have in common and add it as a new NOT term.

Repeating this loop two or three times significantly improves your first draft.

## Ready-to-use Boolean queries for the Turkish market

The queries below are designed as starting points. Adapt them to your own ICP.

### Finance decision-makers (for fintech, accounting software, payment solutions)

```
(CFO OR "finans direktörü" OR "mali işler direktörü" OR "finans müdürü" OR "finance director" OR "finance manager" OR "mali işler müdürü") NOT (stajyer OR intern OR "finans uzmanı" OR analist)
```

### Technology leaders (for SaaS, cybersecurity, infrastructure solutions)

```
(CTO OR CIO OR "bilgi teknolojileri direktörü" OR "BT direktörü" OR "IT director" OR "IT müdürü" OR "bilgi işlem müdürü" OR "head of engineering") NOT (freelance OR serbest OR öğrenci)
```

### Human resources managers (for HR software, training, employee benefits)

```
("insan kaynakları müdürü" OR "insan kaynakları direktörü" OR "İK müdürü" OR "IK müdürü" OR "HR manager" OR "HR director" OR CHRO OR "people director") NOT (stajyer OR intern OR "işe alım uzmanı" OR recruiter)
```

In this example, "İK" and "IK" are written separately. Inconsistent use of Turkish characters is a common problem in searches in Turkey, so adding both spellings of critical terms is good practice.

### Marketing leaders (for martech, agency services)

```
(CMO OR "pazarlama direktörü" OR "pazarlama müdürü" OR "marketing director" OR "head of marketing" OR "growth lead" OR "büyüme müdürü") NOT (stajyer OR intern OR "pazarlama uzmanı" OR "satış temsilcisi")
```

### Technology or context signals in the keyword field

Once you've defined the title, you can use the keyword field to capture context signals. For example, if you're targeting operations managers at manufacturing firms that use SAP:

```
Title: ("operasyon müdürü" OR "operations manager" OR "fabrika müdürü" OR "plant manager")
Keyword: (SAP OR "SAP S/4HANA" OR ERP)
```

This approach surfaces people who mention a specific technology in their profile summary or experience descriptions. It also lets you personalize your message around that context.

## What are the most common Boolean search mistakes?

Most of the mistakes we see in the field fall under a few headings:

- **Writing operators in lowercase:** Write `CFO OR CTO`, not `cfo or cto`.
- **Forgetting parentheses:** The query `"satış müdürü" OR "sales manager" AND SaaS` applies the SaaS condition only to the last term. The correct version is `("satış müdürü" OR "sales manager") AND SaaS`.
- **Using smart quotes:** “Curly” quotes copied from Word or some note-taking apps may not be recognized as straight quotes ("). Prepare your queries in a plain text editor.
- **Searching only English titles:** Many decision-makers in Turkey fill out their profiles in Turkish. Using only English terms leaves out a large part of your target audience.
- **Overly long queries:** Queries with too many terms can produce unexpected results or get truncated. Running two separate queries is often more reliable than one very long one.
- **Being too aggressive with NOT:** Trying to exclude "müdür yardımcısı" (deputy manager) but accidentally excluding the word "müdür" (manager) wipes out your entire target audience.
- **Not saving the query:** Store a query that works well in a document the whole team uses. Note the ICP, the date and the result count. That way, the query becomes a company asset.

## How do you turn the profiles you find into a lead list?

Boolean search gives you a **list of names and titles**. A sales-ready lead list requires much more. The conversion process usually consists of the following steps.

### 1. Save profiles in a structured format

If you use Sales Navigator, save the results to lead lists. On a free account, transfer the first name, last name, title, company and profile URL into a spreadsheet. Adding a one- or two-sentence note per profile at this stage (a recent job change, a post they shared, company news) makes personalization much easier later on.

### 2. Enrich with contact data

A LinkedIn profile doesn't give you a work email address or phone number. You fill this gap with data enrichment tools. For example, prospecting platforms such as [Apollo.io](https://get.apollo.io/679irkzm35ya) can find work emails and company data from a name and company. Keep in mind that data coverage in Turkey varies by region and industry. We cover the enrichment process, tool selection and verification steps in detail in our [B2B data enrichment guide](/blog/b2b-data-enrichment-turkey-guide).

### 3. Verify email addresses

Not every email address that comes from enrichment tools is valid. Sending to unverified addresses raises your bounce rate and damages your sender domain reputation. Never skip the verification step.

### 4. Remove duplicates

Different Boolean queries can return the same person more than once. The overlap between your "Finans direktörü" and "CFO" queries is a good example. Before importing the list into your CRM, deduplicate it by LinkedIn profile URL or email address. Otherwise, you'll run into awkward situations such as two different reps reaching out to the same person. Our [guide to cleaning up duplicate records in your CRM](/blog/crm-duplicate-records-cleanup-guide) will help with this.

### 5. Prioritize

Not every lead has the same value. Rank the list by scoring criteria such as company size, seniority level, a recent job change or growth signals. That way, your reps focus on the hottest accounts first. We explain how to set up this scoring step by step in our post on [B2B lead scoring models](/blog/b2b-lead-scoring-model).

## How do you scale Boolean search with automation?

A manual process is enough for small teams at the start. But if you need to generate hundreds of leads a week, bottlenecks appear quickly. Automation saves time at these points:

- **Saved searches and alerts:** Saved searches in Sales Navigator periodically notify you of new profiles that match your criteria. That way, you don't have to run the same query by hand every week.
- **Enrichment workflow:** When saved leads land in a spreadsheet, the enrichment, verification and CRM import steps can be triggered automatically.
- **AI-powered personalization:** An AI step that reads the profile summary and company information can draft the opening line of the first message for each lead. The rep then simply reviews and approves it.

There's an important warning here. LinkedIn's user agreement prohibits scraping platform data with automated tools and using automation to mimic account activity. Tools that break this rule can lead to account restrictions. The safest approach is to build automation **in the steps outside LinkedIn**, not in LinkedIn itself. These steps are enrichment, verification, CRM import and email sequences.

In addition, the processing of personal data in Turkey falls under KVKK. Even when sending commercial messages to a work email address, make sure your legal basis, your information obligations and your opt-out mechanism are clearly defined. We recommend getting your legal counsel's opinion on this.

For SaaS companies that want to outsource this outbound process end to end, our sister company [SAAS Corner's outbound sales and lead generation service built for B2B SaaS](https://saascorner.co) may be an option. If you want to use LinkedIn not just as a search tool but also as a brand visibility channel, [Social Media Corner's B2B LinkedIn management](https://socialmediacorner.co) service builds a content foundation that boosts the impact of your prospecting efforts. When the decision-maker you reach out to looks at your profile and sees consistent, valuable content, they're more likely to reply to your first message.

## How much does it cost to find leads with Boolean search?

The cost has three components:

- **Tool cost:** You can start with a free LinkedIn account, but search limits and missing filters restrict scale. Sales Navigator licenses are billed monthly per user, and pricing varies by plan and billing period. Enrichment and verification tools are also usually credit-based.
- **Time cost:** Building the initial query set (ICP, title dictionary, test loops) can take an experienced person anywhere from half a day to a full day. After that, weekly maintenance with saved queries takes much less time.
- **Opportunity cost:** A poorly built query means messages going to the wrong people. That wastes rep time and wears down your domain reputation.

As your team grows, the question of "who will use the tool and who will update the queries" becomes more important. Assigning query ownership to one person and reviewing queries quarterly is a practical way to maintain quality.

## Frequently asked questions

### Can you use Boolean search on a free LinkedIn account?

Yes, Boolean queries typed into the search bar also work on a free account. However, because of the monthly commercial use limit, results may be restricted when you search heavily. Advanced filters such as company size and seniority level are only available in Sales Navigator.

### Does the asterisk (*) wildcard work in LinkedIn Boolean search?

No, LinkedIn does not officially support the asterisk wildcard. If you want to capture different variants of a word, you need to write each one separately with the OR operator. For example, you can create a group like `pazarlama OR pazarlamacı OR marketing`.

### Should a Boolean query go in the title field or the keyword field?

Putting the terms that define your target role in the title field gives more accurate results. Because the keyword field searches the entire profile, titles entered there may also return people who held that role in past positions. Reserve the keyword field for context signals such as the technology they use, industry jargon or areas of expertise.

### Do Turkish character issues affect searches?

They can. Some users fill out their profiles without using Turkish characters. Adding both spellings of critical terms to your query with OR, such as "İK" and "IK" or "satın alma" and "satınalma", reduces the number of profiles you miss.

## Conclusion

Boolean search on LinkedIn is one of the lowest-cost, highest-leverage skills in B2B lead generation. A good query is built on three things: a clearly defined ICP, a title dictionary that covers Turkish and English variations, and a disciplined NOT group that clears out the noise. The profiles you find only become a real lead list once they've gone through enrichment, verification, deduplication and prioritization.

If you want to move this process beyond manual steps and fully automate it end to end with enrichment, CRM import and personalized outbound workflows, [schedule a call](/en/iletisim) with our team. Let's design a workflow tailored to you together.
