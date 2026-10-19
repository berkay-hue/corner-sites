---
title: "Keep Outbound Emails Out of Spam: SPF, DKIM, DMARC"
description: "A step-by-step guide to setting up SPF, DKIM and DMARC and warming up your domains so your outbound emails land in the inbox, not the spam folder."
date: "2026-10-13"
category: "Lead Generation"
image: "https://images.pexels.com/photos/7653571/pexels-photo-7653571.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Keep Outbound Emails Out of Spam: SPF, DKIM, DMARC"
alt: "outbound-eposta-spam-spf-dkim-dmarc"
---

You spent weeks building target lists for your outbound campaign, personalizing messages and setting up sequences. Sending has started, but no replies are coming in. Open rates are far below expectations, and a few recipients write back saying "your email landed in my spam folder." Most of the time, the problem isn't the message or the offer. The problem is that the email never reaches the recipient's inbox at all. This layer, which often gets overlooked when reviewing campaign results, is called **deliverability**, meaning whether your email actually gets delivered. And at its foundation are three technical standards: **SPF, DKIM and DMARC**.

In this post, we'll walk step by step through what these three protocols do, how a B2B SaaS company doing outbound sales should set them up, and which mistakes quietly damage your reputation after setup. Our goal is to give you a roadmap you can hand to your technical team with clear instructions, and whose logic your sales team can also understand.

## Why Is Authentication No Longer a "Nice to Have" but a Must?

Until a few years ago, you could send email from a domain without SPF and DKIM records and still get a reasonable delivery rate. Today, things are different. At the start of 2024, Google and Yahoo introduced new rules for bulk senders. Under these rules, domains sending above a certain volume are expected to authenticate with SPF and DKIM, publish a DMARC policy, offer one-click unsubscribe in marketing emails, and keep their spam complaint rate low. Microsoft has announced similar requirements for Outlook.

Even if the "bulk sender" threshold doesn't apply to you today, receiving servers are growing increasingly suspicious of unauthenticated email. By its nature, outbound email comes from an address the recipient has never interacted with before. That means you have no signal to rely on other than your sender reputation. If authentication is missing, then in the eyes of the receiving server, you're "someone of unknown identity."

