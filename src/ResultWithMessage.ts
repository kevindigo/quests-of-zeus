export interface ResultWithMessage {
  success: boolean;
  message: string;
}

export class Success implements ResultWithMessage {
  public constructor(message: string) {
    this.success = true;
    this.message = message;
  }

  public success: boolean;
  public message: string;
}

export class Failure implements ResultWithMessage {
  public constructor(message: string) {
    this.success = false;
    this.message = message;
  }

  public success: boolean;
  public message: string;
}
