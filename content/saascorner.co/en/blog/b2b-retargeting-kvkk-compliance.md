---
title: "B2B Retargeting: How to Stay KVKK-Compliant"
description: "How to set up B2B retargeting ads in line with KVKK and cookie consent rules: audiences, consent management and platform settings, step by step."
date: "2026-11-24"
category: "Marketing"
image: "https://images.pexels.com/photos/106344/pexels-photo-106344.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "B2B Retargeting: KVKK-Compliant Remarketing"
alt: "b2b-retargeting-kvkk-uyumlu-yeniden-hedefleme"
---

B2B retargeting means showing ads again, on platforms such as LinkedIn, Google and Meta, to decision-makers who have visited your website or interacted with you. In Turkey, the fundamental requirement for doing this in a KVKK-compliant way is **not running marketing cookies and pixels without the visitor's explicit consent**. When you upload customer or lead lists to ad platforms, you also need to comply with the rules on **privacy notices**, **legal basis** and **cross-border data transfers**. In short, retargeting isn't prohibited. What's unlawful is tracking without consent and transferring data without a legal basis.

In this article, we explain how B2B SaaS companies can set up retargeting campaigns while reducing legal risk. We walk step by step through which data counts as personal data, what your cookie banner should look like and the rules for uploading lists. We also look at alternative targeting methods that stay effective even when consent rates are low. This article offers a general roadmap and is not a substitute for legal advice. Always validate your final setup with a KVKK consultant.

## What is B2B retargeting, and how does it differ from B2C?

Retargeting is the practice of reaching people again who have previously interacted with your brand. That interaction might be a website visit, abandoning a demo form halfway through, registering for a webinar or opening an email. Technically, it's done in two main ways:

- **Pixel/cookie-based retargeting:** A LinkedIn Insight Tag, Meta Pixel or Google Ads tag placed on your site recognizes the visitor. The platform then shows that person ads later on.
- **List-based retargeting:** You upload email addresses or company lists you hold to the platform (Custom Audiences, Matched Audiences, Customer Match). The platform matches these records against its own users.

In B2B, the dynamics of this process are markedly different from B2C:

- **The sales cycle is long.** Purchasing a SaaS tool can take 3 to 9 months. That's why your retargeting window should be 90–180 days, not 7.
- **More than one person makes the buying decision.** The operations manager who visits your site doesn't decide alone. Finance and IT are also involved.
- **The target audience is small.** You're working with audiences of a few hundred people, sometimes, rather than thousands. Every loss due to consent is proportionally more noticeable.

That last point also explains why KVKK compliance is a strategic issue in B2B. If your audience is already small and your consent rate is low on top of that, a strategy that relies solely on pixels quickly hits a wall.

## "We're B2B, so corporate data isn't covered by KVKK" — is that true?

No. This is the most common misconception in B2B marketing. KVKK doesn't protect the data of legal entities, but **employees are natural persons**. And most of the data used in retargeting qualifies as personal data:

- **Corporate email address** (ahmet.yilmaz@firma.com): It's personal data because it's associated with an identified individual.
- **Cookie IDs and device IDs:** Even though they don't contain a name on their own, they're considered personal data because they serve to single out an individual.
- **IP address:** Counts as personal data, especially when combined with other data.
- **Hashed email:** Emails are usually hashed with SHA-256 when uploaded to platforms. This is a security measure, not anonymization. Since the platform can still perform matching, the data still makes the person identifiable.

By contrast, company-level information **such as company name, industry and headcount alone** is not personal data unless it's linked to an individual. This distinction is the foundation of the account-based targeting alternative we'll cover later.

## Can I run pixels without cookie consent?

Short answer: **Not for marketing and advertising cookies.** The Personal Data Protection Authority's guidelines on cookie practices set out the approach that non-essential cookies must be based on explicit consent. Retargeting pixels fall into this category. They aren't strictly necessary for the service to function technically.

In practice, this means applying the following rules:

