---
title: "Google Ads Negative Keywords: Stop B2B Budget Leaks"
description: "Learn how to cut Google Ads spend on irrelevant searches with negative keywords. Lists, examples and a checklist built for B2B SaaS teams."
date: "2026-11-19"
category: "Marketing"
image: "https://images.pexels.com/photos/6248957/pexels-photo-6248957.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Negative Keywords in Google Ads: B2B Budget Leakage"
alt: "google-ads-negatif-anahtar-kelime-b2b"
---

In Google Ads, a negative keyword is a filter that **prevents** your ad from showing on specific searches. At B2B SaaS companies, a significant share of the budget often goes to low-quality clicks. These clicks come from job seekers, students, individual users hunting for free tools, or people looking for a completely different product. A properly built and regularly updated negative keyword structure gets you fewer but far more qualified clicks for the same budget, and it directly lowers your cost per lead.

The problem is that most B2B accounts either have no negative list at all or added one once when the campaign launched and then forgot about it. Google's broad match and close variant logic gets more "flexible" every year. In unmanaged accounts, that means the leak quietly keeps growing. In this article, we explain where the leak starts, why Turkish suffixes make the job harder, and how to build a negative keyword system step by step.

## What is a negative keyword, and why is it more critical in B2B?

Positive keywords tell Google which searches your ad can appear on. Negative keywords tell it which searches your ad should **never appear on**. For example, a SaaS company bidding on "CRM software" doesn't want to show up for "CRM software job posting" or "CRM software free download." To prevent that, it adds terms like "job posting" and "free" as negatives.

In B2C, this matters. In B2B, it is **vital**. There are three reasons:

- **Cost per click is high.** In B2B software categories, competitive keywords typically cost several times more per click than consumer products. Every irrelevant click is a serious loss.
- **Search volume is low.** Your target audience may consist of a few hundred decision-makers, not thousands. When even a small share of the budget goes to the wrong audience, your chances of reaching the right people shrink.
- **The sales cycle is long.** Sometimes an irrelevant click also fills out a form. In that case, you waste not only ad budget but also your sales team's time. An hour an SDR spends weeding out student submissions is the hidden cost of your ads.

If you haven't yet set up the basic framework for structuring Google Ads in B2B SaaS, we recommend starting with our [guide to Google Ads costs and setup for B2B SaaS](/blog/google-ads-b2b-saas-guide). Think of this article as a "protection layer" that sits on top of that setup.

## Where exactly does budget leakage start?

Leakage usually doesn't come from a single mistake but from several default settings working together.

### Broad match and close variants

With broad match keywords, Google interprets the "meaning" of a search and shows your ad on queries it considers relevant. Sometimes this interpretation works in your favor; other times it matches "project management software" with a search for "project management master's degree." Phrase match and exact match now cover close variants too. In other words, even "exact match" is not limited to exactly the phrase you entered.

### Search partners and Display expansion

When you create a new search campaign, search partners and, in some accounts, Display Network expansion may be turned on by default. In B2B, traffic from these sources is generally lower quality than traffic from the main search network. These are separate settings from negative keywords, but they should always be checked as part of a leakage analysis.

### Performance Max and automated campaigns

In highly automated campaigns like Performance Max, it's harder to control which queries you appear on. Applying negative keywords at the account level is a critical control tool for these campaigns as well. Before applying them, check in your account which negative methods your campaign type supports.

### Turkish suffixes

In Turkish-language accounts, the biggest factor that amplifies leakage is suffixes. Google **does not expand negative keywords to close variants, plurals, synonyms or misspellings.** So when you add "kurs" (course) as a negative, its inflected forms such as "kursu," "kursları" and "kursa" are not blocked automatically. A problem that a few keywords solve in English accounts can require dozens of variants in Turkish.

## Which search types cause the most leakage in B2B SaaS?

Every product has its own keyword universe. But in B2B SaaS accounts, there are seven categories we run into almost every time.

**1. Career and job-search intent**
A company bidding on "HR software" may show up for searches like "HR specialist salary," "human resources job posting" or "HR software internship." Example negatives: *iş ilanı (job posting), ilanları (postings), maaş (salary), maaşı (salary of), kariyer (career), staj (internship), stajyer (intern), eleman (staff wanted), iş başvurusu (job application), nasıl olunur (how to become), CV, özgeçmiş (résumé).*

