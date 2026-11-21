---
title: "How to Track Social Media Conversions in GA4"
description: "A step-by-step guide for B2B teams on setting up, tracking and reporting social media form and demo request conversions in Google Analytics 4."
date: "2026-11-17"
category: "Measurement"
image: "https://images.pexels.com/photos/139387/pexels-photo-139387.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "How to Track Social Media Conversions in GA4"
alt: "ga4-sosyal-medya-donusumleri-nasil-izlenir"
---

Tracking social media conversions in GA4 takes three things: **tagging your links with UTM parameters, defining critical actions such as demo requests or form submissions as "key events," and reading those events by the "Organic Social" and "Paid Social" channels in the Acquisition and Attribution reports.** With all three steps in place, you can see what a visitor arriving from a LinkedIn post, an Instagram story or a sponsored campaign does on your site, broken down by channel, campaign and content.

The problem is that most B2B companies leave this setup half-finished. Social traffic disappears under "Referral" or "Direct," form submissions are miscounted, and in the end nobody can give leadership a clear answer to the question "Is social media actually working?" In this article, we walk you step by step through setting up social media conversion tracking in GA4 from scratch, which reports to look at, and how to avoid the pitfalls specific to B2B.

## Why is measuring social media conversions harder in B2B?

In B2C, a user who clicks an Instagram ad can buy a product in the same session. In B2B, the purchasing decision takes weeks or even months and involves multiple people. A procurement manager sees your company's carousel post on LinkedIn, searches for your brand on Google two weeks later, and a month after that visits your site directly and requests a demo.

On this journey, GA4's default reports can highlight the last touchpoint (for example, "Direct"), making social media's role invisible. That's why social media measurement in B2B needs to account for three characteristics:

- **Long sales cycle:** The conversion may happen long after the first touchpoint.
- **Multiple decision-makers:** Different people from the same company may arrive through different channels.
- **On-platform conversions:** With tools like LinkedIn Lead Gen Forms, users fill out a form without ever visiting your site.

GA4 doesn't solve all of these problems on its own, but when set up correctly, it brings most of the picture into focus.

## What does "conversion" mean in GA4 now?

In 2024, Google renamed the "conversion" concept in GA4 to **"key event."** The term "conversion" is now used mainly on the Google Ads side. In practice, not much has changed: when you mark any event that happens on your site as business-critical, GA4 reports it as a key event.

In GA4, everything is an event: a page view (`page_view`), a scroll (`scroll`), a file download (`file_download`), a form submission (`form_submit`) or a custom event you create (such as `demo_talebi`). Your job is to decide which of these events actually carry value.

## Which actions should you track as key events?

Preparing a measurement plan before you start the setup prevents confusion later. A typical breakdown for a B2B company looks like this:

**Macro conversions (those that directly create sales opportunities):**
- Demo or quote request form submissions
- Contact form submissions
- Meetings booked through a scheduling tool
- Free trial sign-ups (for SaaS companies)

**Micro conversions (those that signal interest and intent):**
- E-book, report or case study downloads
- Webinar registrations
- Newsletter subscriptions
- Pricing page views
- Clicks on a phone number or email address

Our recommendation is to **limit the number of key events to 5–8**. If you mark every event as a key event, your reports become bloated and it gets harder to tell which actions really matter. To decide which metrics should take center stage in your reporting, take a look at our [guide to B2B social media KPIs](/blog/b2b-social-media-kpis).

## Step 1: Tag your social media links with UTMs

For GA4 to classify social media traffic correctly, it needs to know the source. The in-app browsers of the LinkedIn and Instagram apps often pass incomplete referrer information, which causes traffic to fall under "Direct." The solution is to add UTM parameters to every link you share.

The core parameters are:

- `utm_source`: The platform the traffic comes from (linkedin, instagram)
- `utm_medium`: The type of traffic (social for organic, paid_social or cpc for paid)
- `utm_campaign`: The campaign name (2025_q1_demo_kampanyasi)
- `utm_content`: The content or creative variant (karusel_v1, video_v2)

An example organic LinkedIn link:

`https://siteniz.com/demo?utm_source=linkedin&utm_medium=social&utm_campaign=urun_lansmani&utm_content=karusel`

An example paid Instagram link:

`https://siteniz.com/e-kitap?utm_source=instagram&utm_medium=paid_social&utm_campaign=ebook_mart&utm_content=video_15sn`

