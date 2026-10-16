---
title: "Lead Assignment Automation with n8n: Setting Up Round-Robin"
description: "Learn how to distribute inbound leads to sales reps automatically and fairly with n8n round-robin, including models, setup steps, rules and common mistakes."
date: "2026-10-15"
category: "Automation"
image: "https://images.pexels.com/photos/7988674/pexels-photo-7988674.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
imageAlt: "Lead Assignment Automation with n8n: Setting Up Round-Robin"
alt: "n8n-ile-lead-atama-otomasyonu"
---

Every new lead that comes in from an inbound form, a LinkedIn campaign or an outbound sequence is an opportunity for your sales team. But who receives that opportunity, and how quickly, directly determines the outcome. Many B2B companies still assign leads manually. A sales manager looks at the CRM, says "This one goes to Ahmet, that one to Zeynep," and the whole process depends on that manager's calendar. If the manager is in a meeting, the lead sits unowned for hours. Some reps end up overloaded while others sit idle. Over time, the team also starts to feel that "the good leads always go to the same person."

Round-robin lead assignment is the simplest solution to these problems: incoming leads are distributed among reps in rotation, following a predefined order. n8n lets you build this logic independently of your CRM, form tool and communication channels. In this article, we'll build a round-robin lead assignment automation in n8n step by step. We'll cover every layer, from simple sequential distribution to weighted and capacity-based models, and from concurrency issues to multi-brand setups.

## Why Does Round-Robin Lead Assignment Matter?

At first glance, round-robin looks like an ordinary "take turns" rule. Its impact on sales operations, however, is broader than you might think.

- **Response speed:** Because the lead owner is known instantly, first contact isn't delayed. In B2B sales, the party that responds first often steers the conversation.
- **Fair workload:** Each rep receives a similar number of leads. Performance comparisons also become more meaningful.
- **Transparency:** The assignment rule is documented and automated. The answer to "Why did this lead go to them?" is right there in the logs.
- **Manager time:** Instead of making dozens of assignment decisions a day, the sales manager can focus on coaching and pipeline management.
- **Scalability:** When a new rep joins the team, all you have to do is add a row to the list.

Of course, not every lead is equally valuable. That's why a good round-robin system rarely works on its own. It works together with prior scoring or segmentation. Classifying your leads first with an [AI-driven B2B lead scoring](https://cornergroup.co/blog/ai-ile-b2b-lead-skorlama-potansiyel-musteri-degerini-artirma-rehberi) approach and then using a separate distribution pool for each segment preserves both fairness and efficiency.

## Round-Robin Models: Which One Fits You?

Before moving on to the setup, you need to decide which model to implement. n8n supports all four. The difference lies in the data structure and calculation logic you use.

### 1. Simple (Sequential) Round-Robin

Reps are listed in order, and each new lead goes to the next person. In a four-person team, the sequence runs A → B → C → D → A. This is the easiest model to set up. It's ideal if everyone on the team has similar seniority and similar capacity.

### 2. Weighted Round-Robin

Each rep is given a weight. For example, a senior account manager might have a weight of 3, a mid-level rep 2 and a newcomer 1. In that case, the distribution in each 6-lead cycle is 3-2-1. This is very useful for ramping up newly hired reps gradually.

### 3. Capacity- and Availability-Based Round-Robin

The rotation still applies, but a few checks run before assignment: Is the rep on leave? Are they within working hours? Has their number of open leads exceeded the limit you've set (for example, 25)? A rep who doesn't meet the criteria is skipped for that round. In real life, this is usually the model that delivers the healthiest results.

### 4. Territory- or Segment-Based Round-Robin

Leads are first split into pools according to a rule. That rule might be country, city, industry, company size or product. Each pool is then distributed internally using round-robin. For example, companies with more than 200 employees go to the "Enterprise" pool, smaller ones go to the "SMB" pool, and each pool has its own rotation.

In practice, most companies use a combination of these: **segment-based pools + capacity-controlled, weighted round-robin within each pool.** We'll design the setup in this article so it can be extended to this hybrid structure.

## Architecture Overview

The workflow we'll build in n8n consists of these main components:

1. **Trigger:** The node that signals a new lead has arrived (Webhook, HubSpot Trigger, Pipedrive Trigger, Typeform, etc.)
2. **Data normalization:** Converting fields from different sources into a single format
3. **Deduplication and existing owner check:** Does the lead or company already exist in the CRM, and who owns it?
4. **Segmentation:** Which pool does the lead belong to?
5. **Fetching the rep list:** Active reps, their weights and capacity information
6. **Calculating the next rep:** The Code node where the round-robin logic runs
7. **CRM update:** Assigning the lead owner
8. **Notification:** Alerting the rep via Slack, Microsoft Teams or email
9. **Logging:** Recording every assignment
10. **Error handling and SLA tracking:** What happens if something goes wrong or the lead isn't touched?

Now let's build these steps one by one.

## Step-by-Step n8n Round-Robin Setup

### Step 1: Prepare the Rep List

The rep list is the heart of a round-robin system. Rather than hard-coding this list inside n8n, we recommend keeping it in an external source. That way, the sales manager can remove someone from the list or change their weight without touching the automation.

Options:

- **Google Sheets or Airtable:** The easiest option for non-technical teams.
- **Postgres / MySQL / Supabase:** The most robust option for high volume and concurrency.
- **n8n Data Tables:** If available in your version, a practical option that requires no external tool.

Example table structure:

| rep_id | name | crm_owner_id | pool | weight | active | max_open_leads | slack_id |
|---|---|---|---|---|---|---|---|
| 1 | Ayşe | 101 | SMB | 2 | TRUE | 30 | U01 |
| 2 | Mert | 102 | SMB | 2 | TRUE | 30 | U02 |
| 3 | Deniz | 103 | Enterprise | 3 | TRUE | 15 | U03 |
| 4 | Can | 104 | SMB | 1 | FALSE | 20 | U04 |

You'll also need a small counter table that stores the **last assigned position** for each pool:

| pool | last_index |
|---|---|
| SMB | 7 |
| Enterprise | 2 |

### Step 2: Set Up the Trigger

Choose a trigger based on your lead source:

- A **Webhook** node for website forms. Your form tool sends a POST request to this URL.
- If you use HubSpot, **HubSpot Trigger** with the "Contact Created" event.
- In Pipedrive, the "Added Person" or "Added Deal" events.
- A **Schedule Trigger** for bulk imports from outbound lists. For example, a query that pulls records with no owner every 10 minutes.

There's an important design decision here: **Real-time triggering or periodic polling?** Real-time triggering wins on speed. Periodic polling, on the other hand, provides a safety net against missed events. The most robust setup uses both together. The main workflow runs in real time, and a second workflow checks every 30 minutes for any leads without an owner.

### Step 3: Normalize the Data

Different sources send the same information under different field names. One says "company_name," another "Şirket," and yet another "organization." Use a **Set** (Edit Fields) node to convert all inputs into a common schema:

- `email`
- `full_name`
- `company`
- `employee_count`
- `country`
- `source` (form, linkedin, outbound, event)
- `brand` (if you have a multi-brand setup)

Converting the email address to lowercase and trimming whitespace should happen at this step. Otherwise, the deduplication check will return incorrect results.

If lead data is incomplete, for example if employee count or industry is missing, segmentation will be wrong too. That's why adding an enrichment layer before the assignment workflow is very helpful. We covered this topic in detail in our article on [B2B lead enrichment automation with n8n](https://cornergroup.co/blog/n8n-ile-b2b-lead-zenginlestirme-otomasyonu-rehberi-verimliligi-artirin). On the outbound side, if you pull your lead lists from a data source like [Apollo.io](https://get.apollo.io/679irkzm35ya), company size and industry fields usually come ready-made, making segmentation far more accurate.

### Step 4: Deduplication and Existing Owner Check

This is the most frequently overlooked round-robin rule: **If a company already has an owner, a new contact from the same company should go to that owner too.** Otherwise, two different reps reach out to the same company. This damages your professionalism in the customer's eyes and creates conflict within the team.

In this step:

1. Search for the contact in the CRM by email address. If the contact exists and already has an owner, end the workflow here or just send a notification.
2. Search for the company using the email domain (`@company.com`). If the company has an owner, assign the lead directly to that person and **do not advance** the round-robin counter.
3. Exclude generic email providers such as Gmail and Hotmail from this check. A simple **IF** node using a list is enough for this.

### Step 5: Segmentation (Assigning the Pool)

Route the lead to pools with a **Switch** node. Example rules:

- `employee_count >= 200` → Enterprise
- `country` outside Türkiye → International
- All other cases → SMB

If you have a lead score, you can add that as a rule too. For example, leads scoring above 80 could go to a "Priority" pool made up of senior reps.

### Step 6: Filter Eligible Reps

Pull the reps in the selected pool from your table and apply these filters:

- `active = TRUE`
- Not on leave that day. You can keep the leave calendar on a separate sheet or query "Out of Office" events from Google Calendar.
- Within working hours. For international teams, check against the rep's time zone.
- Number of open leads below the `max_open_leads` value. You can pull this from the CRM with a per-owner query.

Also define in advance what happens if the list is empty after filtering. The lead can be assigned to a "fallback" person, usually the sales manager or team lead, or held in a queue and given to the first available rep.

### Step 7: Build the Round-Robin Logic in a Code Node

Now we get to the core of the process. The example below implements weighted round-robin logic. Here's how it works: each rep appears in the list as many times as their weight, and the counter rotates through this expanded list.

```javascript
// Input: filtered reps and the pool's last_index value
const reps = $('Eligible Reps').all().map(i => i.json);
const lastIndex = $('Read Counter').first().json.last_index ?? -1;

// Build an expanded queue based on weight
// Ayşe(2), Mert(2), Deniz(1) -> balanced distribution like [Ayşe, Mert, Deniz, Ayşe, Mert]
const maxWeight = Math.max(...reps.map(r => r.weight));
const queue = [];
for (let round = 0; round < maxWeight; round++) {
  for (const rep of reps) {
    if (rep.weight > round) queue.push(rep);
  }
}

if (queue.length === 0) {
  return [{ json: { assigned: null, reason: 'no_eligible_rep' } }];
}

const nextIndex = (lastIndex + 1) % queue.length;
const selected = queue[nextIndex];

return [{
  json: {
    assigned_rep_id: selected.rep_id,
    assigned_name: selected.name,
    crm_owner_id: selected.crm_owner_id,
    slack_id: selected.slack_id,
    new_index: nextIndex
  }
}];
```

One thing to note here: because we interleave the weights in sequence (Ayşe, Mert, Deniz, Ayşe, Mert…), the same rep doesn't receive leads back to back. You could also add someone with a weight of 3 to the list three times in a row, but that creates a short-term feeling of "pile-up."

Another important point: when the rep list changes (someone goes on leave or hits capacity), the queue length changes as well. Thanks to modular arithmetic the system won't break, but there may be small, short-lived imbalances. Monitoring this through weekly reporting is enough.

### Step 8: Update the Counter Safely

The most common technical problem in round-robin automations is the **race condition**. When two leads arrive in the same second, two separate executions read the same `last_index` value and both leads go to the same rep.

Solution options:

- **Atomic update in the database:** If you use Postgres, you can read and increment the counter with a single query: `UPDATE rr_counter SET last_index = last_index + 1 WHERE pool = 'SMB' RETURNING last_index;` This query returns a different value to each execution, even under concurrent requests. You then perform the modulo operation in the Code node. This is the most reliable method for high-volume teams.
- **Queue approach:** Instead of processing the lead directly, the webhook writes it to a table. A separate workflow processes this table in order every minute. This serializes the assignments.
- **n8n workflow static data:** At small volumes, you can keep the counter with `$getWorkflowStaticData('global')`. However, this data only persists in active (production) executions and offers no protection against concurrency. It's suitable for testing or low volume.
- **Google Sheets:** Easy, but has no concurrency protection. If you're going beyond a few dozen leads a day, consider moving to a database.

### Step 9: Assign the Owner in the CRM

Use the selected rep's `crm_owner_id` value to update the record with the relevant CRM node:

- **HubSpot:** Update the `hubspot_owner_id` field on the Contact or Deal record.
- **Pipedrive:** Update the `owner_id` field on the Person or Deal record.
- **Zoho CRM:** Update the `Owner` field on the Lead record.

Creating a task along with the assignment is also good practice. For example, a task titled "First contact – within 2 hours" with a due date automatically lands on the rep's daily to-do list. If your pipeline stages aren't clearly defined yet, check out our guide to [setting up a sales pipeline in HubSpot](https://cornergroup.co/blog/hubspot-satis-pipeline-kurulumu-adim-adim-rehber) to decide which stage the lead enters after assignment.

### Step 10: Notify the Rep

Once the assignment is made, notify the rep immediately. Here's a sample Slack message template:

> 🎯 **New lead assigned:** Ahmet Yılmaz – Example Technology Inc.
> Employees: 120 | Source: Web form | Pool: SMB
> Note: "We're looking for a CRM integration for our team."
> CRM record: [link]
> Target first contact time: 2 hours

Providing context in the message, such as the lead's source, form note and score if available, helps the rep go into the first conversation prepared. If you'd like a broader look at internal notification design, we covered Slack and email scenarios in detail in our article on [automating B2B sales team communication with n8n](https://cornergroup.co/blog/n8n-ile-b2b-satis-ekibi-i-letisiminde-otomasyon-verimlilik-rehberi).

### Step 11: Log Every Assignment

Write the following information to a separate log table:

- Timestamp
- Lead email and company
- Pool
- Assigned rep
- Assignment type (round-robin, existing company owner, fallback person)
- Counter value used

This log is a lifesaver for both debugging and monthly distribution reports. The answer to "Why did Mert get fewer leads this month?" usually shows up in the logs. Maybe he was on leave for 5 days, or maybe he hit his capacity limit.

### Step 12: SLA Tracking and Reassignment

Assignment is only half the job. The other half is making sure the assigned lead actually gets worked. Set up a second n8n workflow:

1. Have it run every 30 minutes with a **Schedule Trigger**.
2. Have it pull leads from the CRM that were assigned in the last 24 hours but have no logged activity (call, email, note).
3. If the threshold you've set is exceeded (for example, 4 hours during working hours), have it send the rep a reminder.
4. If a second threshold is also exceeded (for example, 8 hours), have it reassign the lead to the next rep via round-robin and notify the sales manager.

This mechanism prevents leads from being forgotten in the CRM. It also builds a natural culture of speed within the team.

## Error Handling: Don't Let the System Fail Silently

The most dangerous state for an automation is failing and stopping without telling anyone. Be sure to take these precautions:

- **Error Trigger workflow:** Create a separate error workflow in n8n and select it as the "Error Workflow" in the main workflow's settings. Whenever any node fails, a notification should go to the operations channel.
- **Retry settings:** Enable "Retry On Fail" on CRM API calls, for example 3 attempts with a 5-second wait. Temporary API outages are usually tolerated this way.
- **Rate limits:** For bulk imports, slow down requests with **Loop Over Items** and **Wait** nodes to avoid hitting CRM API limits.
- **Default owner:** No matter what, a lead should never be left without an owner. Set up a fallback branch that assigns the lead to the team lead if the workflow fails.

## Round-Robin in Multi-Brand Setups

In companies that manage multiple brands or business units, lead assignment gets one layer more complex. A lead coming in through the same web infrastructure should go to a different brand's sales team depending on the service it's interested in. Corner Group has a similar structure. Outbound sales requests are routed to the [SAAS Corner team, which provides outbound and lead generation services for B2B SaaS companies](https://saascorner.co), while sales process and pipeline consulting requests go to the [Sales Corner team, which works with a data-driven B2B sales approach](https://salescorner.co).

Here's the setup we recommend for these kinds of structures:

1. **Brand identification:** Determine which brand the lead belongs to from a form field, UTM parameter or landing page URL.
2. **Brand-based pools:** Give each brand its own rep list and its own counter. Simply extending the `pool` field in the counter table to `brand_pool` (for example, "BrandA_SMB") is enough.
3. **Cross-opportunity rule:** If a lead is interested in services from more than one brand, assign it to the primary brand and send a "cross-opportunity" notification to the other brand's team.
4. **Shared company ownership check:** If another brand already has an active relationship with the same company, inform the rep. Having the customer receive two separate proposals from two brands that are unaware of each other is an undesirable situation.

We covered the overall framework of multi-brand automation architecture in more detail in our article on [marketing automation with n8n in multi-brand holding companies](https://cornergroup.co/blog/coklu-markali-holdinglerde-n8n-ile-pazarlama-otomasyonu-rehberi).

## How Do You Measure Success?

Once your round-robin system is up and running, track these metrics weekly or monthly:

- **Leads assigned per rep:** Is it proportional to the weights? For example, in a team weighted 2-2-1, 100 leads would be expected to split roughly 40-40-20.
- **Average time to first contact:** The time from assignment to the first activity. A before-and-after comparison shows the clearest impact.
- **Reassignment rate:** The percentage of leads reassigned due to SLA breaches. If this rate is high, review your capacity limits.
- **Conversion rate by rep:** Progression from lead to meeting, and from meeting to opportunity. Thanks to fair distribution, this comparison is now meaningful.
- **Number of leads falling to the fallback person:** If this happens often, your team capacity may be insufficient or your filters may be too strict.

You can also build a reporting workflow in n8n that pulls these metrics from your log table and CRM, and automatically sends a summary to the sales channel every Monday morning.

## Common Mistakes

- **Not checking the existing company owner:** Having two reps contact the same company is the fastest way to lose trust.
- **Keeping the counter in a test environment:** In n8n, manual test executions don't persist static data. When you go live, you may find the counter starting from zero.
- **Distributing without leave and capacity checks:** A lead sent to a rep on vacation waits a week.
- **Putting all leads into a single pool:** An enterprise opportunity landing with an inexperienced rep is a fair but inefficient outcome.
- **Skipping logging:** When something goes wrong, fixing it without knowing what went where, why and to whom is nearly impossible.
- **Hard-coding the rep list:** You'll have to edit the automation every time there's a staffing change, and the risk of errors increases.

## Conclusion

Round-robin lead assignment automation with n8n is one of the most basic yet most effective improvements you can make to your sales operations. When set up correctly, leads reach the right person within seconds, the workload is distributed fairly and managers are freed from the burden of manual assignment. The key to a robust system lies in a few critical details: existing owner checks, capacity and availability filters, a concurrency-safe counter, SLA tracking and thorough logging. The most practical path is to start with the simple sequential model and add weighting, segment and brand layers as the need arises.

If you want to automate your lead assignment processes, build a round-robin structure integrated with your CRM or scale your multi-brand sales operations with n8n, [get in touch with the Corner Group team](/en/contact). Let's design the right architecture for your needs together.

## FAQ

### Which round-robin model should a sales team choose?

In real life, the capacity- and availability-based model, which checks leave, working hours and an open-lead limit, usually delivers the healthiest results. In the simple sequential model, leads rotate from A to B to C to D and back to A. In the weighted model, weights of 3, 2 and 1 produce a 3-2-1 split in each 6-lead cycle, which is useful for gradually ramping up new hires.

### Why do two leads arriving at the same time go to the same rep?

This is a race condition, where two separate executions read the same last_index value. For high-volume teams, the most reliable fix is an atomic update in Postgres that reads and increments the counter in a single query. Alternatively, leads can be written to a table that a separate workflow processes in order every minute. Google Sheets and n8n workflow static data offer no protection against concurrency.

### How do you make sure assigned leads are followed up on time?

A second SLA-tracking workflow that runs every 30 minutes handles this. It pulls leads assigned in the last 24 hours with no logged activity and sends the rep a reminder once a threshold is exceeded, for example 4 hours during working hours. If a second threshold is also exceeded, for example 8 hours, the lead is reassigned to the next rep and the sales manager is notified.

### How should a new lead be assigned if the company already has an owner?

If the company already has an owner in the CRM, the lead should go directly to that person and the round-robin counter should not advance. Because the company is looked up by email domain, generic providers such as Gmail and Hotmail are excluded from this check. Skipping this step leads to two reps contacting the same company, which is the fastest way to lose trust.
