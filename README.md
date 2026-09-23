# Master Thesis Job Tracker — V1 Product Requirements Document

## 1. Product Overview

### Product Name
Master Thesis Tracker

### Product Goal
Build a personal visual CRM for managing Master Thesis opportunities from discovery to final outcome.

The product should answer five questions quickly:

1. What thesis opportunities have I found?
2. Which ones do I still need to apply to?
3. Which applications are currently active?
4. What has happened in each application process, and when?
5. What should I do next?

The product should not behave like a simple spreadsheet. It should model the application process as a sequence of events over time.

---

# 2. Core User Workflow

The main workflow is:

Discover Job  
→ Save Job  
→ Decide to Apply  
→ Submit Application  
→ Receive Interview Invitation  
→ Attend Interview(s)  
→ Receive Offer / Rejection / Withdraw

Each job has relatively static information.

Each application has a dynamic timeline.

These two concepts must remain separate in the data model.

---

# 3. Information Architecture

The product contains four main views:

## 3.1 Dashboard

Purpose:

Provide an immediate overview of the thesis search.

Display:

- Total tracked jobs
- Jobs to apply
- Applications submitted
- Active interviews
- Offers
- Rejections
- Upcoming deadlines
- Action needed

Example:

Tracked: 42  
To Apply: 8  
Applied: 20  
Interview: 4  
Offer: 1

### Action Needed

Examples:

- Volvo — deadline in 2 days
- Ericsson — interview in 3 days
- Saab — saved 8 days ago, no action taken
- Siemens Energy — waiting for response for 18 days

---

## 3.2 Jobs

Primary database/table for all thesis opportunities.

Recommended columns:

- Company
- Job title
- Location
- Categories
- Release date
- Deadline
- Applied date
- Current status
- Priority
- Next action

Optional columns can be hidden to keep the table compact.

Supported views:

- All
- Saved
- To Apply
- Applied
- Interview
- Offer
- Rejected

Filters:

- Company
- Location
- Category
- Status
- Priority

Sorting:

- Release date
- Deadline
- Applied date
- Last activity

Search should support job title and company.

---

# 4. Data Model

## 4.1 Job

A Job represents the thesis opportunity itself.

Fields:

### id
Unique identifier.

### title
Example:

Master Thesis — AI-Based Fault Diagnosis

Required.

### company
Example:

Ericsson  
Volvo  
Siemens Energy

Required.

### location
Example:

Stockholm  
Göteborg  
Linköping  
Finspång

Optional.

### application_url
Original job posting URL.

Optional but recommended.

### release_date
Date when the job was published.

Optional.

### deadline
Application deadline.

Optional.

### categories
Multi-select tag field.

A job can belong to multiple categories.

Initial categories:

- Applied ML
- Machine Learning
- Sensor Fusion
- Robotics
- SLAM
- Computer Vision
- LLM
- NLP
- RAG
- Signal Processing
- Communication
- Data Engineering
- ML Engineering
- Bayesian / Probabilistic ML
- Embedded / Edge AI
- Industrial AI
- Other

Users must be able to create custom categories.

### priority

Values:

- High
- Medium
- Low

Optional.

### notes
Free text notes.

### job_description
Optional saved snapshot of the original job description.

This is useful because external job postings may later disappear.

### created_at
Automatically generated.

### updated_at
Automatically generated.

---

# 4.2 Application

An Application represents my relationship with a Job.

One Job should normally have one Application.

Fields:

### id

Unique identifier.

### job_id

Foreign key pointing to Job.

### applied_at

Date the application was submitted.

Null if not yet applied.

### workflow_state

Internal application stage.

Possible values:

- Saved
- To Apply
- Applied
- Interview
- Offer
- Rejected
- Withdrawn

### next_action

Free text.

Examples:

Prepare CV  
Write cover letter  
Prepare SLAM interview  
Follow up  
Wait for response

### next_action_date

Optional date associated with the next action.

### last_activity_at

Automatically derived from the latest event.

---

# 4.3 Application Event

This is the most important part of the system.

Application status changes must be recorded as events instead of storing only one final result field.

Schema:

### id

Unique identifier.

### application_id

Foreign key pointing to Application.

### event_type

Suggested values:

- Job Saved
- Marked To Apply
- Application Submitted
- Interview Invitation
- Interview Round 1
- Interview Round 2
- Technical Interview
- HR Interview
- Case / Assignment
- Follow-up Sent
- Offer Received
- Rejection Received
- Application Withdrawn
- Other

### received_at

When I received the message or notification.

Example:

Interview invitation received on September 28.

### event_date

When the actual event happens.

Example:

Interview scheduled for October 3.

Important:

`received_at` and `event_date` must be separate fields.

Example:

Event type:
Interview Invitation

