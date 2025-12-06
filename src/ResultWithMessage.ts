export interface ResultWithMessage {
  success: boolean;
  message(): string;
  getMessages(): string[];
  addMessage(message: string): void;
}

export class Result implements ResultWithMessage {
  public constructor(status: boolean, message: string) {
    this.success = status;
    this.text = [message];
  }

  public message(): string {
    return this.text.join('\n');
  }

  public getMessages(): string[] {
    return this.text;
  }

  public addMessage(message: string): void {
    this.text.push(message);
  }

  public addMessages(messages: string[]): void {
    this.text.push(...messages);
  }

  public success: boolean;
  public text: string[];
}

export class Success {
  public static create(message: string) {
    return new Result(true, message);
  }
}

export class Failure {
  public static create(message: string) {
    return new Result(false, message);
  }
}
