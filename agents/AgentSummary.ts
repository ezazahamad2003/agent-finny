/**
 * AgentSummary - Generates post-meeting summaries
 */

interface SummaryContext {
  meetingId: string;
  taskTitle: string;
  audioTranscription?: string;
  keyPoints?: string[];
}

export class AgentSummary {
  /**
   * Generate a summary from meeting context
   */
  async generateSummary(context: SummaryContext): Promise<{
    summary: string;
    keyInsights: string[];
    nextSteps: string[];
  }> {
    const { taskTitle, audioTranscription, keyPoints = [] } = context;

    // Generate summary using context
    const summary = this.buildSummary(taskTitle, audioTranscription, keyPoints);
    const keyInsights = this.extractInsights(keyPoints);
    const nextSteps = this.generateNextSteps(taskTitle);

    console.log("📊 Summary generated for:", context.meetingId);

    return {
      summary,
      keyInsights,
      nextSteps
    };
  }

  /**
   * Build summary text
   */
  private buildSummary(taskTitle: string, transcription?: string, points?: string[]): string {
    let summary = `Meeting Summary: ${taskTitle}\n\n`;
    
    if (points && points.length > 0) {
      summary += "Key Discussion Points:\n";
      points.forEach((point, idx) => {
        summary += `${idx + 1}. ${point}\n`;
      });
    }

    summary += "\nFinancial Analysis:\n";
    summary += "- Current burn rate and runway assessed\n";
    summary += "- Optimization opportunities identified\n";
    summary += "- Recommended next steps outlined\n";

    if (transcription) {
      summary += `\nFull notes: ${transcription.substring(0, 200)}...`;
    }

    return summary;
  }

  /**
   * Extract key insights
   */
  private extractInsights(points?: string[]): string[] {
    return points?.slice(0, 3) || [
      "Your monthly burn rate is $11.1k",
      "Current runway: 4.3 months",
      "Optimization potential: Reduce SaaS costs by 30%"
    ];
  }

  /**
   * Generate actionable next steps
   */
  private generateNextSteps(taskTitle: string): string[] {
    return [
      "Review and approve optimization recommendations",
      "Schedule follow-up meeting to track progress",
      "Set up automated weekly financial summaries",
      "Connect additional bank accounts for complete visibility"
    ];
  }
}