Received at:
2026-09-28

Event date:
2026-10-03

This means the invitation was received on September 28 and the interview occurs on October 3.

### notes

Optional details about the event.

Example:

First interview with hiring manager and technical supervisor.

### created_at

Automatically generated.

---

# 5. Status Logic

The user should not need to manually update the status repeatedly.

Current status should be synchronized with application events whenever possible.

Examples:

Application Submitted
→ Applied

Interview Invitation
→ Interview

Offer Received
→ Offer

Rejection Received
→ Rejected

Application Withdrawn
→ Withdrawn

The latest meaningful event determines the current state.

Manual override may be allowed if needed.

---

# 6. Job Detail View

Clicking a job should open a side drawer or detail page.

The top section contains:

Company  
Job Title  
Location  
Categories  
Priority  
Application URL

Dates:

Release Date  
Deadline  
Applied Date

Current Status

Next Action

---

## Application Timeline

The most visually important section.

Example:

Sep 21  
Application submitted

Sep 28  
Interview invitation received

Oct 3  
Interview round 1

Oct 7  
Second interview invitation received

Oct 11  
Interview round 2

Oct 20  
Offer received

Timeline entries must display both relevant dates when appropriate.

For example:

Interview Invitation

Received:
Sep 28

Interview:
Oct 3

---

# 7. Add Job Flow

A prominent:

+ Add Job

button should open a form.

Fields:

Job Title  
Company  
Location  
Application URL  
Release Date  
Deadline  
Categories  
Priority  
Notes  
Job Description

At creation time, the user should also be able to choose:

Saved

or

To Apply

as the initial state.

---

# 8. Add Application Event Flow

Inside a job detail view:

+ Add Event

Button.

Form fields:

Event Type  
Received Date  
Event Date  
Notes

Fields should react to the event type.

For example:

Rejection Received

Only Received Date is normally necessary.

Interview Invitation

Both:

Received Date  
Interview Date

should be visible.

Application Submitted

Only Applied Date is required.

---

# 9. Dashboard

## KPI Cards

Show:

Tracked Jobs  
To Apply  
Applied  
Interviewing  
Offers

Rejections can appear as a smaller secondary metric.

---

## Action Needed

Rank items based on urgency.

Examples:

Deadline approaching  
Interview approaching  
No action after saving job  
Waiting unusually long for response

---

## Recent Activity

Chronological feed.

Example:

Today  
Ericsson — Interview invitation

Yesterday  
Volvo — Application submitted

Sep 20  
Saab — Job saved

---

# 10. Analytics

Analytics can exist in V1 but should remain simple.

Metrics:

### Application Funnel

Tracked  
Applied  
Interview  
Offer

### Applications by Category

Example:

Applied ML — 12  
Sensor Fusion — 6  
Robotics — 5

### Interview Rate by Category

Interviews / Applications

### Response Time

Calculate:

First response date − Applied date

Possible future aggregation:

Average response time by company.

---

# 11. UX Principles

The visual design should feel like a modern personal productivity tool rather than a corporate HR system.

Design principles:

- Clean
- Minimal
- Information-dense
- Calm
- Fast to scan
- Desktop-first but responsive
- Dark mode optional

Avoid excessive cards.

The Jobs table should remain the primary information interface.

Use color only to communicate status.

Status examples:

Saved — neutral  
To Apply — blue  
Applied — purple  
Interview — orange  
Offer — green  
Rejected — muted red / gray

Categories should use small pill-style tags.

---

# 12. MVP Scope

V1 should include:

- Add/edit/delete jobs
- Multi-category tags
- Job database
- Job detail drawer
- Application event timeline
- Status synchronization
- Filters
- Search
- Sort
- Dashboard
- Basic analytics
- Local or database persistence

---

# 13. Out of Scope for V1

Do not implement yet:

- Automatic job scraping
- Automatic application submission
- AI CV generation
- AI cover letter generation
- Automatic job matching
- Gmail parsing
- Browser extensions
- Calendar integrations
- External job-board integrations

These can be added later after the core workflow is stable.

---

# 14. Future Features

Possible V2 features:

### JD Snapshot
Save full job description so that information remains available after the posting disappears.

### AI Job Analysis
Extract:

- Required skills
- Preferred skills
- Thesis topic
- Technical keywords
- Match with my experience

### Interview Preparation
Generate:

- Likely technical questions
- Relevant coursework
- Relevant projects
- Concepts to review

### Email Integration
Automatically detect:

Interview invitations  
Rejections  
Offers

and create corresponding application events.

### Calendar Integration
Add interviews and deadlines to calendar.

### Smart Insights

Examples:

Your Applied ML applications have a higher interview rate.

You usually receive the first response after 11 days.

You currently have three applications with no response for more than two weeks.