**2. Educational and academic intent**
A business owner searching for "accounting software" is not the same person as a student searching for "accounting software course." Example negatives: *kurs, kursu, kursları (course and its inflections), eğitim videosu (training video), sertifika (certificate), ders (lesson), ödev (homework), tez (thesis), proje ödevi (project assignment), sunum (presentation), pdf, ders notu (lecture notes), üniversite (university).*

**3. Free, pirated and download intent**
The word "free" is debatable in B2B. If you offer a free trial, you may not want to block it entirely. But terms like "crack," "full download," "apk" and "keygen" should almost always be negatives. We covered in detail how your product model affects this decision in our article on [choosing between a free trial and a demo in B2B SaaS](/blog/free-trial-vs-demo-b2b-saas).

**4. Individual and consumer intent**
Phrases like "personal budget app," "for home," "for students" and "for phone" point to individual users. For a product that bills businesses, these clicks are very unlikely to convert.

**5. Login and support intent**
Searches like "login," "sign in," "forgot password," "customer service" and "support line" eat up a serious amount of budget, both on your own brand and on competitors' brands. If you bid on a competitor's brand, paying for that competitor's existing users' login searches is one of the most common forms of waste.

**6. Calculation and one-off tool intent**
"Payroll software" and "payroll calculation" are very different intents. The second is usually looking for a free calculator. Terms like "calculation," "calculate," "formula" and "excel template" are typical examples of this group.

**7. Different product categories or homonyms**
Some product names overlap with other fields. For example, the word "lead" can mean something else in other contexts. "Pipeline" means different things in software development, engineering and sales. A sales pipeline tool should not appear on "CI/CD pipeline" searches.

## How do negative match types work?

Negative keywords also have three match types. Their logic differs from positive keywords.

- **Negative broad match** (`kurs`): The ad won't show if **all** of these words appear in the search in any order. It blocks "Excel muhasebe kurs" but does not block "Excel muhasebe kursu." With multi-word negative broad match, every word must be present in the search.
- **Negative phrase match** (`"job posting"`): Blocks the search if the phrase appears in the same order. "CRM specialist job posting" is blocked; "posting job" is not.
- **Negative exact match** (`[what is crm]`): Blocks only when exactly this search is made. It doesn't work if there are additional words.

The practical rule is this: **Add single-word negatives with clear intent as broad match, but also write out their Turkish inflected forms separately.** For example, not just "kurs"; build a set like "kurs," "kursu," "kursları," "kursa," "kursunda." Add phrases whose meaning depends on context as phrase or exact match.

## Step by step: how to build a B2B negative keyword system

### 1. Prepare a starter list before the campaign launches

Before taking the campaign live, build a base list using the terms from the seven categories above that fit your product. For a typical B2B SaaS account, this starter list can contain 150–300 terms including inflected forms. It cuts off the most obvious leaks you would otherwise see in the first weeks.

### 2. Build a layered structure

Instead of scattering negative keywords randomly across campaigns, think in four layers:

- **Account level:** Terms you never want to appear on under any circumstances. For example, "crack," "job posting," "salary" and piracy-related terms.
- **Shared negative lists:** Lists organized by theme. For example, "Career," "Education," "Individual use," "Competitor login searches." You attach these lists to the relevant campaigns. When you make a change, all campaigns update at once.
- **Campaign level:** Keywords outside a specific campaign's focus. For example, in a campaign promoting only the enterprise plan, "small business" could be a negative.
- **Ad group level:** Negatives used to route traffic to the right ad group. We explain this below under "cross-negatives."

### 3. Review the search terms report on a regular cadence

The heart of negative keyword management is the **Search terms** report in Google Ads. The recommended cadence is:

- **First 4 weeks:** Twice a week
- **Months 2–3:** Once a week
- **Once the account has settled:** Every two weeks, plus intensive monitoring in the first week after a new campaign, a match type change or a bid strategy change

