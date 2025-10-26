/**
 * AgentOrchestrator - Main brain that coordinates all agents
 */

import { AgentMeeting } from "./AgentMeeting";
import { AgentSummary } from "./AgentSummary";
import { sendEmail } from "../frontend/lib/email";

interface TaskInput {
  title: string;
  description: string;
  email: string;
}

interface TaskResult {
  meetingUrl: string;
  meetingId: string;
  audioUrl: string;
  summary?: string;
}

export class AgentOrchestrator {
  private meeting: AgentMeeting;
  private summary: AgentSummary;

  constructor() {
    this.meeting = new AgentMeeting();
    this.summary = new AgentSummary();
  }

  /**
   * Create a task and run the full workflow
   */
  async createTask(input: TaskInput): Promise<TaskResult> {
    console.log("🎯 Orchestrator: Starting task workflow");

    // Step 1: Create meeting with voice prep
    const meeting = await this.meeting.createMeeting({
      taskTitle: input.title,
      taskDescription: input.description,
      email: input.email
    });

    console.log("✅ Meeting created:", meeting.meetingUrl);

    // Step 2: Generate preliminary summary
    const summaryResult = await this.summary.generateSummary({
      meetingId: meeting.meetingId,
      taskTitle: input.title
    });

    console.log("✅ Summary generated");

    // Step 3: Send email (optional)
    try {
      await sendEmail({
        to: input.email,
        subject: `Meeting Ready: ${input.title}`,
        body: `Your meeting is ready! Join here: ${meeting.meetingUrl}`
      });
      console.log("✅ Email sent");
    } catch (error) {
      console.warn("⚠️ Email failed (demo mode)");
    }

    return {
      meetingUrl: meeting.meetingUrl,
      meetingId: meeting.meetingId,
      audioUrl: meeting.audioUrl,
      summary: summaryResult.summary
    };
  }

  /**
   * Complete a meeting and generate final summary
   */
  async completeMeeting(meetingId: string): Promise<{
    summary: string;
    insights: string[];
    nextSteps: string[];
  }> {
    console.log("🎯 Orchestrator: Completing meeting", meetingId);

    const result = await this.summary.generateSummary({
      meetingId,
      taskTitle: "Completed Meeting"
    });

    console.log("✅ Meeting completed with summary");

    return result;
  }
}
