# Thesis Track Pro

Build a responsive web application called Master Thesis Tracker.

This is a personal CRM for managing Master Thesis job opportunities and application processes.

The app should feel like a modern productivity tool such as Linear, Notion, or a lightweight CRM, rather than a traditional HR system.

The most important product concept is:

A Job and an Application Event are different entities.

Do NOT model interview, offer, or rejection as simple independent columns such as result and result_date.

Instead, every application should have an event timeline.

Main Navigation

Create three main sections:

Dashboard

Jobs

Analytics

Use a clean left sidebar navigation.

Data Model

Create these main entities.

Job

Fields:

id

title

company

location

application_url

release_date

deadline

categories

priority

notes

job_description

created_at

updated_at

categories must support multiple tags.

Initial categories:

Applied ML
Machine Learning
Sensor Fusion
Robotics
SLAM
Computer Vision
LLM
NLP
RAG
Signal Processing
Communication
Data Engineering
ML Engineering
Bayesian / Probabilistic ML
Embedded / Edge AI
Industrial AI
Other

Users must also be able to create custom categories.

Priority values:

High
Medium
Low

Application

Fields:

id

job_id

applied_at

workflow_state

next_action

next_action_date

last_activity_at

Workflow states:

Saved
To Apply
Applied
Interview
Offer
Rejected
Withdrawn

ApplicationEvent

Fields:

id

application_id

event_type

received_at

event_date

notes

created_at

Important:

received_at means when I received information.

event_date means when the actual event occurs.

Example:

Interview Invitation

received_at:
2026-09-28

event_date:
2026-10-03

This means I received the invitation on September 28 and the interview happens on October 3.

Do not merge these two dates.

Suggested event types:

Job Saved
Marked To Apply
Application Submitted
Interview Invitation
Interview Round 1
Interview Round 2
Technical Interview
HR Interview
Case / Assignment
Follow-up Sent
Offer Received
Rejection Received
Application Withdrawn
Other

Dashboard

Create a clean overview.

At the top display KPI cards:

Tracked Jobs
To Apply
Applied
Interviewing
Offers

Below that create:

Action Needed

Display urgent or upcoming items such as:

application deadlines

upcoming interviews

next actions

jobs marked To Apply but not yet submitted

Example items:

Volvo — Deadline in 2 days — Apply

Ericsson — Interview in 3 days — Prepare

Saab — To Apply — No action yet

Recent Activity

Display recent ApplicationEvents in chronological order.

Example:

Today
Ericsson — Interview invitation

Yesterday
Volvo — Application submitted

Sep 20
Saab — Job saved

Jobs Page

This should be the primary working interface.

Create a clean table.

Columns:

Company
Job Title
Category
Location
Released
Deadline
Applied
Status
Priority
Next Action

Allow:

Search
Filter
Sort

Filters:

Company
Location
Category
Status
Priority

Create quick status tabs:

All
Saved
To Apply
Applied
Interview
Offer
Rejected

Make table rows clickable.

Job Detail Drawer

When clicking a job, open a right-side drawer.

Show:

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

Notes

Job Description

Application Timeline

This timeline is one of the most important parts of the interface.

Display application events vertically.

Example:

Sep 23
Application submitted

Sep 28
Interview invitation received

Interview scheduled:
Oct 3

Oct 3
Interview Round 1

Oct 20
Offer received

If both received_at and event_date exist, display both clearly.

Add Job

Create a prominent + Add Job button.

Form fields:

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

Initial state:

Saved
or
To Apply

Add Event

Inside the Job Detail Drawer add:

+ Add Event

Open a form.

Fields:

Event Type
Received Date
Event Date
Notes

Make the form context-aware.

For example:

If Event Type = Application Submitted

show:

Application Date

If Event Type = Interview Invitation

show:

Received Date
Interview Date

If Event Type = Rejection Received

show:

Received Date

If Event Type = Offer Received

show:

Received Date

Status Automation

Update the current workflow state based on meaningful events.

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

The system should avoid inconsistent states between the timeline and the displayed current status.

Analytics

Create a simple analytics page.

Include:

Application Funnel

Tracked
Applied
Interview
Offer

Applications by Category

Interview rate by category

Average time to first response

Calculate first response time as:

first meaningful response date - applied date

Do not overcomplicate analytics in the first version.

Design Direction

Use a modern minimal visual style.

Desktop-first but responsive.

Use:

clear typography

restrained spacing

subtle borders

compact tables

rounded category tags

status badges

minimal use of color

Avoid excessive cards.

Use status colors consistently.

Suggested semantic colors:

Saved — neutral gray
To Apply — blue
Applied — purple
Interview — amber / orange
Offer — green
Rejected — muted red
Withdrawn — gray

The application timeline should feel visually polished and easy to scan.

Seed Data

Add several realistic example jobs so the UI is populated on first load.

Example companies:

Ericsson
Volvo Group
Siemens Energy
Saab

Example thesis topics:

AI for Radio Networks

Machine Learning for Autonomous Systems

AI-Based Fault Diagnosis for Gas Turbines

Sensor Fusion for Autonomous Navigation

Use locations such as:

Stockholm
Göteborg
Finspång
Linköping

Include examples with different states:

Saved
To Apply
Applied
Interview
Rejected

Include at least one job with a multi-step interview timeline.

Important Product Constraint

Do not build this as a spreadsheet clone.

The core interaction model should be:

Job → Application → Timeline of Events

The timeline must preserve the history of the application process instead of only showing the latest result.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://thesis-timeline-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bc3370a1-7dbc-4f61-88a9-99ee98765c16).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
