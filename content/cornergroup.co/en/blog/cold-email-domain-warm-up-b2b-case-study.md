---
title: "Cold Email Domain Warm-Up: A B2B Case Study"
description: "Why do cold emails from a new domain land in spam? We walk through the fix step by step: DNS setup, a warm-up schedule and sending limits."
date: "2026-10-12"
category: "Case Study"
image: "https://images.pexels.com/photos/7888684/pexels-photo-7888684.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Cold Email Domain Warm-Up: A B2B Case Study"
alt: "soguk-eposta-alan-adi-isitma-vaka-calismasi"
---

The most common mistake in cold email campaigns happens before anyone writes a message, builds a list or even defines a target audience: sending hundreds of emails from a brand-new domain on day one. The result is predictable. Emails land in spam, open rates become meaningless, and within a few weeks the domain's reputation is damaged. At this point, most teams look for the problem in the copy or the subject line. The real problem is the infrastructure.

In this post, we walk through a domain warm-up project we ran for a B2B SaaS client whose outbound operations we manage at Corner Group. For confidentiality reasons, we are not sharing the client's name or sensitive performance data. We are, however, sharing the method we used, the warm-up schedule, the technical setup and the lessons we learned from our mistakes, exactly as they happened. Our goal is to give you a concrete roadmap you can follow when building your own outbound infrastructure.

## The Starting Point: Why Was Everything Going Wrong?

Our client was a Turkey-based B2B SaaS company selling operations software to mid-sized businesses. When they came to us, their outbound program had been running for about two months but was not delivering the expected results. The team described the situation as follows:

- Cold emails were being sent directly from the company's primary domain, the same domain used for invoices, support correspondence and customer communication.
- Each sales rep was sending between 100 and 150 emails a day from their own mailbox.
- The list was an unverified Excel file compiled from multiple sources.
- A significant share of sends were bouncing.
- In recent weeks, the team had noticed that some invoice and support emails to existing customers were also landing in spam.

That last point showed how serious the situation was. Using your primary domain for cold email means putting your entire email reputation in one basket. Every complaint, every bounce and every spam flag from outbound campaigns also affects the company's operational communication.

## Diagnosis: Separating the Problem Layer by Layer

Before moving to a solution, we spent two weeks analyzing the current state. We broke the deliverability issues down into three layers.

### 1. Technical infrastructure layer

When we checked the domain's DNS records, we found the following gaps:

- **SPF** was in place, but it also included an old marketing tool that was no longer in use, generating unnecessary DNS lookups.
- **DKIM** was configured only for the email provider. The sending tool in use was not signing emails.
- There was no **DMARC** record at all.

The bulk sender requirements Gmail and Yahoo introduced in 2024 effectively made SPF, DKIM and DMARC configuration mandatory. These rules also require spam complaint rates to be kept very low. Missing this trio was, on its own, reason enough for receiving servers not to trust the sender.

### 2. Sending behavior layer

Newly created mailboxes running at high volume from day one looked, in the eyes of email providers, like spam bot behavior. Sending times were also irregular. Some reps were sending all of their emails in a single batch at 9:00 a.m.

### 3. Data and content layer

List quality was poor. Invalid addresses, generic addresses like info@ and sales@, and long-abandoned mailboxes were driving a high bounce rate. On the content side, the first email included two links, an image-based signature and a PDF attachment. Each of these was an additional risk signal for spam filters.

## Strategy: Protect the Primary Domain, Separate Outbound

Our decision was clear: **cold email traffic would be pulled entirely off the primary domain and moved to separate, controlled infrastructure.** The primary domain would be used only for customer communication, billing and inbound correspondence.

### Choosing secondary domains

We purchased three secondary domains that were close to the main brand name, trustworthy, and unlikely to be mistaken for typos. For example, if the primary domain were "brandname.com", we would choose variations like these:

- brandname.co
- brandnamehq.com
- getbrandname.com

What we paid attention to when choosing them:

- We avoided cheap, exotic extensions associated with spam and chose well-known extensions widely used for business.
- We set up each secondary domain with a permanent (301) redirect to the main website. That way, if a recipient typed the domain into their browser, they would land on the real company site, preserving the perception of legitimacy.
- We did not start using the domains the moment we bought them. Domain age is also one of the reputation signals. So we configured DNS right away but only began sending a few days later.