1. **The pixel must not load before consent is given.** Firing the LinkedIn Insight Tag as soon as the page loads is non-compliant, even if the banner has an "Accept" button. The tag should only fire after the user has consented to marketing cookies.
2. **"Accept" and "Reject" must be equally visible.** Hiding the reject option behind a small grey link or burying it two clicks deep undermines the claim that consent was freely given.
3. **No pre-ticked boxes.** Marketing cookies should be off by default.
4. **"By continuing to use the site, you are deemed to have accepted" is not enough.** Explicit consent must be given through an affirmative action.
5. **Consent must be split into categories.** Strictly necessary, analytics, functional and marketing cookies should each be manageable separately.
6. **Consent must be revocable.** Offer a way to change preferences in the footer or via a persistent icon.

On the technical side, the soundest approach is to integrate a tag manager such as Google Tag Manager with a **Consent Management Platform (CMP)**. Each tag is linked to a consent category and fires only when the relevant consent is received. On the Google side, configuring Consent Mode should also be treated as part of this flow.

### Where should the privacy notice live?

There should be a **cookie policy** accessible from the cookie banner, along with a separate **privacy notice**. These documents should clearly state which cookies are used, for what purpose, how long they're retained and which third parties (such as LinkedIn, Meta and Google) data is transferred to. Generic statements like "We use cookies to improve our services" are not sufficient.

## Is it legal to upload a customer or lead list to LinkedIn or Meta?

List-based retargeting is very powerful in B2B. For example, you could upload a list of 400 people who took a demo but didn't buy to LinkedIn and show them case study ads. However, from a KVKK perspective, this raises three separate questions.

### 1. What is your legal basis?

When you collected the email address through a form, did you tell the person that the data would be used for targeting on ad platforms? If not, you're using the data outside the purpose for which you collected it. That runs counter to KVKK's principle that processing must be relevant to, and limited to, the stated purpose.

Practical recommendation: At the form stage, explicitly add ad targeting to your privacy notice. Include a **separate, optional consent checkbox** for marketing use. The form should be submittable without ticking this box; in other words, consent must not be a precondition for requesting a demo.

### 2. Are you transferring data abroad?

A significant share of LinkedIn's, Meta's and Google's servers are located outside Turkey. Uploading a list means transferring personal data abroad. With amendments that came into force in 2024, Article 9 of KVKK was revised. There is now a more tiered system, including adequacy decisions, appropriate safeguards (such as the **standard contracts** published by the Board) and certain exceptional cases. When standard contracts are used, there's also an obligation to notify the Authority within a set period after signing.

How platform agreements fit within this framework requires both a technical and legal assessment. Always plan this step together with your legal counsel. "Everyone uploads lists" is not a legal basis.

### 3. Are you minimizing the data?

- Upload only the fields you need. In most cases, email is enough. Don't add phone numbers, job titles or addresses.
- Use the platform's hashing feature, or hash the data yourself before uploading.
- Remove people who unsubscribe, request deletion of their data or withdraw consent from the list **automatically**. Doing it manually means that, sooner or later, someone will be forgotten.

These issues are directly connected to the consent questions that come up in cold outreach. If you need a similar framework on the outbound side, take a look at our article on [what you can do in B2B cold email from a KVKK perspective](/blog/kvkk-b2b-cold-email).

## How do you build a KVKK-compliant retargeting setup? 7 steps

The following steps form a setup plan that a mid-sized B2B SaaS company can complete in 4–6 weeks.

1. **Create a data inventory.** List the tags running on your site: LinkedIn Insight Tag, Meta Pixel, Google Ads, Hotjar, HubSpot tracking code, chatbots. Most companies find 2–3 forgotten legacy tags the first time they do this inventory.
2. **Assign each tag to a category.** Separate them into strictly necessary, analytics, functional and marketing. All retargeting tags fall into the marketing category.
3. **Choose a CMP and connect it to your tag manager.** Test that marketing tags fire only on a consent signal. In your browser's developer tools, check that no LinkedIn or Meta domains appear in network requests before consent is given.
4. **Update your privacy notice and cookie policy.** Spell out, one by one, which platform receives data, for what purpose and for how long.
5. **Redesign your forms.** Add an optional marketing consent to your demo, content download and webinar forms. Store the consent status as a separate field in your CRM, for example "Ad targeting consent: Yes/No, date, source".
6. **Set up syncing between your CRM and ad platforms.** Only records with consent set to "Yes" should be pushed to ad audiences. When consent is withdrawn, the record should drop out of the audience. When designing this flow, making consent management and ad integrations key criteria [when choosing a B2B marketing automation tool](/blog/how-to-choose-b2b-marketing-automation-tool) will make your job easier.
7. **Define retention periods.** Decide how long people will stay in your retargeting audiences, for example 180 days. Configure your platform settings accordingly.