There's also a security side to this. A domain without DMARC configured is open to fraudsters sending fake emails in your name. A prospect receiving a phishing email from your domain can destroy, in a single stroke, the trust you've been working to build throughout the sales process. We covered this topic from a broader perspective in our post on [building ethical and transparent trust in B2B SaaS sales](https://saascorner.co/blog/b2b-saas-satista-guven-i-nsasi-etik-ve-seffaf-stratejiler). Technical authentication is the infrastructure pillar of that trust.

## What Happens Before an Email Reaches the Inbox?

The easiest way to understand the three protocols is to think from the receiving server's point of view. When your sales rep emails a prospect, the recipient's mail server (for example, Gmail or Microsoft 365) roughly asks the following questions:

1. **Is the server sending this email authorized to send on behalf of this domain?** (SPF)
2. **Has the email been altered in transit, and was it really signed by the owner of this domain?** (DKIM)
3. **If these checks fail, what does the domain owner want done, and do the checks align with the visible sender address?** (DMARC)

After these questions, other signals come into play, such as reputation, content and engagement history. But if you can't give a satisfactory answer to the first three questions, it matters very little how good those other signals are.

## SPF: "Who Can Send Email on My Behalf?"

**SPF (Sender Policy Framework)** is a TXT record you add to your domain's DNS records. This record contains the list of servers authorized to send email on behalf of your domain. The receiving server looks at the IP address the incoming email came from and checks whether that IP is authorized in your SPF record.

### A Sample SPF Record

For a company using Google Workspace, a basic SPF record looks like this:

```
v=spf1 include:_spf.google.com ~all
```

If you're using Microsoft 365:

```
v=spf1 include:spf.protection.outlook.com ~all
```

What each part of the record means:

- **v=spf1**: Indicates that the record is an SPF record.
- **include:**: Adds the specified service's authorized servers to the list.
- **~all**: Asks that emails from servers not on the list be treated as "suspicious" (softfail). **-all**, on the other hand, means outright rejection (hardfail).

If your CRM, marketing automation tool or a sequencing tool sends email through your domain, you also need to add their include statement:

```
v=spf1 include:_spf.google.com include:servicename.com ~all
```

### The Most Common SPF Mistakes

**Creating more than one SPF record.** A domain can have only one SPF record. Creating a separate "v=spf1" record when adding a new tool causes both records to be treated as invalid. The right approach is to add the new include statement inside the existing record.

**Exceeding the 10 DNS lookup limit.** The SPF standard allows a maximum of 10 DNS lookups when evaluating a record. Each include statement can trigger further lookups of its own. Tools accumulated over the years (an old newsletter service, a support platform you no longer use) can easily push you past this limit, causing SPF to return a "permerror." Clean up your record regularly and remove services you no longer use.

**Using +all.** This statement means "anyone can send on my behalf" and defeats the entire purpose of SPF. Never use it.

### The Limits of SPF

SPF alone isn't enough. That's because SPF doesn't check the visible "From" address of the email; it checks the technical envelope address (Return-Path). In other words, someone could use a different Return-Path and put your domain in the visible address. DKIM and, above all, DMARC close this gap.

## DKIM: Adding a Digital Signature to Your Emails

**DKIM (DomainKeys Identified Mail)** adds a cryptographic signature to every email you send. This signature is created with a private key and placed in the email's headers. The receiving server verifies the signature using the public key you publish in your DNS. If the signature is valid, two things are proven: the email was genuinely sent from a system under this domain's control, and its content wasn't altered in transit.

### How Do You Set Up DKIM?

The process usually consists of the following steps:

1. You generate a DKIM key from your email provider's admin panel. In Google Workspace, this is found in the Gmail authentication settings in the Admin Console.
2. The system gives you a **selector** name and a public key value.
3. You add this value to your DNS as a TXT record (CNAME with some providers). For Google, for example, the record name is usually `google._domainkey.yourdomain.com`.
4. Once DNS propagation is complete, you enable the "Start authentication" option in the panel.

In Microsoft 365, you typically create two CNAME records named `selector1._domainkey` and `selector2._domainkey`, then turn on DKIM signing from the Defender portal.

### Practical DKIM Tips

- **Use 2048-bit keys.** Although 1024-bit keys are still accepted, the stronger key should be preferred. Some DNS providers may ask you to split long TXT records when entering them; this is normal.
- **Configure a separate DKIM signature for each sending tool.** If your sequencing tool or CRM sends email on behalf of your domain, that tool also needs to sign for your domain with its own selector. Otherwise, the tool signs with its own domain and DMARC alignment breaks.
- **Rotate your keys periodically.** Rotating keys once or twice a year is good security practice.

## DMARC: The Layer That Sets the Rules and Reports Back

**DMARC (Domain-based Message Authentication, Reporting and Conformance)** is the policy that brings SPF and DKIM together and gives them meaning. DMARC does three things:

1. **Alignment check:** It checks whether the domain verified in SPF or DKIM matches the domain in the email's visible "From" address. This is what ensures the address the recipient sees has actually been verified.
2. **Policy:** It tells the receiving server what you want it to do if the checks fail.
3. **Reporting:** It ensures aggregate reports about emails sent on behalf of your domain are delivered to you.

### A Sample DMARC Record

The DMARC record is published as a TXT record at `_dmarc.yourdomain.com`:

```
v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com; adkim=r; aspf=r
```

- **p=none**: Monitor only; don't take action on any email.
- **p=quarantine**: Send failing emails to the spam folder.
- **p=reject**: Reject failing emails entirely.
- **rua**: The address aggregate reports are sent to.
- **adkim / aspf**: The DKIM and SPF alignment mode. "r" (relaxed) allows subdomains to match the main domain, while "s" (strict) requires an exact match.
- **pct**: Specifies the percentage of emails the policy applies to; useful for a gradual rollout.

### Tightening DMARC Gradually

Launching DMARC straight away with p=reject can cause your legitimate emails to be rejected as well. That's because most companies don't know every system sending email on behalf of their domain: the accounting software sends invoices, the HR tool sends notifications, an old web form sends auto-replies. The right approach is as follows:

1. **First 2-4 weeks: p=none.** Collect reports and see which sources are sending email on behalf of your domain.
2. **Fix unknown but legitimate sources.** Add an SPF include and a DKIM signature for each one.
3. **Start with p=quarantine; pct=25** and gradually increase the percentage.
4. **Move to p=reject once the reports are clean.**

DMARC reports arrive in XML format and are hard to read in their raw form. There are many free and paid DMARC analysis tools that turn these reports into easy-to-understand charts. Having the person responsible for sales operations review these reports at least once a month is enough to catch problems early.

## Domain Architecture for Outbound: Protect Your Main Domain

Setting up SPF, DKIM and DMARC correctly doesn't mean you should put your main domain's reputation at risk. Even when done with the utmost care, outbound email is a channel where some recipients may hit the "spam" button. These complaints count directly against the sending domain's reputation. If you run outbound from your main domain, the invoices, support replies and product notifications you send to your customers are affected by the same reputation pool.

That's why the common and healthy approach at B2B SaaS companies is to use **secondary domains** for outbound. For example, if your main domain is `exampleapp.com`, you might choose domains like these for outbound:

- `exampleapp.co`
- `exampleapphq.com`
- `tryexampleapp.com`

Points to keep in mind when setting up this structure:

- **Set up SPF, DKIM and DMARC separately for each secondary domain.** The settings on your main domain don't automatically carry over to secondary domains.
- **Redirect the secondary domain to your main website.** When a curious recipient types the domain into their browser, they should see your real website rather than a blank page.
- **Open a limited number of mailboxes on each domain.** Working with two or three mailboxes per domain is a common practice for spreading risk.
- **Don't use new domains right away.** A newly purchased domain needs a few weeks to "mature" and go through a warm-up process.
- **Use a custom tracking domain.** If you track opens and clicks, use your own subdomain (e.g., `link.exampleapp.co`) instead of the tool's shared tracking domain. Shared domains can be affected by other users' bad behavior.

## Step-by-Step Setup Plan: The First 30 Days

Let's turn the theory into an actionable plan. For a SaaS company building a new outbound infrastructure, a sample timeline could look like this:

### Week 1: Infrastructure

1. Purchase 2-3 secondary domains for outbound.
2. Connect a Google Workspace or Microsoft 365 account to each domain; open 2-3 mailboxes on each domain. Give the mailboxes real people's names (e.g., jane@, john@) and avoid generic addresses like "info@" or "sales@".
3. Create the SPF record.
4. Generate the DKIM key, add it to DNS and enable signing.
5. Publish the DMARC record with p=none and define the rua address.
6. Redirect the domains to your main website.

### Week 2: Verification and Start of Warm-Up

1. Send emails from each mailbox to your own Gmail and Outlook test accounts. When you open the email in Gmail and click "Show original," you should see **PASS** on the SPF, DKIM and DMARC lines.
2. You can also check your DNS records from the command line: the `dig TXT yourdomain.com` and `dig TXT _dmarc.yourdomain.com` commands show whether the records have been published correctly.
3. Add your domains to Google Postmaster Tools. This tool shows reputation and spam rate data for the emails you send to Gmail.
4. Start the warm-up process. Begin with a few emails a day from each mailbox and slowly increase the volume over several weeks. Warm-up tools can automate this process, but genuine conversations with real people are at least as valuable.

### Weeks 3-4: Controlled Sending

1. Start the real campaign at low volume. Keeping daily sends per mailbox low is a widely accepted safety margin among outbound teams; if you need to increase volume, spread it across more mailboxes.
2. Monitor bounced emails daily.
3. Review DMARC reports; if there's an unexpected sending source, investigate it.
4. If there are no issues, plan to move your DMARC policy toward quarantine.

## Authentication Is Necessary but Not Sufficient

SPF, DKIM and DMARC are the way to say "this email really is from us." But receiving servers look not only at whether the email truly comes from you, but also at **whether it's wanted**. A domain with flawless authentication will still land in the spam folder when it sends careless messages to a bad list. Other factors that determine deliverability:

### List Quality and Verified Addresses

Sending to invalid addresses leads to a high bounce rate and signals to receiving servers that "this sender doesn't build its list carefully." Verifying email addresses before sending, approaching catch-all addresses with caution and narrowing your audience according to your ideal customer profile are essential. For B2B contact data and verified email addresses, prospecting platforms like [Apollo.io](https://get.apollo.io/679irkzm35ya) help your list start out clean with their filtering and verification features. Still, no data source is 100% accurate; adding a second verification layer before sending is a good habit.

### Content and Personalization

- Keep links, images and attachments to a minimum in the first email. If possible, include no links at all in the first touch.
- Don't send the exact same template to hundreds of people; personalize genuinely based on company, role and context. Sending identical content at high volume creates a pattern for filters.
- Write short emails that are close to plain text. Heavy HTML templates aren't suitable for outbound.
- Exaggerated promises, all-caps subject lines and aggressive sales language bother both filters and recipients.

### Engagement and Complaint Rate

Receiving servers look at whether your emails are replied to, deleted or marked as spam. Campaigns with high reply rates strengthen your reputation over time. That's why offering an exit at the end of the email, where an uninterested recipient can easily say "not interested," is far better than having them hit the spam button. Track your spam complaint rate in Google Postmaster Tools; this rate needs to stay at very low levels.

We covered the full picture of outbound, meaning targeting, messaging and the meeting-booking process, in detail in our post on [outbound sales and booking qualified meetings for B2B companies](/blog/what-is-outbound-sales-b2b-qualified-meetings). Deliverability is the invisible foundation that holds up that entire picture.

## Common Mistakes and a Quick Checklist

The deliverability problems we encounter most often in the field usually aren't complex; they stem from small, overlooked details:

- **A new tool was added, but SPF wasn't updated.** The marketing team bought a new newsletter tool, and no one touched the DNS. Result: every email sent from that tool fails SPF.
- **There are two separate SPF records.** One left over from the old IT vendor, one newly added. Both are invalid.
- **The DKIM key was added to DNS, but signing wasn't turned on.** The record exists, but emails aren't being signed.
- **The sequencing tool signs with its own domain.** Even though DKIM shows "pass," DMARC alignment isn't achieved.
- **DMARC was left at p=none for years, and the reports were never read.** There's a policy, but no protection.
- **High volume was sent from a new domain on day one.** Warm-up was skipped, and the domain lost its reputation within a few days.
- **The main domain was used for outbound.** Complaints started affecting customer communications as well.

Before every campaign, quickly check the following questions:

1. Does every sending domain have a single, valid SPF record?
2. Is DKIM signing active, and is the signature aligned with the visible sender domain?
3. Has a DMARC record been published, and are the reports reviewed regularly?
4. Are the SPF, DKIM and DMARC results PASS in test emails?
5. Has the list been verified, and is the bounce risk low?
6. Is the daily volume per mailbox reasonable?
7. Is a custom tracking domain being used?

Rather than doing these checks manually, making them part of your operations is far more sustainable in the long run. We discussed how you can automate repetitive steps, from list cleaning to send monitoring, in our post on [automating your lead generation operation](https://saascorner.co/blog/b2bde-uykusuz-gecelerin-ciktisi-lead-generation-operasyonunu-otomatige-baglamak).

## Who Owns This? The Gap Between Sales and Technical Teams

The biggest reason deliverability problems become chronic is that nobody owns the issue. The sales team says "this is a technical matter," and the IT team says "email is working, no problem." But email may well be working while landing in the spam folder instead of the inbox.

To close this gap, here's what we recommend:

- **Appoint a deliverability owner within sales operations (Sales Ops or RevOps).** Even if this person doesn't have DNS access, they need to know which tools send email on behalf of the domain and relay change requests to IT.
- **Create a checklist before purchasing any new sending tool.** Make the question "Will this tool send email on our behalf? What are its SPF and DKIM requirements?" part of the procurement process.
- **Add deliverability metrics to your sales reports.** Bounce rate, spam complaint rate and domain reputation should sit on the same dashboard as open and reply rates.

If you don't have the time or expertise to build this infrastructure in-house, working with teams that manage end-to-end, data-driven outbound processes, such as [Sales Corner's B2B sales and lead generation services](https://salescorner.co), can lighten the load of both setup and ongoing monitoring.

## Conclusion

Success in outbound email starts with a good list and a good message; but if the email doesn't reach the inbox, neither is worth anything. **SPF** defines who can send on behalf of your domain. **DKIM** adds a verifiable signature to every email. **DMARC** aligns these two checks with the visible sender address, sets a policy and reports back on what's happening. Today, this trio is the minimum standard expected by major email providers.

But authentication is only the beginning. Protecting your main domain with secondary domains, patiently warming up new mailboxes, verifying your list, keeping volume under control and focusing on earning replies through genuine personalization are the other pillars of long-term deliverability. When you turn these into a regularly monitored operation rather than setting them up once and forgetting about them, the results of your outbound campaigns become far more predictable as well.

If you want to build your outbound infrastructure from scratch, diagnose deliverability issues in your current campaigns or create a lead generation operation that generates qualified meetings, the SAAS Corner team would be happy to help. Reach out to us through our [contact page](/en/contact) and let's assess your needs together.

## FAQ

### What is the difference between SPF, DKIM, and DMARC?

SPF defines which servers can send email on behalf of your domain, DKIM adds a verifiable cryptographic signature to every email, and DMARC aligns these two checks with the visible sender address. DMARC also tells receiving servers what to do when the checks fail and sends you aggregate reports. Today, this trio is the minimum standard expected by major email providers.

### Can a domain have more than one SPF record?

No, a domain can have only one SPF record. Creating a separate SPF record when adding a new tool causes both records to be treated as invalid. The right approach is to add the new include statement inside the existing record and stay within the 10 DNS lookup limit.

### Should you start DMARC with a p=reject policy?

No, launching DMARC straight away with p=reject can cause your legitimate emails to be rejected as well. Start with p=none for the first 2-4 weeks to collect reports, fix unknown but legitimate sending sources, then move to p=quarantine with pct=25 and gradually increase the percentage. Move to p=reject once the reports are clean.

### Should you send outbound email from your main domain?

No, the common and healthy approach at B2B SaaS companies is to use secondary domains for outbound. Spam complaints count directly against the sending domain's reputation, so outbound from your main domain puts your invoices, support replies, and product notifications in the same reputation pool. Set up SPF, DKIM, and DMARC separately for each secondary domain and warm up new domains before using them.