### Mailbox architecture

We created 2 to 3 mailboxes on each secondary domain and worked with a total of 8 sending mailboxes. Each mailbox carried the name of a real sales rep (e.g., first.last@brandname.co). We added a profile photo and a simple, text-based signature to each one.

The core logic here was: **spread volume across many mailboxes instead of concentrating it in one.** Keeping daily volume per mailbox low protects each mailbox's reputation while preserving total reach.

## Technical Setup: Step-by-Step DNS Configuration

We completed the following setup for each secondary domain:

1. **SPF record:** We created a clean record covering only the email provider and sending tool actually in use. We removed unnecessary include statements to stay within SPF's DNS lookup limit.
2. **DKIM:** We defined separate DKIM keys for both the email provider and the outbound sending tool. We used 2048-bit keys wherever possible.
3. **DMARC:** We started with a "p=none" policy and a defined reporting address. After confirming that the reports showed no unauthorized sending, we moved to a "quarantine" policy within a few weeks.
4. **Custom tracking domain:** For open and click tracking, we set up our own subdomain instead of the sending tool's shared tracking domain. Shared tracking domains can be affected by the poor reputation of other senders using the same tool.
5. **MX records:** We made sure every secondary domain could receive email. A domain that cannot receive replies does not inspire trust in recipients, and it also breaks the natural engagement loop of the warm-up process.

Once setup was complete, we tested each domain with free DNS and blacklist checking tools. We only started warm-up after all records had been verified.

## The Warm-Up Schedule: A 4-Week Gradual Plan

The essence of warm-up is to send receiving servers a signal, over time, that says: "This sender behaves like a real person; their emails get opened, get replies and are not marked as spam." To do this, we used two parallel mechanisms:

- **Automated warm-up network:** The mailboxes exchange emails with other mailboxes in the warm-up tool's network. These emails are opened, replied to and, if they land in spam, marked as "not spam."
- **Manual, real conversations:** We started real email conversations on genuine topics with team members, business partners and people we knew. Real engagement is a much stronger signal than the automated network.

The schedule we followed per mailbox was:

**Week 1 (Warm-up only):**
- 5 to 10 warm-up emails per day
- No cold emails
- Goal: Prove the mailbox is "alive"

**Week 2 (Gradual ramp-up):**
- 15 to 25 warm-up emails per day
- Still no cold sending
- Warm-up settings configured to keep the reply rate high

**Week 3 (First cold sends):**
- 20 to 30 warm-up emails per day continued
- 10 to 15 cold emails per day, sent to a small segment with the best fit score
- Sends were spread across business hours with random time gaps between them

**Week 4 and beyond (Steady-state operation):**
- Warm-up was never stopped and continued at 15 to 20 per day
- Cold sending was increased to 30 to 40 per mailbox per day
- Across 8 mailboxes, total daily capacity was roughly 240 to 320 cold emails

The most critical decision in this schedule was that **warm-up was never switched off.** Many teams treat warm-up as a few-week "preparation period" and stop it once campaigns begin. In reality, warm-up acts as a continuous buffer that stabilizes reputation throughout the campaign.

## Data Quality: The Invisible Half of Warm-Up

Even the best-warmed domain can lose its reputation within days because of a bad list. That's why we rebuilt the list from scratch in parallel with the warm-up process.

### The new list-building process

