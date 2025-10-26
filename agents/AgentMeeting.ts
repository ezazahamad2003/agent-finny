/**
 * AgentMeeting - Creates meeting links and manages sessions
 */

import { AgentVoice } from "./AgentVoice";

interface MeetingContext {
  taskTitle: string;
  taskDescription: string;
  email: string;
}

export class AgentMeeting {
  private voice: AgentVoice;

  constructor() {
    this.voice = new AgentVoice();
  }

  /**
   * Create a new meeting with voice prep
   */
  async createMeeting(context: MeetingContext): Promise<{
    meetingUrl: string;
    meetingId: string;
    audioUrl: string;
    script: string[];
  }> {
    const meetingId = this.generateMeetingId();
    const meetingUrl = `/meet/${meetingId}`;

    // Generate voice and script
    const voiceResult = await this.voice.generateScriptAndAudio({
      taskTitle: context.taskTitle,
      taskDescription: context.taskDescription,
      meetingType: "finance"
    });

    // TODO: Save to Supabase
    // await this.saveMeetingToDB({
    //   id: meetingId,
    //   url: meetingUrl,
    //   audioUrl: voiceResult.audioUrl,
    //   script: voiceResult.script,
    //   task: context
    // });

    console.log("📅 Meeting created:", { meetingId, meetingUrl });

    return {
      meetingUrl,
      meetingId,
      audioUrl: voiceResult.audioUrl,
      script: voiceResult.script
    };
  }

  /**
   * Generate a unique meeting ID
   */
  private generateMeetingId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}