In each review, sort recent search terms by spend and ask: *"Could the person making this search work at a company that would buy our product?"* If the answer is clearly no, the term goes on the negative list.

### 4. Analyze by word fragments (n-grams), not one by one

Reading hundreds of search terms one by one is both tiring and inefficient. Export your search terms and split them into words. Then calculate the total spend, clicks and conversions for each single word (1-gram) and each two-word phrase (2-gram). This analysis surfaces patterns that don't stand out individually but add up to significant spend in total.

For example, 40 different searches containing the word "example" may each have received only a few clicks. But together they can account for a meaningful share of your monthly budget. You can automate this analysis with a spreadsheet or a simple script. For teams that want to build a more systematic setup for reporting and automation, [Corner Group's strategy and automation approach](https://cornergroup.co) can be a good starting point.

### 5. Write down your decision criteria in advance

Instead of relying on a "seems irrelevant to me" feeling, set clear thresholds. An example rule set:

- Term with clearly irrelevant intent (career, education, piracy) → negative **the first time it appears**
- Term with ambiguous intent that has spent 1.5x your target CPA with zero conversions → negative
- Term with ambiguous intent that has received many clicks but has a conversion rate below one-third of the account average → negative, or move it to a separate ad group
- Term that has converted but is consistently disqualified by the sales team → negative (see step 6)

### 6. Connect sales team data to your negative list

In B2B, not everyone who fills out a form is a prospect. To see the real leak, you need to track how ad-sourced leads end up in your CRM. If the sales team disqualifies leads for reasons like "student," "individual," "no budget" or "wrong country," and those leads come from specific search terms, those terms are negative candidates.

For this loop to work, marketing and sales need a clear, shared disqualification language. In our [guide to writing a lead handoff SLA for marketing-sales alignment](/blog/lead-handoff-sla-marketing-sales-alignment), we explained how to build that shared language. Sending CRM stage data back to Google Ads as offline conversions also helps the bidding algorithm recognize high-quality leads.

## What is a cross-negative keyword, and when should you use it?

When the same account has multiple ad groups or campaigns targeting similar keywords, Google decides on its own which one will serve a given search. This both muddies your reporting and leads to the wrong ad copy being shown with the wrong landing page.

**Example:** Let's say a sales automation software company has three campaigns:

- **Brand campaign:** Searches that include the company name
- **Competitor campaign:** Searches that include competitor brand names
- **Generic category campaign:** Searches like "sales automation software" and "CRM program"

If you don't add your own brand name and competitor brands as negatives in the generic category campaign, your brand searches may get clicked through the more expensive generic campaign. Competitor searches will also be met with generic ad copy instead of a competitor comparison message. In the right setup, every search goes to the ad and landing page written specifically for it. If you're wondering how to structure the landing page side, our [B2B SaaS landing page guide](/blog/how-to-build-b2b-saas-landing-page) walks you step by step through achieving this match.

## How much does leakage cost your budget?

A simple calculation is enough to see the impact on your own account. The figures below are a **hypothetical example** used to illustrate the calculation logic:

- Monthly search budget: **60,000 TL**
- Average cost per click: **40 TL**
- Monthly clicks: **1,500**
- Share of clicks found to be clearly irrelevant in the search terms report: **20%**

That means **300 clicks** and **12,000 TL** are wasted directly every month. On an annual basis, that adds up to a 144,000 TL leak.

The real impact, however, shows up in cost per lead. Let's say this account gets 60 form submissions a month, and 15 of them come from irrelevant traffic. The overall cost per lead appears to be 1,000 TL. But the actual cost per qualified lead is 60,000 / 45 ≈ **1,333 TL**. Irrelevant form submissions make the report look better but increase the sales team's workload. To measure this gap accurately, we recommend using the "qualified lead" distinction from our article on [how to calculate cost per lead (CPL) in B2B](/blog/b2b-cost-per-lead-cpl-calculation).

Once you plug the leak, the same 60,000 TL goes toward more qualified searches. Your bid strategy learns from cleaner conversion data. In the short term, click volume may drop, but the number of qualified leads usually rises.

## Is adding too many negative keywords also a risk?

Yes. It's possible to err in the opposite direction in negative keyword management, and in B2B this is usually harder to notice.

**The "what is" dilemma:** Many accounts automatically block phrases like "what is," "meaning of" and "what does it do." But someone searching "what is sales automation" could also be an operations manager researching solutions for the first time. Rather than blocking these phrases entirely, it's often smarter to route them to a separate low-budget awareness campaign or to address them with content.

**The "free" dilemma:** If your product offers a free trial or a freemium plan, a search for "free CRM" may come from a real buyer. Here, base the decision on your sales model and your free-to-paid conversion rate.

**Conflict with positive keywords:** If a negative keyword blocks a keyword you're bidding on, your ad will never show for that keyword. Google Ads has a warning and reporting feature that flags conflicting negative keywords. Run this check after every bulk negative upload.

**Overly short broad negatives:** Adding a single generic word like "program" as a broad match negative can kill your most valuable searches, such as "accounting program." The rule is simple: **The shorter and more generic the negative, the more careful you need to be.**

We recommend reviewing your negative lists every three months. Over time, your product may expand into new segments. "Small business," once irrelevant, may become a target with a new plan.

## Whose job should negative keyword management be?

At many B2B SaaS companies, the Google Ads account is managed by an agency or a single performance marketer. Meanwhile, the sales team complains about the quality of ad-sourced leads. If there's no data flow between these two sides, the negative list is shaped only by click data, and the real leak stays invisible.

For a healthy process, we recommend the following:

- The person managing the account reviews search terms every two weeks and logs added negatives with a short note.
- Sales operations shares a list of disqualified ad-sourced leads and the reasons once a month.
- Every three months, marketing and sales discuss together "which searches actually bring in customers" and put [the difference between MQL and SQL](/blog/what-is-mql-mql-vs-sql-b2b-saas) at the center of that discussion.

Paid search is not a pipeline engine on its own. In niche categories where demand hasn't been created, search volume is limited to begin with. In that case, Google Ads should be considered alongside an outbound setup that reaches target accounts directly. Teams looking for support on that front can check out [Sales Corner's data-driven B2B sales and lead generation services](https://salescorner.co).

## Frequently asked questions

### How often should the negative keyword list be updated?

For newly launched campaigns, the search terms report should be reviewed twice a week for the first four weeks and once a week for the following two months. Once the account has settled, a review every two weeks is sufficient for most B2B accounts. When a major change is made to match types, bid strategy or campaign structure, monitoring frequency should be increased again.

### Do inflected forms of negative keywords need to be added separately in Turkish accounts?

Yes, they do. Google does not expand negative keywords to close variants, plurals or suffixed forms. So the keyword "kurs" will not block searches for "kursu" or "kursları." Adding common inflected forms one by one, or grouping them in shared negative lists, is the safest approach.

### Should I add "free" as a negative keyword in B2B campaigns?

If your product doesn't offer a free trial or a freemium plan, adding "free" and its variants as negatives is usually the right call. If you do offer a free trial, instead of blocking these searches entirely, serve them in a separate ad group with a trial-focused message. Track this group's conversion and free-to-paid data and make the decision based on the numbers.

### Can negative keywords be used in Performance Max campaigns?

It's possible to add negative keywords at the account level for Performance Max campaigns, and this is one of the main ways to control leakage in automated campaigns. However, visibility into search queries is more limited in this campaign type than in standard search campaigns. That's why, in B2B, keeping critical keywords in standard search campaigns makes control easier.

## Conclusion

B2B budget leakage in Google Ads rarely comes from one big mistake. It usually builds up from a few irrelevant clicks a day accumulating over months. A starter list covering career, education, piracy, individual use and login searches cuts off most of this leakage from the outset. Variants expanded for Turkish suffixes, a layered list structure and regular search terms reviews keep the rest under control. The biggest gain, however, comes when you start making negative keyword decisions based not on click data, but on the sales team's real lead quality data in the CRM.

If you want to get clarity on where your Google Ads budget is going, build your negative keyword structure and connect ad-sourced leads to your sales process, [get in touch with the SAAS Corner team](/en/contact). Let's review your account together and pinpoint exactly where the leak is.
