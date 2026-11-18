---
title: "Email Domain Warm-Up Guide for Outbound"
description: "Learn how to warm up a new sales domain so cold emails avoid spam: technical setup, a 5-week plan, daily sending limits and a deliverability checklist."
date: "2026-11-19"
category: "Outbound"
image: "https://images.pexels.com/photos/12969403/pexels-photo-12969403.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Email Domain Warm-Up Guide for Outbound"
alt: "outbound-e-posta-domain-isinma-warm-up-rehberi"
---

A new email domain usually takes **3 to 6 weeks** to become ready for outbound sending. During this period, sending volume starts at 5-10 emails per day and increases gradually. You should only move up to 30-50 cold emails per inbox per day once your SPF, DKIM and DMARC records are set up correctly and your reputation signals have stabilized. In short, domain warm-up means proving to email providers, over time and through consistent behavior, that you are a real, trustworthy sender.

Teams that skip this step tend to end up in the same situation. They buy a new domain, set up inboxes and send hundreds of emails in the first week. By week two, open rates collapse and replies dry up. The team blames the messaging or the target audience, but the real problem is that the emails never reached the inbox. In this guide, we cover practical steps outbound teams can apply, from technical setup and a weekly warm-up plan to the metrics you should track and how to recover from reputation damage.

## What is domain warm-up and why does it matter so much?

Gmail, Outlook and corporate email filters keep a **reputation score** for every sending domain and IP address. A newly purchased domain has no history. When a sender with no history suddenly starts sending high volumes of email, filters read it as spam-like behavior. As a result, emails land in the spam folder, get routed to the "Promotions" tab or are never delivered at all.

Domain warm-up is the process of building that trust step by step. The main signals providers monitor are:

- **Sending volume and consistency:** Sudden day-to-day spikes raise suspicion.
- **Engagement:** Positive signals such as opens, replies, moving an email out of the spam folder and adding the sender to contacts.
- **Negative signals:** Bounces, spam complaints and emails deleted without being opened.
- **Authentication:** Whether SPF, DKIM and DMARC records are configured correctly.

The reason this is especially critical for outbound is simple. In cold email, the recipient doesn't know you, so natural engagement is already low. Marketing newsletters benefit from subscribers' prior consent and reading habits. With cold email, you earn your reputation almost entirely through sending discipline.

## Should you send cold emails from your main domain?

Short answer: **No.** Your company's main domain (e.g., firmaadi.com) carries your invoices, customer correspondence, support emails and communication with partners. If you make a mistake in an outbound campaign and damage this domain's reputation, it's not just your sales emails that suffer but all of your company's communication. A customer finding your invoice in their spam folder costs far more than a lost cold lead.

That's why using **secondary domains** for outbound is established practice in the industry. For example, if your main domain is firmaadi.com, you might consider variations like these:

- firmaadi.co
- firmaadihq.com
- getfirmaadi.com
- firmaadi-tr.com

Things to keep in mind when choosing a secondary domain:

1. **It should clearly connect to your brand.** Recipients should recognize your company when they look at the domain. An unrelated name erodes trust.
2. **Limit hyphens and numbers.** Domains with multiple hyphens are more likely to be flagged by spam filters.
3. **Redirect it to your main site.** Anyone visiting the secondary domain should be redirected straight to firmaadi.com. This builds trust and avoids the "empty domain" look.
4. **Buy an aged domain if you can.** However, a domain that was previously used for spam is a far worse starting point than a brand-new one. Check the domain's history and blacklist status before you buy.

## How do you set up the technical infrastructure before warming up?

Even the best warm-up plan won't work if your technical setup is incomplete. Complete the checklist below in full before you start sending.

### SPF record

SPF (Sender Policy Framework) defines which servers are allowed to send email on behalf of your domain. If you use Google Workspace, the TXT record to add to your DNS typically looks like this:

`v=spf1 include:_spf.google.com ~all`

Note: There should be **only one SPF record** per domain. If you use more than one tool (e.g., both Google and a sending platform), you need to combine them into a single record.

### DKIM signature

DKIM adds a cryptographic signature to every email you send and proves the email wasn't altered in transit. You need to generate a DKIM key in the Google Workspace or Microsoft 365 admin console, add it to your DNS and then enable signing. Adding the key but forgetting to activate it is a common mistake.

### DMARC policy

DMARC determines what happens to emails that fail SPF and DKIM checks. To start, a record in monitoring mode is enough:

`v=DMARC1; p=none; rua=mailto:dmarc@firmaadi.co`

Once warm-up is complete and the reports show no issues, you can move the policy to `p=quarantine`. The rules Google and Yahoo introduced for bulk senders have effectively made SPF, DKIM and DMARC mandatory. Doing outbound without all three is now a serious risk.

### Custom tracking domain

If you use open and click tracking, use your own subdomain (e.g., track.firmaadi.co) instead of your sending tool's shared tracking domain. Shared domains can be affected by other users' bad behavior.

### Other preparations

- **MX records** must be correct. A domain that can't receive replies looks suspicious.
- Set up a **real name, profile photo and signature** for each inbox.
- Don't start sending as soon as you create the inboxes. Let the accounts "live" for a few days first.

## How long does warm-up take?

For a new domain, a realistic timeframe is **3-6 weeks**. The factors that determine this are:

- **Domain age:** A domain that's a few months old warms up faster than one purchased yesterday.
- **Target volume:** If you're aiming for 20 emails per inbox per day, the process is shorter. If you're aiming for 50, it takes longer.
- **List quality:** If your first real sends after warm-up produce high bounce rates, your reputation drops quickly and the timeline gets longer.
- **Engagement signals:** Inboxes that receive replies gain trust faster.

A practical rule: On new domains, **send no cold emails at all for at least 2 weeks** and generate warm-up traffic only. Start real outbound sends at low volume from week 3 onward.

## A step-by-step 5-week warm-up plan

The plan below is designed for a new inbox created on Google Workspace or Microsoft 365. Figures are per inbox, per day.

| Week | Warm-up emails | Cold emails | Total |
|---|---|---|---|
| Week 1 | 5 → 15 | 0 | 5-15 |
| Week 2 | 15 → 25 | 0 | 15-25 |
| Week 3 | 25 → 30 | 5 → 10 | 30-40 |
| Week 4 | 30 | 10 → 20 | 40-50 |
| Week 5 and beyond | 20-30 (ongoing) | 20 → 30 | 40-60 |

### Week 1: Building baseline trust

- Start with 5 emails on day one and add 2-3 emails each day.
- Send some of your warm-up emails to your team's personal addresses, to partners or to people you know, and don't forget to **ask for a reply**.
- If you use an automated warm-up tool, activate it this week.
- Don't use links, images or attachments in your emails.

### Week 2: Volume and engagement

- Increase daily volume to 25.
- Reduce volume on weekends but don't drop it to zero. Behave like a real business user.
- Add your domain to Google Postmaster Tools and start monitoring the data.

### Week 3: A controlled start to cold sending

- Start with 5-10 real cold emails per day.
- Send your first emails to your **warmest segment with the most accurate data**. For example, decision-makers at companies that have already visited your website, or contacts who have engaged with you before.
- Track your bounce rate daily. If it goes above 2%, stop sending and clean your list.

### Week 4: Scaling

- Gradually increase cold sending to 20.
- Monitor reply rates and spam complaints by segment.
- Finalize your sequence flow. Follow-up emails also count toward your sending volume. Our [guide on how many steps an outbound email sequence should have](/blog/outbound-email-sequence-steps-timing) can help with volume planning.

### Week 5 and beyond: Sustainable capacity

- Hold steady at 30-50 total emails per inbox per day.
- **Don't turn off warm-up.** Keeping low-volume warm-up traffic running in the background helps protect your reputation.

## How many emails should you send per inbox per day?

For a warmed-up inbox, the safe zone is **30-50 cold emails** per day. Technically, you can send more. But in outbound, the goal isn't maximum sends, it's maximum inbox placement. When your volume needs grow, increase **the number of inboxes and domains**, not the volume per inbox.

A simple example calculation:

- Monthly goal: Reach 3,000 new contacts
- Sequence: 4 steps (1 initial email + 3 follow-ups)
- Total sends: About 12,000 emails (slightly fewer in practice, since people who reply exit the sequence)
- About 22 business days per month → about 545 emails per day
- 40 emails per inbox → about **14 inboxes**
- 2-3 inboxes per domain → about **5-7 domains**

This calculation also shows why warm-up needs to be planned in advance. You need to buy your domains 5-6 weeks before the campaign launches. For realistic activity targets per rep, take a look at [our article on how many calls and emails a sales rep should make per day](/blog/how-many-calls-emails-per-day-sales-rep).

