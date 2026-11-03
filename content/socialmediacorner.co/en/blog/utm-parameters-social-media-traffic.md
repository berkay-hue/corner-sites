---
title: "UTM Parameters: How to Measure Social Media Traffic"
description: "Learn step by step how to use UTM parameters to track whether your B2B social media posts actually turn into qualified leads."
date: "2026-11-04"
category: "Measurement"
image: "https://images.pexels.com/photos/12969403/pexels-photo-12969403.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "UTM Parameters: How to Measure Social Media Traffic"
alt: "utm-parametreleri-sosyal-medya-trafigi-olcumu"
---

UTM parameters are tags added to the end of a web address that tell your analytics tool which platform, campaign and piece of content a visitor came from. To measure social media traffic accurately, you need to add the **utm_source, utm_medium and utm_campaign** parameters to every link you share on LinkedIn and Instagram, following a consistent naming convention. You can then read this data in Google Analytics 4 (GA4) and your CRM to see which post, ad or employee share brought in site traffic, form submissions and sales opportunities.

The question social media teams at B2B companies hear most often is: "What are these posts actually earning us?" Likes and impressions aren't enough to answer it. The sales team wants to see demo requests, and leadership wants to see the contribution to pipeline. UTM parameters are the simplest and cheapest tool for closing the gap between social media engagement and on-site conversion. In this article, we explain what UTMs are, how to build a naming convention for B2B companies, how to implement it step by step on LinkedIn and Instagram, and how to report on the data.

## What exactly is a UTM parameter?

UTM stands for "Urchin Tracking Module." Inherited from Urchin, the analytics software Google acquired in 2005, this structure is read today by almost every analytics and marketing automation tool, with GA4 leading the way.

Technically, a UTM link consists of key-value pairs appended to the end of a normal URL after a question mark. Example:

`https://www.ornekfirma.com/webinar?utm_source=linkedin&utm_medium=social&utm_campaign=2025-q2-veri-guvenligi-webinar&utm_content=carousel-v1`

When this link is clicked, the page opens exactly the same way; nothing changes for the user. GA4, however, records the session as "a visit from LinkedIn, via organic social, as part of the Q2 2025 data security webinar campaign, from the first version of the carousel post."

## What UTM parameters are there, and what does each one do?

There are five classic parameters. In practice, the first three are mandatory and the last two are optional.

- **utm_source (source):** The platform the traffic comes from. Example: `linkedin`, `instagram`, `facebook`, `newsletter`.
- **utm_medium (medium):** The type of traffic. Example: `social` (organic social), `paid-social` (paid social), `email`.
- **utm_campaign (campaign):** The campaign or initiative the link belongs to. Example: `2025-q2-data-security-webinar`.
- **utm_content (content):** Used to distinguish between different content, visuals or sharers within the same campaign. Example: `video-30s`, `carousel-v2`, `employee-ayse-k`.
- **utm_term (term):** Originally designed for keywords in search ads. On social media, it's usually used to specify the audience segment. Example: `cfo-targeting`, `retargeting-site-visitors`.

In addition to these, GA4 also supports newer parameters such as `utm_id` (campaign ID), `utm_source_platform`, `utm_creative_format` and `utm_marketing_tactic`. For most B2B teams, using the first five parameters with discipline is enough. We recommend introducing the additional parameters only once your reporting maturity has grown.

## Why is social media traffic measured incorrectly without UTMs?

Many teams think, "GA4 already shows traffic from LinkedIn, so why do I need UTMs?" The problem is that GA4's guesswork without UTMs is often incomplete or wrong:

1. **Mobile apps cause referrer information to be lost.** Links opened in the in-app browser of the LinkedIn or Instagram app sometimes carry no referrer information. These visits show up as "Direct" traffic, and social media's contribution becomes invisible.
2. **Organic and paid traffic get mixed up.** Without UTMs, you can't tell whether a visit from LinkedIn came from an organic post or a sponsored ad. As a result, budget decisions are made blindly.
3. **You don't know which content works.** If you linked to the same landing page in three different posts in the same week, without UTMs you can't tell which one drove the form submissions.
4. **The impact of employee shares gets lost.** Posts shared from the personal profiles of the sales team or executives end up lumped together with traffic from the company page.
5. **Messaging and "dark social" traffic disappears entirely.** A link shared in a LinkedIn message or a WhatsApp group is usually counted as direct traffic if it has no UTM.

These gaps may seem small, but by the end of the reporting period they cause social media to look systematically less valuable than it really is. For any team trying to [measure B2B social media ROI](/blog/measure-b2b-social-media-roi), the first step is making sure traffic is tagged correctly.

## How do you build a UTM naming convention for B2B?