## Does retargeting work if your consent rate is low?

This is the question everyone asks after a compliant setup. Let's look at an example:

- Imagine a B2B SaaS site that gets 8,000 unique visitors a month.
- Say the consent rate for marketing cookies is 40%. This rate varies considerably depending on banner design and audience.
- In that case, the audience the pixel can recognize is roughly 3,200 people a month.
- The platform's match rate also comes into play. LinkedIn only recognizes a visitor when it can match them to a logged-in member. The audience you can actually serve ads to shrinks even further.
- On LinkedIn, an audience generally needs at least 300 matched members to be usable in a campaign. Niche segments such as pricing page visitors may fall below this threshold.

Bottom line: If your consent rate is low, pixel-based retargeting isn't enough on its own. But that doesn't mean you should give up on retargeting. It means you need to build your strategy in **layers**.

### Increasing your consent rate through legitimate means

- Write your banner in plain, honest language. Use wording that explains the real benefit without applying pressure, such as "To show you content relevant to your business instead of irrelevant ads."
- Avoid having the banner cover the page content entirely. Cornering users with "you can't proceed without accepting" makes the freedom of their consent questionable.
- A/B test different banner copy. But raising the rate by making "Reject" harder isn't a test; it's a risk.

## What are the alternatives that don't depend on pixels?

KVKK compliance actually steers you toward methods that are already more effective in B2B.

### Account-based targeting (ABM)

LinkedIn lets you upload a **company list** instead of a list of individuals. You upload the names and websites of the 250 companies you're targeting. The platform then shows ads to people who work at those companies and match the job title criteria you set. You don't upload any personal data. The platform does the matching using its own member data.

Technically, this method isn't retargeting, but in B2B it functionally serves the same purpose: staying visible to the right accounts again and again. We explain in detail how to define your target accounts in our [guide to ABM and account-based marketing](/blog/what-is-abm-account-based-marketing-b2b-saas).

### On-platform engagement retargeting

On LinkedIn, you can retarget people who watched more than 50% of your video ad, who opened a Lead Gen Form but didn't submit it, or who engaged with your company page. These audiences are built not from cookies on your site but from the platform's own data. This removes your cookie obligations on the site side. Data processing on the platform side, meanwhile, is governed by the user's relationship with the platform. Still, it's good practice to mention in your privacy notice that you use these platforms.

A sample setup might look like this:

- **Week 1:** A 60-second, problem-focused video to target accounts.
- **Weeks 2–3:** A case study carousel to people who watched 50%+ of the video.
- **Week 4 onward:** A Lead Gen Form with a demo offer to people who engaged with the carousel.