The most critical point is **consistency**. If one team member writes "LinkedIn," another "linkedin" and someone else "li," GA4 will show them as three separate sources. To prevent this, create a shared UTM template (a simple spreadsheet is enough) and make all-lowercase a rule. You'll find more examples of naming conventions in our [article on measuring social media traffic with UTM parameters](/blog/utm-parameters-social-media-traffic), where we cover UTM structure in depth.

## Step 2: Check the default channel grouping

GA4 sorts traffic into channels using a set of rules called the "Default Channel Group." Two channels matter for social media:

- **Organic Social:** When the source is a known social network site (linkedin.com, lnkd.in, instagram.com, l.instagram.com, etc.) or the medium value is one of "social," "social-network," "social-media," "sm," and similar.
- **Paid Social:** When the source is a social network and the medium value is "cpc," "ppc," "retargeting," or starts with "paid" (such as paid_social).

That's why you shouldn't choose your UTM medium value at random. For example, if you use `utm_medium=linkedin_post`, GA4 will most likely place that traffic in the "Unassigned" channel. Using `social` for organic posts and `paid_social` for ads is the safest approach.

To check: open the **Reports > Acquisition > Traffic acquisition** report and look at the "Unassigned" row. If there's meaningful traffic in that row, add "Session source/medium" as a secondary dimension to identify which tags were written incorrectly.

You can also create a custom channel group tailored to your needs (**Admin > Data display > Channel groups**). For example, defining separate channels such as "LinkedIn Organic," "LinkedIn Paid" and "Instagram Organic" can speed up your reporting.

## Step 3: Create your conversion events

This is the most technical part, but also the most important. GA4's "Enhanced Measurement" feature tries to track form interactions automatically, but it often misfires on B2B sites: it may mistake a search box for a form, count failed submissions as successful, or fail to detect third-party form tools altogether. That's why we recommend defining your critical forms yourself. There are three common methods:

### Method 1: Creating an event based on a thank-you page

If users are redirected to a separate page such as `/tesekkurler` after submitting a form, this is the easiest method:

1. Go to **Admin > Data display > Events**.
2. Click the **Create event** button.
3. Give the new event a name, for example `demo_talebi`.
4. Set the conditions as `event_name` equals `page_view` and `page_location` contains `/demo-tesekkurler`.
5. Save.

Now, every time this page is viewed, GA4 records a `demo_talebi` event. Note: Make sure the thank-you page isn't indexed by search engines and can't be accessed directly; otherwise, you'll end up with fake conversions.

### Method 2: Tracking form submissions with Google Tag Manager

If the form displays a "Thank you" message on the same page, Google Tag Manager (GTM) is the more reliable route:

1. In GTM, create a trigger that detects the form submission (a form submission trigger or a `dataLayer` event pushed by your developer).
2. Create a "GA4 Event" tag and set the event name. Using Google's recommended name, `generate_lead`, makes future Google Ads integration easier.
3. If needed, add a parameter such as `form_adi` to distinguish which form was submitted (demo, contact, e-book).
4. Test in Preview mode, then publish.

The most robust method is for your developer to fire code such as `dataLayer.push({event: 'form_basarili', form_adi: 'demo'})` when the form is submitted successfully. That way, only truly successful submissions are counted.

### Method 3: Built-in integrations of third-party tools

Many tools, such as HubSpot and Calendly, offer a direct integration with GA4 or the ability to send events via cross-window messaging (postMessage). If you use these tools, check their documentation; in many cases, you won't need to build the setup from scratch.

## Step 4: Mark events as key events

Creating an event isn't enough on its own; you need to tell GA4 that it matters:

1. Go to **Admin > Data display > Key events**.
2. Click the **New key event** button and enter the event name (for example, `demo_talebi`).
3. Alternatively, click the star icon next to the relevant event in the **Events** list.

Optionally, you can assign a **default value** to each key event. In B2B, since sales revenue isn't generated directly on the site, this value is an estimate. A simple calculation example:

- Let's say your average deal size is 200,000 TL.
- Let's say 10% of demo requests turn into sales.
- In that case, the estimated value of a demo request is 200,000 × 0.10 = **20,000 TL**.

By the same logic, if the sales conversion rate for e-book downloads is 1%, its value can be set at 2,000 TL. These values aren't actual revenue, but they make it easier to compare the relative contribution of different channels and campaigns. We explain how to carry this approach into a return-on-investment calculation in our [article on how to measure B2B social media ROI](/blog/measure-b2b-social-media-roi).