## How much does it cost?

The cost of domain warm-up has three components. Exact pricing for each varies by provider and exchange rates.

1. **Domain fees:** Secondary domains are inexpensive on an annual basis. Even 5-7 domains are a small line item in your overall budget.
2. **Email inbox licenses:** Google Workspace and Microsoft 365 charge per user per month. 14 inboxes means 14 licenses. This is usually the main cost item.
3. **Warm-up and sending tools:** Many outbound platforms include warm-up in their packages. Standalone tools usually charge a monthly fee per inbox.

The real cost is the one you don't see: **time.** During the 5-week warm-up period, the team's contribution to pipeline remains limited. That's why it's smart to plan warm-up as part of your campaign calendar and to always keep 1-2 domains "warming up in reserve" so you can replace domains whose reputation has been burned.

## Do automated warm-up tools work?

Automated warm-up tools connect your inbox to a network of thousands of other inboxes. These inboxes send emails to each other, open them, reply to them and move them out of the spam folder. This sends positive engagement signals to providers.

**Benefits:**
- They provide engagement volume that's hard to generate manually.
- They automatically keep your sending cadence consistent.
- They give early warnings by reporting your spam placement rate.

**Limitations:**
- A warm-up tool can't make up for a bad list, weak content or excessive volume.
- Providers are increasingly focused on detecting the behavioral patterns of warm-up networks. That's why warm-up traffic shouldn't be your only source of trust.
- The quality of the inboxes in the network varies from tool to tool.

The healthiest approach is a **hybrid** one: Run an automated warm-up tool in the background while also building your reputation organically through real internal correspondence, email traffic with partners and real conversations that generate replies.

## Which metrics should you track during warm-up?

Warm-up isn't a "set it and forget it" process. Track the following metrics weekly, and daily during critical periods:

- **Inbox placement rate:** Your warm-up tool's report, or checks using seed inboxes across different providers. If your spam placement rate is rising, pull back volume immediately.
- **Bounce rate:** Aim to keep it below 2%. Anything above that is a serious red flag.
- **Spam complaint rate:** Google's stated threshold is 0.3%. In practice, though, aim to stay below 0.1%.
- **Reply rate:** Because of privacy features, open rate is no longer a reliable metric. Reply rate is a much clearer signal.
- **Google Postmaster Tools domain reputation:** It should stay at "High" or "Medium." If you see "Low" or "Bad," stop cold sending.
- **Blacklist status:** Periodically check whether your domain and sending IPs appear on common blacklists.

If your reply rate is low even though deliverability looks good, the problem most likely lies in your messaging or targeting. In that case, [our list of 7 mistakes that explain why your outbound reply rate is low](/blog/why-outbound-reply-rate-is-low) is a good place to check.

## How does list quality affect warm-up?

The most overlooked part of the warm-up process is the list. A domain you've carefully warmed up for five weeks can lose its reputation within days after a single bad send to unverified addresses.

Before your first cold sends after warm-up, do the following:

1. **Verify every address.** Use a verification tool to remove "invalid" addresses from your list. Test "catch-all" domains (domains that accept every email) in a separate segment at low volume.
2. **Use up-to-date data.** People changing companies is the biggest source of bounces. Platforms like [Apollo.io](https://get.apollo.io/679irkzm35ya), which provide verified contact data during prospecting, help reduce this risk at the list-building stage.
3. **Remove role addresses.** Addresses like info@, sales@ and support@ aren't suitable for cold outbound and increase the risk of complaints.
4. **Remove duplicates.** Emailing the same person from different inboxes is the fastest route to a spam complaint.

Our [guide to reducing your B2B email bounce rate](/blog/reduce-email-bounce-rate), which covers bounce management in depth, can serve as a checklist for the first weeks after warm-up.

Building the right target list for outbound at scale and maintaining the sending infrastructure each require dedicated expertise. B2B SaaS companies that want to hand off both can also work with the team at [SAAS Corner, which provides outbound sales and lead generation services for B2B SaaS](https://saascorner.co).

## What should content and sending behavior look like during warm-up?

Even if your technical infrastructure and volume are right, content and behavior mistakes can undermine deliverability.

**For content:**
- **Use plain text.** HTML templates, images and banners in cold email both increase spam risk and give the impression of a mass send.
- **Don't include links in the first email, or use one link at most.** Strictly avoid shortened links (bit.ly, etc.).
- **Don't use attachments.** Share your deck or brochure after the recipient shows interest.
- **Add variety with spintax or personalization.** Hundreds of identical emails form a pattern that filters easily catch.
- **Avoid spam trigger phrases.** Excessive capitalization, lots of exclamation marks and phrases like "free," "guaranteed" and "last chance" can cause problems.

**For sending behavior:**
- **Spread your emails throughout the day** instead of sending them all at once. For example, leave random gaps of a few minutes between each send.
- Schedule sending times around your target audience's business hours.
- Consider **turning off open tracking** during warm-up. The tracking pixel can have a slight negative impact on deliverability.
- Offer an easy **opt-out** in every email. A sentence like "If this isn't relevant to you, just let me know" is far better than someone hitting the spam button.

Don't forget the legal side either. Data processing and commercial communication rules apply when sending cold email in Türkiye. Before building your sending strategy, we recommend reviewing [the legal boundaries of KVKK-compliant B2B cold email](/blog/kvkk-compliant-b2b-cold-email).

## What should you do if your domain reputation drops?

Despite every precaution, a domain may start landing in spam. The symptoms are usually: replies suddenly stopping, spam placement rising in your warm-up tool and reputation dropping to "Low" in Postmaster Tools.

Steps to follow:

1. **Stop cold sending immediately.** Continuing to send makes the situation worse every day.
2. **Keep warm-up traffic going, but at low volume.** Continue generating positive signals with 10-20 warm-up emails per day.
3. **Find the root cause.** Did your bounce rate go up? Did a new segment generate complaints? Did you use a new link or template in your content?
4. **Check blacklists.** If you've been listed, submit a removal request once you've fixed the issue.
5. **Allow 2-4 weeks for recovery.** Then return to cold sending at low volume, starting with your cleanest segment.
6. **Retire the domain if necessary.** If the reputation doesn't recover, pull the domain from outbound and switch to the domain you've been warming up in reserve.

This is where a backup domain strategy proves its value. Teams that continuously warm up 1-2 domains in the background can keep going without interrupting their pipeline flow when a domain gets burned.

## The most common warm-up mistakes

- **Impatience:** Sending hundreds of emails in the first week. This is the most common and most costly mistake.
- **Running outbound from your main domain:** It puts all of your company's communication at risk.
- **Skipping DMARC:** The major providers' rules no longer forgive this.
- **Turning off warm-up once the campaign starts:** Reputation requires ongoing maintenance.
- **Starting with an unverified list:** It can undo five weeks of work in a few days.
- **Using the same template across all inboxes:** It creates a pattern that filters can detect.
- **Increasing volume per inbox instead of adding inboxes:** Scaling should be done by adding new inboxes and domains.

## Frequently asked questions

### Can I turn off warm-up once the domain warm-up process is complete?

It's recommended that you don't. Domain reputation isn't static; it's continuously updated based on your sending behavior. Keeping around 15-30 warm-up emails per day running in the background offsets the low engagement that comes from cold sends.

### Can I use a subdomain of my main domain instead of a new domain?

Subdomains (e.g., outreach.firmaadi.com) can develop a separate reputation. However, because providers can link them to the main domain, a problem can also spill over to your main domain. Using completely separate secondary domains for outbound is the safer approach.

### Which email provider should I choose for warm-up?

Google Workspace and Microsoft 365 are the most common choices for outbound, and both support healthy warm-up. Using a mix of the two, based on which infrastructure your target audience mostly uses, is also a good way to diversify deliverability.

### Do I need to warm up an older domain that hasn't been used in a long time?

Yes. A domain that hasn't sent email in a long time has no recent sending history, and providers treat it much like a new domain. Its age may shorten the process slightly, but you still shouldn't skip a gradual 2-3 week warm-up.

## Conclusion

Domain warm-up is the least visible but most decisive infrastructure work in outbound. When correctly configured SPF, DKIM and DMARC records, a secondary domain strategy, a gradual 4-6 week volume ramp-up, verified lists and continuously monitored metrics come together, your emails reach the inbox. Only then can the quality of your message turn into results. Teams that don't build this discipline lose even their best-written emails to the spam folder.

If you want to set up your domain infrastructure, automate the warm-up process and make your outbound workflows scalable, the Sales Corner team can help. To discuss your needs, reach out to us via our [Book a call](/en/iletisim) page.