The power of UTMs comes from consistency. `LinkedIn`, `linkedin`, `Linkedin.com` and `li` appear as four separate sources in GA4. A year later, your report consists of hundreds of scattered rows and nothing is readable anymore. That's why the first task is to define a written naming convention.

### Basic rules

- **Always use lowercase.** GA4 is case-sensitive.
- **Don't use spaces.** Separate words with hyphens (`-`). Underscores can also be used, but stick to one choice.
- **Don't use Turkish characters.** Write `guvenlik` instead of `güvenlik`, and `ceyrek` instead of `çeyrek`. Turkish characters get encoded in the URL and can become unreadable in reports.
- **Add a date to the campaign name.** A `year-quarter-topic` format makes it easier to compare campaigns on the same topic over the years.
- **Document your abbreviations.** Does `wbn` mean webinar or something else? Everyone needs to use the same dictionary.

### A sample convention table

The structure below is a good starting point for most B2B companies:

- **utm_source:** `linkedin`, `instagram`, `facebook`, `youtube`, `x`
- **utm_medium:**
  - `social` → organic company page posts
  - `paid-social` → sponsored content and ads
  - `employee-social` → employee and executive posts
  - `social-dm` → LinkedIn messages, Instagram DMs
  - `bio-link` → Instagram profile link
- **utm_campaign:** `2025-q2-data-security-webinar`, `2025-q3-product-launch-erp`, `always-on-blog`
- **utm_content:** content format + version or the person sharing (`video-v1`, `document-v2`, `employee-mehmet-a`)
- **utm_term:** audience segment (`it-managers`, `retargeting-30-days`, `lookalike-customers`)

An important technical note: GA4's default channel grouping assigns social media traffic whose `utm_medium` value starts with "paid" to the **Paid Social** channel, and values such as `social` to the **Organic Social** channel. Custom values like `employee-social` usually appear under Organic Social as long as the source is a known social platform. Still, to avoid unexpected results in the default channel reports, it's a good idea to test your custom medium values once or define a custom channel group in GA4.

### Where should you keep the convention?

The most practical approach is a shared Google Sheets or Excel file. This file should contain:

1. One tab listing the allowed sources, mediums and formats,
2. One tab with a template that generates UTM links using dropdown menus,
3. One tab logging all links created (date, campaign, creator, destination URL).

This file should live in the same place as your content calendar and approval process. If your team has a [social media content approval process](/blog/b2b-social-media-content-approval-process), adding the question "Was the UTM link generated from the standard file?" to the checklist catches most errors before publishing.

## How do you create a UTM link step by step?

Let's walk through a concrete scenario. Suppose a B2B software company is hosting a webinar for finance directors titled "AI in Cash Flow Forecasting." The campaign will run on both LinkedIn and Instagram, both organically and as paid.

1. **Define the destination URL.** Example: `https://www.ornekyazilim.com/webinar/nakit-akisi`
2. **Set the campaign name.** Following the convention: `2025-q3-cash-flow-webinar`
3. **Generate a separate link for each distribution point.** For example:
   - LinkedIn company page video post: `utm_source=linkedin&utm_medium=social&utm_campaign=2025-q3-cash-flow-webinar&utm_content=video-v1`
   - LinkedIn sponsored document ad: `utm_source=linkedin&utm_medium=paid-social&utm_campaign=2025-q3-cash-flow-webinar&utm_content=document-v1&utm_term=cfo-targeting`
   - Sales director's personal post: `utm_source=linkedin&utm_medium=employee-social&utm_campaign=2025-q3-cash-flow-webinar&utm_content=employee-sales-director`
   - Instagram story link sticker: `utm_source=instagram&utm_medium=social&utm_campaign=2025-q3-cash-flow-webinar&utm_content=story-countdown`
4. **Generate the link with a URL builder or template.** Google's free Campaign URL Builder or a concatenation formula in your own spreadsheet is all you need.
5. **Test the link.** Open it in your browser, then check in GA4 under **Reports > Realtime** that your own visit appears with the correct source and campaign.
6. **Shorten it if needed.** Long UTM links look bad in post copy. You can use a shortener like Bitly or a short link service that works with your own domain. The shortener preserves the UTM parameters.
7. **Log it.** Add the link to the UTM log tab, along with the post it was used in.

With this setup, you'll be able to clearly answer all of these questions at the end of the campaign: How many webinar registrations came from organic LinkedIn versus paid? Did the video or the document drive more registrations? Was the sales director's post more effective than the company page?

## How do you use UTMs on LinkedIn and Instagram?

Each platform has its own link placements and limitations. Here are practical notes for the two platforms B2B companies use most:

### LinkedIn organic posts

