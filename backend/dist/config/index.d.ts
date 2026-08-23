export declare const config: {
    readonly port: number;
    readonly nodeEnv: string;
    readonly frontendUrl: string;
    readonly adminUrl: string;
    readonly database: {
        readonly url: string;
    };
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
        readonly refreshSecret: string;
        readonly refreshExpiresIn: string;
    };
    readonly razorpay: {
        readonly keyId: string;
        readonly keySecret: string;
        readonly webhookSecret: string;
    };
    readonly upload: {
        readonly dir: string;
        readonly maxFileSize: number;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
    };
    readonly admin: {
        readonly defaultEmail: string;
        readonly defaultPassword: string;
    };
};
//# sourceMappingURL=index.d.ts.map