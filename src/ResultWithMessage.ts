export interface ResultWithMessage {
  success: boolean;
  message(): string;
  getMessages(): string[];
}

export class Success implements ResultWithMessage {
  public constructor(message: string) {
    this.success = true;
    this.text = [message];
  }

  public message(): string {
    return this.text.join('\n');
  }

  public getMessages(): string[] {
    return this.text;
  }

  public success: boolean;
  public text: string[];
}

export class Failure implements ResultWithMessage {
  public constructor(message: string) {
    this.success = false;
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

  public success: boolean;
  public text: string[];
}
