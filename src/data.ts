import type { Message } from "./types";

const POOL: string[] = [
  "Hey, can you explain how Pretext works?",
  "Pretext uses a two-phase approach. First it measures word widths using an off-screen Canvas and caches the results. Then all layout calculations are pure math — no page reads at all. That's why it's hundreds of times faster.",
  "So the page never freezes while measuring text?",
  "Exactly. The old way forces the browser to pause everything and re-measure the entire page layout just to get one element's height. Pretext skips that entirely by doing its own arithmetic instead.",
  "How much faster is it really?",
  "Measuring 500 text bubbles the old way takes 15–30 milliseconds and causes 500 page freezes. Pretext does the same job in under 0.1 milliseconds with zero freezes. That's roughly 500 times faster.",
  "Does it work in different languages?",
  "Yes — English, Chinese, Arabic, Japanese, emoji, mixed scripts. It uses the browser's own font engine as a reference so every language works correctly, including right-to-left text.",
  "Who made this?",
  "Cheng Lou — he was on the React core team at Meta, created react-motion which has 21,000+ GitHub stars, and now builds the frontend at Midjourney serving millions of users with just five engineers.",
  "Why does this matter for a chat app?",
  "Three reasons: smooth scrolling through thousands of messages, stable layout while AI is typing its response, and silky 60fps animations. All three require knowing text height before rendering — and doing it fast.",
  "Can I use this in my current project?",
  "Yes. One npm install, two functions — prepare() and layout(). It works with any JavaScript framework: React, Vue, Svelte, or plain HTML. No configuration needed.",
  "What about performance on slower devices?",
  "That's where it helps most. On a low-end phone the old approach can drop frames visibly. Pretext keeps the calculation so lightweight that even budget hardware stays smooth.",
  "Is the code open source?",
  "Yes, MIT licensed on GitHub at chenglou/pretext. It went from zero to 7,000 stars in a few days, which tells you how long the frontend community has been waiting for this.",
];

export function generateMessages(count = 80): Message[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
    text: POOL[i % POOL.length],
    timestamp: new Date(Date.now() - (count - i) * 45000),
  }));
}

export const SCROLL_MESSAGES: Message[] = generateMessages(120);

export const STREAM_TEXT =
  "This response is arriving word by word, just like a real AI assistant. Watch the left side carefully — the chat bubble keeps growing and pushing everything below it down the page. That jumping is called a layout shift, and it happens on every single new line. Now look at the right side. The space for this message was reserved before the first word arrived, so nothing moves at all. That is the difference Pretext makes.";