If you want to run these kinds of LinkedIn campaigns alongside organic content, [Social Media Corner's experience in B2B LinkedIn management](https://socialmediacorner.co) can help you bring your ad and content calendars under one roof.

### Contextual targeting

You target the content, not the person. Showing ads on pages about "CRM integration" or in industry publications are examples of this. It requires no tracking data. Targeting precision is lower, but it's a good complement for brand awareness and the top of the funnel.

## How should you segment a B2B retargeting campaign?

Once you've built a compliant setup, the real difference shows up in segmentation. Showing everyone the same ad both wastes budget and annoys users.

| Segment | Window | Message | Recommended frequency |
|---|---|---|---|
| Blog readers | 90 days | Relevant guide or lead magnet | 1–2 per week |
| Product/feature page visitors | 60 days | Case study, use case | 2–3 per week |
| Pricing page visitors | 30 days | Demo, ROI calculator, comparison | 3 per week |
| Demo form abandoners | 14 days | Short demo invitation, social proof | Max 1 per day |
| Existing customers | Ongoing | New features, upsell | Low |

A few practical rules:

- **Exclude existing customers and open opportunities.** Showing a "Get a free demo" ad to an account that's in negotiations with your sales team doesn't look professional. To make this exclusion possible, the stage data in your CRM needs to be in sync with marketing. At this point, clarifying the [lead handoff SLA between marketing and sales](/blog/lead-handoff-sla-marketing-sales-alignment) also makes audience management easier.
- **Cap frequency.** In small B2B audiences, it's easy for the same person to see an ad 10 times a week. That both drains your budget and creates an "I'm being followed" feeling. A KVKK-compliant campaign should also feel respectful.
- **Tailor the landing page to the segment.** Sending a pricing page visitor to the homepage lowers conversion. Consider a separate landing page for each segment. You'll find a step-by-step breakdown of how to structure these pages in our [B2B SaaS landing page guide](/blog/how-to-build-b2b-saas-landing-page).

### How should you plan your budget?

Retargeting budgets are usually a small share of total paid media spend, because the audience is small. A sample plan:

- A company with a monthly paid advertising budget of TRY 100,000 could allocate 15–25% of it to the retargeting and ABM layer.
- The rest goes to new audience acquisition. These acquisition campaigns are what fill the retargeting pool.
- If your audience is small, increasing the budget won't deliver results; it will just raise frequency. Grow the pool first.

## The most common KVKK mistakes

- **Loading the pixel before the banner.** This is the most common mistake and, technically, the easiest to detect.
- **Uploading business cards collected at trade shows or events directly to ad platforms.** If the person wasn't informed about this use, the legal basis is weak.
- **Using purchased lists as Custom Audiences.** Transferring a list to a platform abroad when you don't know under what privacy notice and legal basis it was collected multiplies the risk.
- **Not updating audiences when consent is withdrawn.** Someone marked as "unsubscribed" in the CRM keeps seeing ads for weeks.
- **Agencies holding audiences in their own accounts.** Keeping audiences and pixels in the company's own ad account is healthier in terms of both control and accountability. You are the data controller, and the agency is the data processor. This relationship should be governed by a written agreement.

## Frequently asked questions

### Is explicit consent always required for B2B retargeting?

The approach that explicit consent is required for marketing cookies and retargeting pixels placed on your site is widespread, and it's the safest path. In account-based targeting using lists that contain no personal data, such as company names, personal data processing on your side remains limited. Evaluate the legal basis for each scenario separately with your legal counsel.

### Does hashing email addresses before uploading solve the KVKK problem?

No. Hashing is a security measure, not anonymization. Because the platform can match hashed emails to its own users, the data remains personal data. You still need to comply with the rules on privacy notices, legal basis and cross-border transfers.

### Is LinkedIn company list targeting safer from a KVKK perspective?

It's generally lower risk, because you only upload company-level information such as company name and website, and the platform does the matching using its own member data. Even so, it's good practice to state in your privacy notice that you use LinkedIn for advertising purposes.

### Our consent rate is very low — should we stop retargeting?

You don't need to stop; you need to layer your strategy. Continue pixel-based retargeting with visitors who give consent. Add account-based targeting, on-platform engagement retargeting and consented CRM lists alongside it. In B2B, this layered structure often delivers more accurate results than pixels alone.

## Conclusion

KVKK-compliant B2B retargeting is less a restrictive obligation than a more disciplined marketing model. Tying pixels to consent, providing honest privacy notices on forms, grounding list uploads in a legal basis and keeping your CRM and ad audiences in sync both reduces risk and ensures your budget is spent on genuinely relevant accounts. Where consent rates fall short, account-based targeting and on-platform engagement audiences step in. The result is a retargeting setup that's both lawful and genuinely useful to your sales team.

If you'd like to make your retargeting setup KVKK-compliant, connect your CRM and ad platforms, or design your account-based campaigns, [get in touch with the SAAS Corner team](/en/contact). Let's review your current setup together and map out a roadmap that fits your needs.