**Important note:** GA4 does not calculate key events retroactively. If you mark an event today, only data from today onward will be reported as a key event. That's why you should complete the setup before your campaign launches.

## Which reports show your social media conversions?

Once the setup is complete, use the following reports to read the data:

### Traffic acquisition report

Go to **Reports > Acquisition > Traffic acquisition**. This report is session-based, meaning it shows which channel each session started from. In the table, you'll see the **Key events** column for the "Organic Social" and "Paid Social" rows. You can select a specific event (for example, only `demo_talebi`) from the drop-down menu in the column header.

For more detail, change the primary dimension to "Session source/medium" or "Session campaign." This lets you see the performance of "linkedin / social" versus "linkedin / paid_social," or the differences between campaigns, side by side.

### User acquisition report

The **Reports > Acquisition > User acquisition** report shows which channel users came from when they visited your site **for the first time**. This is extremely valuable for B2B: if a user first arrived from LinkedIn and requested a demo a month later by visiting directly, this report lets you see the conversion attributed to social media as the "first user channel." It's a powerful tool for proving social media's role in building awareness.

### Conversion paths and model comparison

The **Advertising > Attribution > Conversion paths** report shows the sequence of channels users go through before converting. For example, you'll see paths like "Paid Social → Organic Search → Direct." If this report shows that social media typically sits at the beginning of the journey, you'll understand that cutting budget based on last-click data alone would be a mistake.

### Explorations

When the standard reports aren't enough, you can build custom analyses in the **Explore** section:

- **Free form:** To analyze source, campaign, content and landing page dimensions together.
- **Funnel exploration:** To see where drop-off occurs across steps such as "Visitor from LinkedIn → Services page → Pricing page → Demo form."
- **Path exploration:** To understand which pages users arriving from social media browse on your site.

To build a clear structure when presenting findings from these reports to leadership, you can use our [guide to preparing a B2B social media report](/blog/how-to-build-b2b-social-media-report).

## Which attribution model should you use?

GA4 now offers two main attribution model options: **data-driven** and **last click** (including paid and organic channels). Older models such as first click, linear and time decay were removed in 2023.

You can choose the model and adjust the lookback window under **Admin > Data display > Attribution settings**. Our recommendations for B2B:

- **Use the data-driven model.** This model gives credit to each touchpoint on the path to conversion based on its contribution. Channels at the start of the journey, such as social media, receive almost no credit under the last-click model, but they're evaluated more fairly under the data-driven model.
- **Set the lookback window to 90 days.** The default is 90 days, but it may have been changed, so check it. With long sales cycles, a 30-day window largely misses social media's contribution.
- **Extend data retention to 14 months.** Under **Admin > Data collection and modification > Data retention**, the default value is 2 months. This setting determines your access to historical data in Explorations reports and is critical for year-over-year comparisons in B2B.

In accounts without sufficient data volume, the data-driven model may produce results close to last click. Still, choosing the right model and configuring your settings from the start will deliver more reliable insights as data accumulates.

## Why don't LinkedIn Lead Gen Form conversions show up in GA4?

This is one of the questions B2B marketers run into most often. LinkedIn Lead Gen Forms and Instagram's instant form ads let users fill out a form without leaving the platform. Since the user never visits your site, no trace of these conversions appears in GA4.

There are several ways to close this gap:

1. **Track platform reports separately:** LinkedIn Campaign Manager and Meta Ads Manager report on-platform form conversions in their own dashboards. In your reporting, present this data alongside your GA4 data, but as a separate category.
2. **Connect to your CRM:** Send form data directly to your CRM and mark the source field as "LinkedIn Lead Gen." This lets you track whether these leads turn into sales. We cover the setup in detail in our [article on connecting LinkedIn lead forms to your CRM](/blog/connect-linkedin-lead-gen-form-to-crm).
3. **Send them to GA4 via the Measurement Protocol:** If you have technical resources, you can use the GA4 Measurement Protocol to send lead data from your CRM to GA4 as server-side events. This method requires setup and maintenance, but it's valuable for companies that want to see all conversions in a single dashboard.

