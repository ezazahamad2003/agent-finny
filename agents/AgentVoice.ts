/**
 * AgentVoice - Generates voice audio and chat transcripts
 * Powers the voice-based meeting experience
 */

import { generateVoice, AudioResult } from "../frontend/lib/lava";

interface VoiceContext {
  taskTitle: string;
  taskDescription: string;
  meetingType?: "finance" | "general";
}

export class AgentVoice {
  private script: string[] = [];
  private audioUrl: string = "";
  private duration: number = 0;

  /**
   * Generate script and audio for a meeting context
   */
  async generateScriptAndAudio(context: VoiceContext): Promise<{
    audioUrl: string;
    duration: number;
    script: string[];
  }> {
    const introText = this.generateIntro(context);
    
    const result: AudioResult = await generateVoice({
      text: introText,
      voice: "professional-female",
      speed: 1.0
    });

    this.script = result.script;
    this.audioUrl = result.audioUrl;
    this.duration = result.duration;

    return {
      audioUrl: this.audioUrl,
      duration: this.duration,
      script: this.script
    };
  }

  /**
   * Generate introductory script based on context
   */
  private generateIntro(context: VoiceContext): string {
    const { taskTitle, taskDescription, meetingType = "finance" } = context;

    if (meetingType === "finance") {
      return `Hello! I'm FINNY, your AI CFO assistant. 
              We're discussing ${taskTitle}. ${taskDescription}.
              Let me walk you through the key insights and recommendations.
              First, let's review your financial position and burn rate.
              Next, I'll share optimization opportunities.
              Finally, I'll provide actionable next steps.`;
    }

    return `Hi there! I'm FINNY. We're here to discuss ${taskTitle}. 
            ${taskDescription}. Let's dive right in.`;
  }

  /**
   * Get the generated script
   */
  getScript(): string[] {
    return this.script;
  }

  /**
   * Get audio URL
   */
  getAudioUrl(): string {
    return this.audioUrl;
  }
}