- Add UTMs to the link in the post copy. LinkedIn generates the link preview from a UTM-tagged URL without any problems.
- If you use the tactic of placing the link in the first comment, be sure to add UTMs to the link in the comment as well, and set the `utm_content` value to something like `first-comment`. This lets you compare the performance of the link in the body with the link in the comment.
- Put a UTM-tagged link on the company page's "Visit website" button too (e.g., `utm_medium=profile-link`).

### LinkedIn employee and executive posts

Employee advocacy is one of the most underestimated traffic sources in B2B. Giving each employee a link with their own `utm_content` value lets you see whose posts actually drive traffic and leads. We covered this approach in detail in our [guide to employee sharing on LinkedIn](/blog/b2b-employee-advocacy-linkedin). A practical tip: when sending employees ready-made post copy, embed the UTM-tagged short link in the text. Error rates rise significantly when employees try to create links themselves.

### LinkedIn ads

- In Campaign Manager, add UTMs to the destination URL of every ad. If you're testing ad copy and visuals, each variation should have a different `utm_content` value.
- If you use LinkedIn Lead Gen Forms, users never visit your site, so UTMs don't carry data into GA4. In this case, you can use the form's **hidden fields** to write campaign and content information into the lead record. We explained the setup steps in our [LinkedIn Lead Gen Form setup guide](/blog/how-to-set-up-linkedin-lead-gen-form).

### Instagram

Instagram is more restrictive than LinkedIn when it comes to links:

- **Links in post captions aren't clickable.** So don't expect direct UTM-tagged traffic from organic feed posts.
- **Profile link (bio link):** Place a link here tagged with `utm_medium=bio-link`. If you use a link-in-bio tool, add separate UTMs to each button on that page. Otherwise, all traffic will appear under the link tool's name.
- **Story link sticker:** Use a separate `utm_content` value for each story (e.g., `story-poll`, `story-countdown`).
- **Instagram ads (Meta Ads Manager):** You can use dynamic variables in the "URL parameters" field at the ad level. For example, a template such as `utm_source={{site_source_name}}&utm_medium=paid-social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}` automatically writes campaign and ad names into the UTMs. For this method to work, your campaign names in Ads Manager must also follow your UTM convention: no Turkish characters and all lowercase.
- **DMs:** Use `utm_medium=social-dm` for links you share in Instagram messages.

If you're wondering how to interpret Instagram metrics in the platform's own dashboard, our article on [Instagram analytics and B2B metrics](/blog/how-to-read-instagram-analytics-b2b) paints a more meaningful picture when read alongside your UTM data.

## Where do you find UTM data in GA4?

Once your links are set up correctly, follow these steps in GA4 to read the data:

1. Open **Reports > Acquisition > Traffic acquisition**.
2. Change the table's primary dimension to **Session source / medium**. Here you'll see rows such as `linkedin / social`, `linkedin / paid-social` and `instagram / bio-link`.
3. Add **Session campaign** as a secondary dimension.
4. To see `utm_content` data, use the **Session manual ad content** dimension.
5. Filter the conversion (key event) column, for example to `form_submit` or `demo_request`.

For deeper analysis, create a free-form report in the **Explore (Explorations)** section: add campaign and content to the rows, source/medium to the columns, and sessions, engaged sessions and key event count to the values. This report becomes a template you can reuse every month.

An example interpretation: Let's say that in the webinar campaign, LinkedIn ads brought in 800 sessions and 24 registrations, while the sales director's personal post brought in 150 sessions and 12 registrations. Although ad traffic is larger in volume, the personal post's conversion rate (8%) is roughly two and a half times that of the ads (3%). This kind of insight gives you data to back the decision to invest more effort in employee sharing in the next campaign.

## How do you connect UTM data to your CRM and sales process?

In B2B, the real question isn't "how many visits came in?" but "how many qualified opportunities and how much revenue came in?" To answer it, UTM data needs to be passed into your CRM at the moment a form is submitted.

1. **Add hidden fields to your forms.** Create hidden form fields for `utm_source`, `utm_medium`, `utm_campaign` and `utm_content`.
2. **Capture the parameters.** With a simple JavaScript snippet or Google Tag Manager setup, read the UTM values from the URL, store them in a cookie, and write them into the hidden fields when the form is submitted. That way, even if a user arrives from LinkedIn and browses three pages before filling out a form, the source information isn't lost.
3. **Distinguish between first and last touch.** In your CRM, store both the original source (first touch) and the source of the session in which the form was submitted (last touch) in separate fields. Because B2B sales cycles are long, a lead may have first been brought in by LinkedIn but filled out the form from an email newsletter.
4. **Map to opportunity stages.** In your CRM report, view the number of leads, qualified leads (MQL/SQL), opportunities and closed-won deals side by side, by campaign.

