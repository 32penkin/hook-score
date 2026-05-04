# HookScore

## Short Pitch

HookScore is a lightweight creator tool that evaluates the first 3 seconds of a short-form video idea before the creator spends time editing or posting it.

The product is not a viral-content oracle. It does not promise views. It checks whether the opening has the mechanics that usually make a TikTok, Reel, or Short easier to understand and harder to skip.

> Paste the hook, describe the video, optionally add the first-frame screenshot, and get a score plus stronger rewrites.

## Product Naming

Working product name:

- HookScore.

Alternative names:

- HookCheck.
- First3.
- ThreeSec.
- ScrollStop.
- HookLab.

Why HookScore fits:

- It explains the product immediately.
- It is specific to short-form creator workflow.
- It supports a simple repeated action: test the hook before posting.
- It can expand from text-only hooks into screenshot and video checks later.

## Product Thesis

Creators often lose viewers before the actual content starts. The problem is not always production quality. It is often that the first seconds are unclear, slow, generic, or hide the payoff too long.

The wedge:

- Short-form creators already care about retention.
- The first few seconds are easy to isolate.
- Text-first analysis is cheap enough for MVP and beta testing.
- The output is concrete: rewrite the opening, change first-frame text, or start with the result.

The product should feel like a fast pre-posting check, not a full content strategy platform.

## Target Users

### Primary

- TikTok, Reels, and Shorts creators.
- Small business owners posting organic short-form content.
- Coaches, consultants, and educators making short videos.
- Indie makers and solopreneurs posting product updates.
- UGC creators preparing hooks for brand videos.

### Secondary

- Social media managers.
- Agencies testing multiple hook angles.
- Course creators repurposing long content into short clips.
- Founders preparing launch videos.

## Core User Journey

### First Check

1. User enters:
   - the first spoken line or on-screen text;
   - what the video is about;
   - target audience;
   - goal: views, trust, sales, education, or comments.

2. Optional input:
   - screenshot of the first frame;
   - caption draft;
   - transcript of the first 3-5 seconds.

3. App returns:
   - overall Hook Score;
   - sub-scores;
   - main reason viewers may skip;
   - best fix;
   - 3 rewritten hooks;
   - first-frame text suggestion.

4. User saves a variant, retries, or copies the rewrite.

### Repeat Check

1. User tests 3-5 hook variants.
2. App ranks them.
3. User selects the strongest opening before recording or editing.

## Input Scope

MVP should avoid video processing.

Use:

- hook text;
- short video description;
- niche;
- target viewer;
- goal;
- optional screenshot of first frame.

Avoid at MVP:

- uploading full videos;
- extracting video frames;
- motion analysis;
- retention prediction from past metrics;
- platform API integrations.

## Output Format

The result should be short enough for a creator to act on immediately.

Example:

- Score: 58.
- Verdict: weak but fixable.
- Main problem: the hook starts with setup and hides the payoff.
- Best fix: start with the result, mistake, cost, or contradiction.
- First-frame text: "I wasted $300 on this mistake."
- Rewrite 1: "I wasted $300 learning this so you do not have to."
- Rewrite 2: "This one beginner mistake made my setup look cheap."
- Rewrite 3: "Before you buy this, check these 3 details."

## Scoring Rubric

HookScore should grade mechanics, not claim to predict virality.

Core dimensions:

- Clarity: can the viewer understand the topic in 1 second?
- Specificity: does it avoid generic wording?
- Payoff speed: does it reveal why watching matters quickly?
- Curiosity: is there an open loop without being vague?
- Audience fit: does it speak to a clear viewer?
- Visual-text match: does the first-frame text match the video idea?
- Scroll resistance: is there enough tension, result, mistake, contrast, or stakes?

Structured output example:

```json
{
  "score": 72,
  "verdict": "okay",
  "clarity": 8,
  "specificity": 7,
  "payoffSpeed": 5,
  "curiosity": 7,
  "audienceFit": 8,
  "visualTextMatch": 6,
  "scrollResistance": 6,
  "mainProblem": "The opening is clear but the payoff arrives too late.",
  "bestFix": "Move the result into the first sentence.",
  "rewrites": [
    "I tried this for 7 days and the result surprised me.",
    "This looks wrong, but it fixed my biggest editing problem.",
    "Stop doing this if your videos die after 3 seconds."
  ]
}
```

