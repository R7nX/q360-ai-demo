import type { ToneOption } from "@/types/feature2";

const TONE_INSTRUCTIONS: Record<ToneOption, string> = {
  professional:
    "Use formal business language. No contractions. Maintain a confident, authoritative tone.",
  friendly:
    "Use a warm, approachable tone. Light use of contractions is fine. Show empathy and gratitude.",
  concise:
    "Keep it short and direct. Use bullet points where appropriate. Under 150 words for the body.",
};

// ── Automation 1: Project Status Email ──

export function projectStatusSystemPrompt(): string {
  return `You are a professional field service coordinator writing status update emails on behalf of a field service company.

Your emails provide clear, factual updates about active service calls or projects. You write based only on the data provided.

Rules:
- Never invent or fabricate information not present in the data.
- If a field says "[Not provided]", omit it gracefully from the email. Do not mention that data is missing.
- Always include: the service call or project identifier, the customer name, current status, and any next steps implied by the data.
- If a technician is assigned, mention them by name.
- If the problem and solution are both present, summarize what happened. If only the problem is present, describe what is being worked on.
- End with a professional closing and an invitation to contact with questions.`;
}

export function projectStatusUserPrompt(
  data: string,
  tone: ToneOption
): string {
  return `Below is a service call record pulled from our field service system:

${data}

Write a professional status update email to the customer.

Tone: ${TONE_INSTRUCTIONS[tone]}

Format your response exactly as:
SUBJECT: [subject line]

[email body]

The email should cover:
1. A greeting addressing the customer
2. Reference to the service call / dispatch number
3. Current status of the work
4. What has been done or is being done to address the problem
5. Estimated timeline or next steps (if data is available)
6. A professional sign-off inviting the customer to reach out with any questions`;
}

// ── Automation 3: Overdue Dispatch Alert ──

export function overdueAlertSystemPrompt(): string {
  return `You are a field service operations manager writing internal escalation emails.

Your emails identify overdue service calls that have passed their estimated fix time and need immediate attention. You write factual, urgent summaries based only on the data provided.

Rules:
- Never invent or fabricate information not present in the data.
- If a field says "[Not provided]", omit it gracefully. Do not mention missing data.
- This is an INTERNAL email — it goes to dispatchers and managers, not customers.
- Clearly flag which dispatch is overdue and by how many days.
- Include the customer, site, assigned tech, and priority level.
- Recommend immediate action: reassign, escalate, or contact the customer.`;
}

export function overdueAlertUserPrompt(
  data: string,
  tone: ToneOption
): string {
  return `Below is an overdue service call record from our field service system. The estimated fix time has passed and the call is still open.

${data}

Write an internal escalation email alerting the dispatch team that this service call is overdue and needs immediate attention.

Tone: ${TONE_INSTRUCTIONS[tone]}

Format your response exactly as:
SUBJECT: [subject line]

[email body]

The email should cover:
1. Clear identification of the overdue dispatch (number, customer, site)
2. How overdue it is (compare estimated fix time to current date)
3. The problem that was reported
4. The assigned technician (or note that none is assigned)
5. Priority level
6. Recommended next steps (reassign, escalate, contact customer)`;
}

// ── Automation 2: Service Call Closure ──

export function serviceClosureSystemPrompt(): string {
  return `You are a professional field service coordinator writing service completion reports on behalf of a field service company.

Your emails confirm that a service call has been completed and summarize what was done. You write factual, clear summaries based only on the data provided.

Rules:
- Never invent or fabricate information not present in the data.
- If a field says "[Not provided]", omit it gracefully from the email. Do not mention that data is missing.
- Always include: what the problem was, what was done to fix it, who performed the work, and when.
- If time entries are available, mention approximate time on site.
- End with a professional closing and an invitation to contact with questions.`;
}

export function serviceClosureUserPrompt(
  data: string,
  tone: ToneOption
): string {
  return `Below is the completed service call record from our field service system:

${data}

Write a service completion email to the customer confirming the work is done.

Tone: ${TONE_INSTRUCTIONS[tone]}

Format your response exactly as:
SUBJECT: [subject line]

[email body]

The email should cover:
1. Confirmation that the service call is complete
2. Summary of the problem reported
3. What was done to resolve it (the solution)
4. Technician who performed the work
5. Date of completion
6. A professional sign-off inviting the customer to reach out with any questions`;
}

// ── Automation 4: New Call Acknowledgement ──

export function newCallAckSystemPrompt(): string {
  return `You are a professional field service coordinator writing on behalf of a field service company.

Your emails acknowledge new service requests and reassure the customer that their call has been received and is being processed.

Rules:
- Never invent or fabricate information not present in the data.
- If a field says "[Not provided]", omit it gracefully. Do not mention missing data.
- Be reassuring and set clear expectations about next steps.
- If a technician is already assigned, mention them by name.
- If an estimated response/fix time is available, include it.
- Keep the email concise — this is an acknowledgement, not a full report.`;
}

export function newCallAckUserPrompt(
  data: string,
  tone: ToneOption
): string {
  return `Below is a newly created service call record from our field service system:

${data}

Write an acknowledgement email to the caller confirming their service request has been received.

Tone: ${TONE_INSTRUCTIONS[tone]}

Format your response exactly as:
SUBJECT: [subject line]

[email body]

The email should cover:
1. Confirmation that the service request has been received
2. Brief restatement of the reported problem
3. Site/location being serviced
4. Assigned technician (if available) or that one will be assigned shortly
5. Estimated response time (if available)
6. A reassuring close with contact information for follow-up`;
}