Most CRMs, such as HubSpot, Salesforce and Pipedrive, support this setup either with built-in features or small integrations. For teams that want to design end-to-end automation workflows linking marketing and sales data, these kinds of integration projects can also be handled under the umbrella of [strategy- and automation-focused Corner Group](https://cornergroup.co).

## What are the most common UTM mistakes?

The mistakes we see most often in the field, and how to fix them:

- **Adding UTMs to internal links:** If you add UTMs to a link from one page on your site to another, GA4 starts a new session and overwrites the original source. UTMs should only be used on links coming to your site from **external sources**.
- **Inconsistent naming:** `LinkedIn` and `linkedin` become two separate rows. A standard file and dropdown menus solve this problem.
- **Keeping campaign names too generic:** A campaign name like `social-media` tells you nothing. It should include a date and a topic.
- **Misusing utm_medium:** Entering `linkedin` in the medium field breaks your channel reports. The medium describes the type of traffic, not the platform.
- **Not testing shortened links:** Shorteners can sometimes break parameters during the redirect. Click once before publishing and check the GA4 realtime report.
- **Ignoring cookie consent:** Due to KVKK (Turkey's data protection law) and cookie consent management, some users who reject cookies may not be fully visible in GA4. This is a limitation of the measurement infrastructure, not of UTMs. Factor in this margin when interpreting reports.
- **Not keeping a log:** If, six months later, someone asks "what was this `v3`?" and there's no log to answer, the data loses its meaning.

## What tools do you need, and how much do they cost?

The good news: you don't need a big budget to build a solid UTM infrastructure.

- **Google Analytics 4:** Free.
- **Google Tag Manager:** Free. Used to pass UTMs into form fields.
- **Google Sheets or Excel:** Sufficient for your UTM convention and log file.
- **Link shortener:** Free plans are enough to get started. If you want branded links on your own domain, there may be a small monthly fee.
- **CRM:** The system you already use is usually sufficient. Hidden field support is available on most plans.

The real cost is time and discipline. The initial setup (defining the convention, preparing templates, GA4 and form integration) takes a few business days at most B2B companies. After that, generating links for each campaign takes minutes. The real challenge is making sure the entire team sticks to the convention consistently.

## How should you reflect UTM data in your reports?

The value of UTMs emerges when the data regularly reaches decision-makers. We recommend adding the following sections to your monthly social media report:

1. **Channel summary:** Sessions and conversions from LinkedIn organic, LinkedIn paid, employee shares and Instagram.
2. **Campaign performance:** Sessions, leads and qualified leads generated by each campaign.
3. **Content comparison:** The three best- and worst-performing pieces of content by `utm_content`.
4. **Pipeline contribution:** Social media–sourced opportunity and closed-won deal data pulled from the CRM.
5. **Action recommendations:** Two or three concrete, data-driven decisions for the next month.

We explained in detail how to combine this structure with platform metrics in our [guide to preparing B2B social media reports](/blog/how-to-build-b2b-social-media-report).

## Frequently asked questions

### Do UTM parameters hurt SEO?

Not when used correctly. UTM-tagged links are used on social media and in ads, while search engines look at a page's canonical tag to index the original URL. You just need to make sure the pages on your site have the correct canonical tag.

### Can I measure organic Instagram posts with UTMs?

Since links in Instagram feed captions aren't clickable, you can't measure them directly. Instead, you can measure the traffic organic Instagram drives to your site by using UTMs in your profile link, story link stickers and DMs. A practical solution is to add a "link in bio" call-to-action in the post and update your profile link with a campaign-specific UTM.

### Should I use "social" or "paid-social" for utm_medium?

Use `social` for organic posts and a value starting with "paid" (e.g., `paid-social`) for ads. GA4's default channel grouping assigns traffic to the Organic Social and Paid Social channels based on this distinction. This lets you report on the contributions of organic and paid social separately.

### If I use LinkedIn Lead Gen Forms, do I need UTMs?

With Lead Gen Forms, users don't visit your site, so UTMs don't pass data into GA4. However, you can apply the same logic on the CRM side by writing campaign and content information into the form's hidden fields. This way, you can report on site traffic and form leads together using the same naming convention.

## Conclusion

UTM parameters are the most fundamental, yet most neglected, building block of social media measurement. With a consistent naming convention, a separate link for each distribution point, the right report setup in GA4, and hidden form fields connected to your CRM, you can clearly see how every post on LinkedIn and Instagram contributes to site traffic and the sales pipeline. Social media then stops being a vague line item discussed under "brand awareness" and becomes a channel defended with data in budget decisions.

If you want to measure your social media traffic end to end, set up your UTM convention and align your reports with your sales goals, the Social Media Corner team is ready to help. [Get in touch with us](/en/contact) to assess your current situation together.