## Hook Pattern Library

No fine-tuning is needed for MVP. Start with a pattern library and a rubric.

Useful hook patterns:

- costly mistake;
- "I tried X so you do not have to";
- before/after;
- unexpected result;
- myth vs reality;
- contrarian take;
- specific number;
- challenge;
- open loop;
- "nobody tells you";
- "stop doing X";
- teardown;
- transformation;
- proof-first;
- problem-first.

The app should choose patterns that match the user's niche and goal, then rewrite the hook.

## AI Scope

MVP does not need model fine-tuning.

Use:

- careful prompts;
- few-shot examples;
- structured JSON output;
- scoring rubric;
- hook pattern library;
- optional vision model for first-frame screenshot analysis.

Do not use at MVP:

- fine-tuning;
- custom ranking model;
- video understanding;
- platform metric ingestion;
- automated posting.

When fine-tuning could help later:

- after collecting thousands of hooks;
- after users attach real retention metrics;
- after A/B comparisons show which rewrites perform better;
- when building a niche-specific scoring model for creator categories.

Even then, the likely next step is not fine-tuning the whole LLM. It is a lightweight ranking model or calibration layer.

## MVP Scope

Build a simple product with:

- hook input form;
- target audience field;
- video goal selector;
- niche selector;
- optional first-frame screenshot upload;
- score screen;
- 3 rewrite options;
- variant comparison;
- history;
- copy/share actions;
- credit/paywall placeholder.

Do not build:

- full video analysis;
- scheduling;
- account connection to TikTok or Instagram;
- analytics dashboard;
- team workflow;
- content calendar.

## Monetization

Possible model:

- 3 free checks.
- Daily free check with ad or cooldown.
- Credit packs:
  - 20 checks;
  - 100 checks.
- Subscription for active creators.
- Paid packs:
  - niche hook formulas;
  - UGC hook pack;
  - product launch hook pack;
  - expert/coach hook pack.

Good paid trigger:

- user wants to compare multiple variants before posting;
- user wants screenshot analysis;
- user wants niche-specific rewrites;
- user wants saved history and templates.

## Validation Plan

Validate before building heavy tooling:

1. Create a landing page with examples.
2. Manually review 50 creator hooks.
3. Ask users to submit a hook and get 3 rewrites.
4. Track whether users use a rewrite or ask for another variant.
5. Test whether creators would pay for batches, not just one check.

Good early signal:

- creators test multiple hooks in one session;
- they copy a rewrite;
- they come back before posting another video;
- they ask for niche-specific formulas;
- they want to compare 5 hooks at once.

Bad early signal:

- users treat it as a one-time toy;
- they only want full video editing advice;
- they disagree with scores but do not use rewrites;
- they expect guaranteed views.

## Risks

### Product

- Users may expect viral prediction.
- Feedback can become generic.
- Creators may already use ChatGPT for hook rewrites.

Mitigation:

- Position as mechanics check, not prediction.
- Use a strict rubric and concise score cards.
- Make variant comparison faster than prompting ChatGPT manually.

### Cost

- Text-only checks are cheap.
- Screenshot checks cost more.
- Video checks can become expensive quickly.

Mitigation:

- Keep MVP text-first.
- Make screenshot analysis paid or limited.
- Delay video upload until there is evidence of retention and willingness to pay.

### Trust

- The app cannot know whether a video will succeed.
- Platform algorithms and audience context change.

Mitigation:

- Never promise views.
- Explain what the score measures.
- Use user feedback and real metrics later to calibrate the product.

## Positioning

Strong positioning:

> Score your first 3 seconds before you post.

Alternative:

> Turn weak short-form hooks into scroll-stopping openings.

Avoid:

- "Guaranteed viral videos".
- "Beat the algorithm".
- "AI predicts your views".
- "Upload any video and we know if it will go viral".

The product should answer one narrow question:

> Will a stranger understand why to keep watching in the first 3 seconds?