1. **The Ideal Customer Profile (ICP) was clarified:** Industry, employee count range, technologies in use and decision-maker titles were defined.
2. **Data source:** We pulled target companies and decision-makers by filtering in [Apollo.io](https://get.apollo.io/679irkzm35ya). Using title, company size and industry filters, we eliminated records that didn't fit the ICP from the start.
3. **Email verification:** We ran all addresses through a separate verification process. Addresses flagged as "invalid" or "risky" were removed from the list. Addresses on "catch-all" domains were tested in a separate segment at very low volume.
4. **Removing generic addresses:** We removed role-based addresses such as info@, contact@ and sales@. These addresses generate few replies and increase complaint risk.
5. **Legal compliance check:** When working with business contact data, we stayed within the boundaries set by KVKK (Turkey's personal data protection law) and commercial electronic messaging regulations. We cover this topic in detail in our guide on [KVKK-compliant cold outbound and the legal boundaries in Turkey](/blog/kvkk-compliant-cold-outbound-turkey).

As a result of these steps, the list shrank noticeably, but the value of each record increased. The principle we kept reminding the team of was: **every invalid address you don't send to is a reputation point saved.**

## Content Strategy: Writing for Spam Filters and Humans at the Same Time

During the warm-up period and the first cold sends, we deliberately kept content simple.

### Rules for the first email

- **No links:** We used no links at all in the first-touch email. The website link was shared only with interested prospects in later steps.
- **No images or attachments:** The HTML signature, logo and PDF attachment were removed entirely. We switched to plain text.
- **Short body:** We kept the core message between 60 and 90 words.
- **One question, one action:** Instead of a calendar link, we asked a low-friction question such as "Is this a priority for you?"
- **Personalization:** The first sentence of every email was based on an observation specific to the recipient's company or role.

### Scaling personalization

With 8 mailboxes and hundreds of emails a day, writing every sentence by hand isn't feasible. So we built an AI-assisted personalization workflow. The workflow extracted short summaries from company websites and publicly available information, then generated opening-line drafts from those summaries. Sales reps reviewed these drafts before sending. We described the impact of a similar AI-assisted setup on sales productivity in more detail in our [case study on AI-driven outbound sales productivity in B2B SaaS](https://cornergroup.co/blog/b2b-saas-ta-ai-ile-outbound-satis-verimliligi-basarili-bir-vaka-calismasi).

We also applied spintax (randomly using different variations of the same sentence) to a limited extent. The goal was to prevent hundreds of emails from going out with identical text. Repeating the same content at high volume is a strong bulk-sending signal for filters.

### Testing discipline

We ran controlled A/B tests on subject lines and opening lines. However, we deliberately kept test volume low during the warm-up period. Enough data for statistical significance only accumulated in the steady-state phase. We built the test design on the framework we shared in our [guide to increasing conversion rates with A/B testing in B2B cold email](https://cornergroup.co/blog/b2b-soguk-e-postada-a-b-testi-ile-donusum-oranlarini-artirma-rehberi).

## Monitoring and Early Warning: Automated Deliverability Tracking with n8n

Warm-up can't be managed with a "set it and forget it" approach. A mailbox's reputation can deteriorate within a few days, and this usually shows up first in small signals. That's why we built a simple but effective monitoring workflow in n8n.

What the workflow did:

1. **Daily metric collection:** It pulled each mailbox's daily send, bounce, reply and unsubscribe data via the sending tool's API.
2. **Threshold checks:** It triggered an alert when a mailbox's bounce rate exceeded the threshold we had set, or when negative feedback started piling up in replies.
3. **Automated intervention recommendation:** For any mailbox over the threshold, it posted a recommendation to the team's Slack channel: "Pause cold sending for 48 hours, keep warm-up running."
4. **Weekly summary report:** Every Monday, it generated a per-mailbox health table and sent it to the sales manager.
5. **CRM sync:** It automatically pushed positive responders into the CRM and assigned them to the right rep.

Thanks to this automation, issues were caught before they caused lasting reputation damage. For example, in week four one mailbox showed a sudden spike in its bounce rate. When we investigated, we found that the segment assigned to it that day contained old, unverified records. Sending was paused, the segment was cleaned, and the mailbox returned to normal within a few days. If you're curious how we use n8n across other outbound channels, our [case study on automated LinkedIn outbound with n8n](https://cornergroup.co/blog/n8n-ile-otomatik-linkedin-outbound-100-yeni-lead-ve-15-toplanti-vaka-analizi) makes a good companion read.

## Results: What Changed Once the Infrastructure Was Fixed?

For confidentiality reasons, we are not sharing exact figures. However, we can summarize the changes we observed by the end of the process as follows:

- **The primary domain was protected:** Once cold sending was moved off the primary domain, the issue of invoice and support emails to customers landing in spam disappeared. For the client, this was perhaps the most valuable outcome.
- **The bounce rate dropped significantly:** Thanks to a verified, ICP-filtered list, bounces fell below acceptable levels.
- **Inbox placement improved:** In the placement tests (seed tests) we ran regularly, we saw that the vast majority of emails landed in the primary inbox.
- **Reply quality went up:** Even though per-mailbox volume was lower than at the start, the total number of positive replies increased. More importantly, replies were coming from actual decision-makers.
- **The sales team got its time back:** Instead of chasing emails stuck in spam and cleaning lists by hand, reps could focus on conversations with positive responders.

The point we want to emphasize here is this: **domain warm-up alone does not generate meetings.** Warm-up is the infrastructure that ensures a good message and the right list reach their destination. Without infrastructure, even the best message stays invisible. But infrastructure alone can't save a weak offer.

## The Mistakes We Made and the Lessons We Learned

No case study is purely a success story. There were points in this process where we stumbled too.

### Lesson 1: Impatience is the most expensive mistake

At the end of week two, the client pushed us to "start sending already." We moved one mailbox's schedule forward by a week. That mailbox experienced noticeably more spam placement than the others, and it took extra time to stabilize it again. In the end, the shortcut turned out to be the long way around.

### Lesson 2: Catch-all addresses need to be managed separately

In our first attempt, when we sent to catch-all addresses together with the main segment, the bounce rate came out higher than expected. We moved these addresses into a separate segment and sent to them only from the most mature mailboxes, at low volume.

### Lesson 3: Follow-up emails count toward volume too

Initially, we had calculated the daily limit per mailbox based only on first-touch emails. But in a 3- to 4-step sequence, as follow-ups accumulated, the actual daily volume ended up higher than planned. We reworked the limits to cover every step.

### Lesson 4: Reply management is a reputation issue

Responding late to a recipient who says "take me off your list," or emailing them again, carries both legal and reputational risk. We connected unsubscribe requests to the n8n workflow so those contacts were automatically excluded across all mailboxes and future campaigns.

### Lesson 5: Scaling means adding new domains

When we needed more volume, we added new domains and mailboxes rather than raising the limits on existing mailboxes. The new mailboxes went through the same 4-week schedule. That's why capacity planning needs to happen at least a month in advance.

## A Checklist for Your Own Team

If you want to launch a similar process at your company, you can follow these steps in order:

1. Separate cold email completely from your primary domain.
2. Buy 2 to 3 secondary domains that are close to your brand and use trusted extensions, and redirect them to your main site.
3. Fully configure SPF, DKIM and DMARC records for each domain. Set up a custom tracking domain.
4. Create 2 to 3 mailboxes with real names per domain. Add a profile photo and a simple signature.
5. Do warm-up only for the first two weeks, with no cold sending.
6. In week three, start with a small, best-fit segment at 10 to 15 sends per mailbox per day.
7. Keep total daily volume per mailbox (including follow-ups) at a reasonable level, and never switch off warm-up.
8. Filter your list by ICP, verify every address and remove role-based addresses.
9. Don't use links, attachments or images in the first email. Write short and personal.
10. Set up an early warning system that automatically monitors bounce, complaint and reply metrics.
11. Apply unsubscribe requests immediately, across all mailboxes.
12. Plan scaling with new domains, at least a month in advance.

If you'd rather have a fully managed, end-to-end outbound process than build this infrastructure in-house, our group's [SAAS Corner team, which provides outbound sales and lead generation services for B2B SaaS companies](https://saascorner.co), can take on the entire process, from domain setup to list building and campaign management.

## Conclusion

Cold email domain warm-up is one of the least discussed yet most decisive stages of outbound sales. As this case study shows, the problem is usually not the message but the infrastructure: sending from the wrong domain, missing DNS records, ramping up volume too quickly and unverified lists. Protecting the primary domain, patiently warming up secondary domains, rigorously managing data quality and backing the process with automated monitoring form the foundation of a durable, predictable outbound engine.

Warm-up is not a one-and-done task; it's a discipline maintained throughout the campaign. Teams that build this discipline can be confident their emails reach the inbox and focus on the real work: putting the right offer in front of the right people.

If you want to build your outbound infrastructure from scratch, fix your current deliverability issues or scale your email campaigns with AI and n8n automations, [get in touch with the Corner Group team](/en/contact). Let's review your current situation together and map out a roadmap tailored to you.
