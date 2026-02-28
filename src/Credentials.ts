export class Credentials {
    constructor(
        private readonly username: string,
        private readonly password: string,
        private readonly twoFaSecret: string,
    ) {}

    getUsername(): string {
        return this.username;
    }

    getPassword(): string {
        return this.password;
    }

    getTwoFaSecret(): string {
        return this.twoFaSecret;
    }
}