On-platform forms generally bring in more leads than on-site forms, but lead quality can be more variable. That's why you need to look not only at lead volume but also at the rate of qualified opportunities in your CRM. For software companies that want to generate leads through outbound channels alongside social media, [SAAS Corner's outbound sales and lead generation service focused on B2B SaaS](https://saascorner.co) offers a complementary approach.

## Example scenario: Tracking a B2B campaign in GA4

To make this concrete, let's work through a fictional example. A company selling industrial software uses the following channels in a three-month campaign:

- 3 organic posts per week on LinkedIn
- A sponsored content campaign on LinkedIn
- 2 carousel posts per week on Instagram

The company uses UTMs on all links and has defined two key events: `demo_talebi` (valued at 20,000 TL) and `ebook_indirme` (valued at 2,000 TL).

Let's assume the Traffic acquisition report shows the following at the end of the campaign:

- **linkedin / paid_social:** 1,200 sessions, 8 demo requests, 45 e-book downloads
- **linkedin / social:** 900 sessions, 5 demo requests, 20 e-book downloads
- **instagram / social:** 600 sessions, 1 demo request, 15 e-book downloads

At first glance, Instagram looks weak. However, the User acquisition report shows that users who first arrived from Instagram later returned via direct or organic search and generated 4 more demo requests. The Conversion paths report also shows that Instagram is frequently the first step in the journey.

These findings support the following decision: position Instagram not as a direct lead channel but as a channel for awareness and brand trust, set its KPIs accordingly, and optimize the content mix instead of cutting the budget. A team looking only at last click, on the other hand, would probably have deemed Instagram unnecessary and shut it down.

## What are the most common mistakes?

These are the mistakes we encounter most often during setup and reporting:

- **Not tagging social media bio and profile links:** The website link on your LinkedIn company page and your Instagram bio link drive a steady stream of traffic. Add UTMs to these links as well (for example, `utm_campaign=profil_linki`).
- **Using UTMs on internal links:** If you use UTMs on links from one page of your own site to another, the session restarts and the original source information is wiped out. UTMs should only be used on links from external sources.
- **Double-counting form submissions:** If you make both Enhanced Measurement's `form_submit` event and your own `demo_talebi` event key events, the same conversion is counted twice. Pick one.
- **Not filtering internal traffic:** Employees filling out forms for testing purposes skew your data. Define your office IP addresses as internal traffic and filter them out via **Admin > Data streams > Configure tag settings**.
- **Skipping cross-domain tracking:** If your form is hosted on a different domain (for example, a separate booking site), source information is lost unless cross-domain tracking is set up.
- **Not testing the setup:** Test every event with **Admin > DebugView** before going live. Fill out a form yourself and verify that the event comes through with the correct parameters.

As your team grows, UTM templates, event naming standards and automated reporting workflows become essential for keeping these rules sustainable. [Corner Group's experience in strategy and automation](https://cornergroup.co), our parent group, can be a starting point for companies looking to make these processes scalable.

## Frequently asked questions

### Why does social media traffic show up as "Direct" in GA4?

The in-app browsers of LinkedIn and Instagram don't always pass referrer information, which causes traffic to fall into the "Direct" channel. The solution is to add `utm_source` and `utm_medium` parameters to every link you share. That way, GA4 assigns the traffic to the correct channel without needing referrer information.

### Is there a difference between a key event and a conversion?

In GA4, "key event" is the new name for what was previously called a "conversion," and it works the same way. The term "conversion" is now used mainly on the Google Ads side to refer to key events imported for ad optimization. From a reporting perspective, what you need to know is that important actions should be marked as key events.

### Should I measure LinkedIn ad performance in GA4 or in Campaign Manager?

You should use both, because they measure different things. Campaign Manager shows impressions, clicks and on-platform form conversions, while GA4 shows what users who arrive on your site from an ad do there. Because of their different measurement methods, the numbers from the two sources will never match exactly; this is normal.

### How long does it take for data to settle after setup?

New events usually appear in DebugView and the Realtime report within a few minutes, but it can take 24–48 hours for them to show up in standard reports. To make meaningful comparisons in B2B, it's recommended to collect at least 4–6 weeks of data. Since key events don't work retroactively, complete the setup as early as possible.

## Conclusion

Tracking social media conversions in GA4 is less a one-time technical configuration and more a process that requires discipline. When consistent UTM usage, properly defined and tested key events, attribution settings suited to B2B's long sales cycle, and a CRM integration that covers on-platform forms come together, you can show social media's contribution to the sales funnel in hard numbers. That means you can talk data rather than guesswork in budget discussions.

If you want to see how much business your LinkedIn and Instagram campaigns are really generating, build your measurement infrastructure, or have your existing setup audited, [get in touch with the Social Media Corner team](/en/contact); let's work together to turn your B2B social media strategy into measurable results.
